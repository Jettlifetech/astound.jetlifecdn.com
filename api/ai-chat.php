<?php
// AI Chat Streaming Proxy
// Receives prompt + provider + api_key, streams AI response back as SSE
// If the prompt contains any bare URLs (http/https), the page is fetched,
// converted to Markdown, and injected into the prompt automatically.

// Disable output buffering for streaming
@ini_set('output_buffering', 'off');
@ini_set('zlib.output_compression', false);
@ini_set('max_execution_time', 180);
if (function_exists('apache_setenv')) {
    @apache_setenv('no-gzip', '1');
}

// Handle CORS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Content-Type: application/json');
    header('Access-Control-Allow-Origin: *');
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Auth check (must happen before SSE headers)
require_once '../config/auth.php';
startSecureSession();
if (empty($_SESSION['user_id'])) {
    header('Content-Type: application/json');
    http_response_code(401);
    echo json_encode(['error' => 'Authentication required']);
    exit;
}

// SSE headers
header('Content-Type: text/event-stream');
header('Cache-Control: no-cache');
header('Connection: keep-alive');
header('X-Accel-Buffering: no');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Turn off any remaining output buffering
while (ob_get_level()) ob_end_flush();

// Parse request
$data     = json_decode(file_get_contents('php://input'), true);
$prompt   = $data['prompt']   ?? '';
$provider = $data['provider'] ?? '';
$apiKey   = $data['api_key']  ?? '';

if (!$prompt || !$provider || !$apiKey) {
    sendSSE(['error' => 'Missing required fields: prompt, provider, api_key']);
    sendDone();
    exit;
}

// Validate provider
$validProviders = ['claude', 'openai', 'gemini'];
if (!in_array($provider, $validProviders, true)) {
    sendSSE(['error' => 'Invalid provider. Must be one of: ' . implode(', ', $validProviders)]);
    sendDone();
    exit;
}

// ── URL Expansion ─────────────────────────────────────────────────────────────
// Detects all bare https?:// URLs in the prompt, fetches each page,
// converts to Markdown, and replaces the URL with a content block.
// URLs that are already part of [text](url) Markdown links are skipped.
$prompt = expandUrlsInPrompt($prompt);

// ── SSE helpers ───────────────────────────────────────────────────────────────
function sendSSE($data) {
    echo "data: " . json_encode($data) . "\n\n";
    if (ob_get_level()) ob_flush();
    flush();
}

function sendDone() {
    echo "data: [DONE]\n\n";
    if (ob_get_level()) ob_flush();
    flush();
}

// Route to provider
try {
    switch ($provider) {
        case 'claude':  streamClaude($prompt, $apiKey);  break;
        case 'openai':  streamOpenAI($prompt, $apiKey);  break;
        case 'gemini':  streamGemini($prompt, $apiKey);  break;
    }
} catch (Exception $e) {
    sendSSE(['error' => $e->getMessage()]);
}
sendDone();


// ═════════════════════════════════════════════════════════════════════════════
//  URL EXPANSION
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Finds all bare https?:// URLs in the prompt that are NOT already inside a
 * Markdown link [text](url) or image ![alt](url), fetches each page, converts
 * it to Markdown, and replaces the bare URL with a structured content block.
 *
 * Also handles the pattern:  Page URL: https://example.com
 * which is the url_prompt_template convention used by Schema Generator.
 */
function expandUrlsInPrompt(string $prompt): string {
    // Match bare URLs — not preceded by ]( (already inside a markdown link)
    // and not preceded by ![  
    // Pattern: word boundary + http(s):// + non-whitespace chars
    $urlPattern = '/(?<!\]\()(?<!\!\[)(?<!["\'])\b(https?:\/\/[^\s\[\]<>"\'`,]+)/';

    $urls = [];
    if (preg_match_all($urlPattern, $prompt, $matches)) {
        $urls = array_unique($matches[1]);
    }

    if (empty($urls)) return $prompt;

    foreach ($urls as $url) {
        // Skip URLs that are private/local
        $host = @parse_url($url, PHP_URL_HOST);
        if (!$host) continue;
        $blockedHosts = ['localhost', '127.0.0.1', '0.0.0.0', '::1'];
        $isBlocked = false;
        foreach ($blockedHosts as $b) {
            if ($host === $b || str_ends_with($host, '.local')) { $isBlocked = true; break; }
        }
        if ($isBlocked) continue;

        // Fetch and convert
        $result = fetchAndConvertUrl($url);

        if ($result['success']) {
            $md     = $result['markdown'];
            $title  = $result['title'] ?: $url;
            $chars  = strlen($md);
            // Truncate if very large (keep first 50k chars to stay within token limits)
            if ($chars > 50000) {
                $md = substr($md, 0, 50000) . "\n\n[...content truncated at 50,000 characters...]";
            }
            $block = "\n\n--- BEGIN PAGE CONTENT: {$url} ---\n"
                   . "Title: {$title}\n"
                   . "URL: {$url}\n\n"
                   . $md
                   . "\n--- END PAGE CONTENT: {$url} ---\n\n";
            // Replace the bare URL with the content block, but only first occurrence
            // to avoid doubling up if the URL appears multiple times
            $prompt = str_replace($url, $block, $prompt);
        } else {
            // If fetch failed, leave a note but don't break the prompt
            $errBlock = "\n\n[NOTE: Could not fetch content from {$url} — {$result['error']}]\n\n";
            $prompt = str_replace($url, $errBlock, $prompt);
        }
    }

    return $prompt;
}

/**
 * Fetches a URL and converts its HTML to Markdown.
 * Returns ['success'=>bool, 'markdown'=>string, 'title'=>string, 'error'=>string]
 */
function fetchAndConvertUrl(string $url): array {
    $ctx = stream_context_create([
        'http' => [
            'method'          => 'GET',
            'timeout'         => 20,
            'follow_location' => 1,
            'max_redirects'   => 5,
            'ignore_errors'   => true,
            'header'          => implode("\r\n", [
                'User-Agent: Mozilla/5.0 (compatible; PromptDB-AI/1.0; +https://prompt-db.dainedvorak.com)',
                'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language: en-US,en;q=0.5',
            ])
        ],
        'ssl' => [
            'verify_peer'      => false,
            'verify_peer_name' => false,
        ]
    ]);

    $html = @file_get_contents($url, false, $ctx);

    if ($html === false || $html === '') {
        return ['success' => false, 'markdown' => '', 'title' => '', 'error' => 'Page could not be fetched'];
    }

    // Check HTTP response code from headers
    $httpCode = 200;
    if (!empty($http_response_header)) {
        foreach ($http_response_header as $hdr) {
            if (preg_match('/^HTTP\/\S+\s+(\d+)/', $hdr, $m)) {
                $httpCode = (int)$m[1];
            }
        }
    }
    if ($httpCode >= 400) {
        return ['success' => false, 'markdown' => '', 'title' => '', 'error' => "HTTP {$httpCode}"];
    }

    // Limit size
    if (strlen($html) > 2 * 1024 * 1024) {
        $html = substr($html, 0, 2 * 1024 * 1024);
    }

    // Extract title
    $title = '';
    if (preg_match('/<title[^>]*>([^<]+)<\/title>/i', $html, $m)) {
        $title = html_entity_decode(trim($m[1]), ENT_QUOTES | ENT_HTML5, 'UTF-8');
    }

    // Convert to Markdown
    $markdown = htmlToMarkdown($html, $url);

    return ['success' => true, 'markdown' => $markdown, 'title' => $title, 'error' => ''];
}

/**
 * Lightweight HTML → Markdown converter (no external dependencies).
 * Same implementation as crawl.php for consistency.
 */
function htmlToMarkdown(string $html, string $baseUrl = ''): string {
    // Remove script/style/noscript/nav/footer/aside/header/head
    $html = preg_replace('/<(script|style|noscript|nav|footer|aside|header|head)[^>]*>.*?<\/\1>/is', '', $html);
    // Remove HTML comments
    $html = preg_replace('/<!--.*?-->/s', '', $html);

    // Headings h1–h6
    for ($i = 6; $i >= 1; $i--) {
        $hashes = str_repeat('#', $i);
        $html = preg_replace_callback("/<h{$i}[^>]*>(.*?)<\/h{$i}>/is", function($m) use ($hashes) {
            return "\n{$hashes} " . trim(strip_tags($m[1])) . "\n\n";
        }, $html);
    }

    // Paragraphs
    $html = preg_replace_callback('/<p[^>]*>(.*?)<\/p>/is', function($m) {
        return "\n" . trim(strip_tags($m[1])) . "\n\n";
    }, $html);

    // Bold / strong
    $html = preg_replace('/<(strong|b)[^>]*>(.*?)<\/\1>/is', '**$2**', $html);
    // Italic / em
    $html = preg_replace('/<(em|i)[^>]*>(.*?)<\/\1>/is', '*$2*', $html);
    // Code inline
    $html = preg_replace('/<code[^>]*>(.*?)<\/code>/is', '`$1`', $html);
    // Pre/code blocks
    $html = preg_replace_callback('/<pre[^>]*>(.*?)<\/pre>/is', function($m) {
        $text = strip_tags($m[1]);
        return "\n```\n" . trim(html_entity_decode($text, ENT_QUOTES | ENT_HTML5, 'UTF-8')) . "\n```\n\n";
    }, $html);

    // Links — make relative URLs absolute
    $html = preg_replace_callback('/<a[^>]+href=["\'](.*?)["\'][^>]*>(.*?)<\/a>/is', function($m) use ($baseUrl) {
        $href = $m[1];
        $text = trim(strip_tags($m[2]));
        if (!$text) return '';
        if ($href && !str_starts_with($href, 'http') && !str_starts_with($href, '#') && !str_starts_with($href, 'mailto:') && $baseUrl) {
            $parsed = parse_url($baseUrl);
            if (str_starts_with($href, '/')) {
                $href = $parsed['scheme'] . '://' . $parsed['host'] . $href;
            } else {
                $href = $parsed['scheme'] . '://' . $parsed['host'] . '/' . ltrim($href, '/');
            }
        }
        return "[{$text}]({$href})";
    }, $html);

    // Images
    $html = preg_replace_callback('/<img[^>]*src=["\'](.*?)["\'][^>]*(?:alt=["\'](.*?)["\'])?[^>]*\/?>/is', function($m) {
        $alt = isset($m[2]) ? trim($m[2]) : 'image';
        return "![{$alt}]({$m[1]})";
    }, $html);

    // Unordered lists
    $html = preg_replace_callback('/<ul[^>]*>(.*?)<\/ul>/is', function($m) {
        $items = [];
        preg_match_all('/<li[^>]*>(.*?)<\/li>/is', $m[1], $lis);
        foreach ($lis[1] as $li) {
            $items[] = '- ' . trim(strip_tags($li));
        }
        return "\n" . implode("\n", $items) . "\n\n";
    }, $html);

    // Ordered lists
    $html = preg_replace_callback('/<ol[^>]*>(.*?)<\/ol>/is', function($m) {
        $items = [];
        $i = 1;
        preg_match_all('/<li[^>]*>(.*?)<\/li>/is', $m[1], $lis);
        foreach ($lis[1] as $li) {
            $items[] = "{$i}. " . trim(strip_tags($li));
            $i++;
        }
        return "\n" . implode("\n", $items) . "\n\n";
    }, $html);

    // Tables → Markdown table format
    $html = preg_replace_callback('/<table[^>]*>(.*?)<\/table>/is', function($m) {
        $rows = [];
        $isFirst = true;
        preg_match_all('/<tr[^>]*>(.*?)<\/tr>/is', $m[1], $trs);
        foreach ($trs[1] as $tr) {
            $cells = [];
            preg_match_all('/<(td|th)[^>]*>(.*?)<\/\1>/is', $tr, $tds);
            foreach ($tds[2] as $td) {
                $cells[] = trim(strip_tags($td));
            }
            if (!$cells) continue;
            $rows[] = '| ' . implode(' | ', $cells) . ' |';
            if ($isFirst) {
                $rows[] = '|' . str_repeat(' --- |', count($cells));
                $isFirst = false;
            }
        }
        return "\n" . implode("\n", $rows) . "\n\n";
    }, $html);

    // Line breaks / structural elements → newlines
    $html = preg_replace('/<br\s*\/?>/i', "\n", $html);
    $html = preg_replace('/<\/(div|section|article|main|li)[^>]*>/i', "\n", $html);
    $html = preg_replace('/<hr[^>]*\/?>/i', "\n---\n", $html);
    $html = preg_replace('/&nbsp;/i', ' ', $html);

    // Strip remaining tags
    $html = strip_tags($html);

    // Decode HTML entities
    $html = html_entity_decode($html, ENT_QUOTES | ENT_HTML5, 'UTF-8');

    // Clean up excessive whitespace/newlines
    $html = preg_replace('/\n{3,}/', "\n\n", $html);
    $html = preg_replace('/[ \t]+\n/', "\n", $html);
    $html = trim($html);

    return $html;
}


// ═════════════════════════════════════════════════════════════════════════════
//  PROVIDER STREAMING IMPLEMENTATIONS
// ═════════════════════════════════════════════════════════════════════════════

function streamClaude(string $prompt, string $apiKey): void {
    $url = 'https://api.anthropic.com/v1/messages';
    $payload = json_encode([
        'model'      => 'claude-sonnet-4-20250514',
        'max_tokens' => 8192,
        'stream'     => true,
        'messages'   => [
            ['role' => 'user', 'content' => $prompt]
        ]
    ]);

    $headers = [
        'Content-Type: application/json',
        'x-api-key: ' . $apiKey,
        'anthropic-version: 2023-06-01'
    ];

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => $payload,
        CURLOPT_HTTPHEADER     => $headers,
        CURLOPT_RETURNTRANSFER => false,
        CURLOPT_TIMEOUT        => 180,
        CURLOPT_WRITEFUNCTION  => function($ch, $data) {
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            if ($httpCode >= 400) {
                $json = json_decode($data, true);
                $msg = $json['error']['message'] ?? "Claude API error (HTTP $httpCode)";
                sendSSE(['error' => $msg]);
                return strlen($data);
            }
            $lines = explode("\n", $data);
            foreach ($lines as $line) {
                $line = trim($line);
                if (strpos($line, 'data: ') === 0) {
                    $json = json_decode(substr($line, 6), true);
                    if ($json) {
                        $type = $json['type'] ?? '';
                        if ($type === 'content_block_delta') {
                            $text = $json['delta']['text'] ?? '';
                            if ($text !== '') sendSSE(['text' => $text]);
                        } elseif ($type === 'error') {
                            sendSSE(['error' => $json['error']['message'] ?? 'Claude API error']);
                        }
                    }
                }
            }
            return strlen($data);
        }
    ]);

    curl_exec($ch);
    if (curl_errno($ch)) {
        sendSSE(['error' => 'Connection error: ' . curl_error($ch)]);
    }
    curl_close($ch);
}

function streamOpenAI(string $prompt, string $apiKey): void {
    $url = 'https://api.openai.com/v1/chat/completions';
    $payload = json_encode([
        'model'      => 'gpt-4o',
        'stream'     => true,
        'messages'   => [
            ['role' => 'user', 'content' => $prompt]
        ]
    ]);

    $headers = [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $apiKey
    ];

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => $payload,
        CURLOPT_HTTPHEADER     => $headers,
        CURLOPT_RETURNTRANSFER => false,
        CURLOPT_TIMEOUT        => 180,
        CURLOPT_WRITEFUNCTION  => function($ch, $data) {
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            if ($httpCode >= 400) {
                $json = json_decode($data, true);
                $msg = $json['error']['message'] ?? "OpenAI API error (HTTP $httpCode)";
                sendSSE(['error' => $msg]);
                return strlen($data);
            }
            $lines = explode("\n", $data);
            foreach ($lines as $line) {
                $line = trim($line);
                if (strpos($line, 'data: ') === 0) {
                    $lineData = substr($line, 6);
                    if ($lineData === '[DONE]') return strlen($data);
                    $json = json_decode($lineData, true);
                    if ($json) {
                        $text = $json['choices'][0]['delta']['content'] ?? '';
                        if ($text !== '') sendSSE(['text' => $text]);
                    }
                }
            }
            return strlen($data);
        }
    ]);

    curl_exec($ch);
    if (curl_errno($ch)) {
        sendSSE(['error' => 'Connection error: ' . curl_error($ch)]);
    }
    curl_close($ch);
}

function streamGemini(string $prompt, string $apiKey): void {
    $url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?alt=sse&key=' . urlencode($apiKey);
    $payload = json_encode([
        'contents' => [
            ['parts' => [['text' => $prompt]]]
        ]
    ]);

    $headers = ['Content-Type: application/json'];

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => $payload,
        CURLOPT_HTTPHEADER     => $headers,
        CURLOPT_RETURNTRANSFER => false,
        CURLOPT_TIMEOUT        => 180,
        CURLOPT_WRITEFUNCTION  => function($ch, $data) {
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            if ($httpCode >= 400) {
                $json = json_decode($data, true);
                $msg = $json['error']['message'] ?? "Gemini API error (HTTP $httpCode)";
                sendSSE(['error' => $msg]);
                return strlen($data);
            }
            $lines = explode("\n", $data);
            foreach ($lines as $line) {
                $line = trim($line);
                if (strpos($line, 'data: ') === 0) {
                    $json = json_decode(substr($line, 6), true);
                    if ($json && isset($json['candidates'])) {
                        $text = $json['candidates'][0]['content']['parts'][0]['text'] ?? '';
                        if ($text !== '') sendSSE(['text' => $text]);
                    }
                }
            }
            return strlen($data);
        }
    ]);

    curl_exec($ch);
    if (curl_errno($ch)) {
        sendSSE(['error' => 'Connection error: ' . curl_error($ch)]);
    }
    curl_close($ch);
}
?>
