<?php
/**
 * URL Crawler — Fetches a webpage and converts it to Markdown
 * POST { "url": "https://..." }
 * Returns { "markdown": "...", "title": "...", "url": "..." }
 */
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

require_once '../config/auth.php';
startSecureSession();
if (empty($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Authentication required']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$url  = trim($data['url'] ?? '');

if (!$url) {
    http_response_code(400);
    echo json_encode(['error' => 'URL is required']);
    exit;
}

// Validate URL
if (!filter_var($url, FILTER_VALIDATE_URL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid URL format']);
    exit;
}

// Block private/local URLs for security
$host = parse_url($url, PHP_URL_HOST);
$blocked = ['localhost', '127.0.0.1', '0.0.0.0', '::1'];
foreach ($blocked as $b) {
    if ($host === $b || str_ends_with($host, '.local')) {
        http_response_code(403);
        echo json_encode(['error' => 'Private/local URLs are not allowed']);
        exit;
    }
}

// Fetch the page
$ctx = stream_context_create([
    'http' => [
        'method'          => 'GET',
        'timeout'         => 15,
        'follow_location' => 1,
        'max_redirects'   => 5,
        'header'          => implode("\r\n", [
            'User-Agent: Mozilla/5.0 (compatible; PromptDB/1.0; +https://prompt-db.dainedvorak.com)',
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

if ($html === false) {
    http_response_code(422);
    echo json_encode(['error' => 'Failed to fetch the URL. The server may be unreachable or blocking requests.']);
    exit;
}

// Limit size (2MB)
if (strlen($html) > 2 * 1024 * 1024) {
    $html = substr($html, 0, 2 * 1024 * 1024);
}

// Extract title
$title = '';
if (preg_match('/<title[^>]*>([^<]+)<\/title>/i', $html, $m)) {
    $title = html_entity_decode(trim($m[1]), ENT_QUOTES | ENT_HTML5, 'UTF-8');
}

// Convert HTML → Markdown (pure PHP, no dependencies)
$markdown = htmlToMarkdown($html, $url);

echo json_encode([
    'markdown' => $markdown,
    'title'    => $title,
    'url'      => $url,
    'length'   => strlen($markdown),
]);

/**
 * HTML to Markdown converter (lightweight, no external deps)
 */
function htmlToMarkdown(string $html, string $baseUrl = ''): string {
    // Remove script/style/nav/footer/aside/head
    $html = preg_replace('/<(script|style|noscript|nav|footer|aside|header|head)[^>]*>.*?<\/\1>/is', '', $html);
    // Remove comments
    $html = preg_replace('/<!--.*?-->/s', '', $html);
    // Remove remaining tags except useful ones; convert structural tags first

    // Headings
    for ($i = 6; $i >= 1; $i--) {
        $hashes = str_repeat('#', $i);
        $html = preg_replace_callback("/<h{$i}[^>]*>(.*?)<\/h{$i}>/is", function($m) use ($hashes) {
            $text = strip_tags($m[1]);
            return "\n{$hashes} " . trim($text) . "\n\n";
        }, $html);
    }

    // Paragraphs
    $html = preg_replace_callback('/<p[^>]*>(.*?)<\/p>/is', function($m) {
        $text = strip_tags($m[1]);
        return "\n" . trim($text) . "\n\n";
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

    // Links
    $html = preg_replace_callback('/<a[^>]+href=["\']([^"\']*)["\'][^>]*>(.*?)<\/a>/is', function($m) use ($baseUrl) {
        $href = $m[1];
        $text = strip_tags($m[2]);
        if (!$text) return '';
        // Make relative URLs absolute
        if ($href && !str_starts_with($href, 'http') && !str_starts_with($href, '#') && $baseUrl) {
            $parsed = parse_url($baseUrl);
            $href = $parsed['scheme'] . '://' . $parsed['host'] . '/' . ltrim($href, '/');
        }
        return "[{$text}]({$href})";
    }, $html);

    // Images
    $html = preg_replace_callback('/<img[^>]+(?:src=["\']([^"\']*)["\'])[^>]*(?:alt=["\']([^"\']*)["\'])?[^>]*\/?>/is', function($m) {
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

    // Tables → simple text
    $html = preg_replace_callback('/<table[^>]*>(.*?)<\/table>/is', function($m) {
        $rows = [];
        preg_match_all('/<tr[^>]*>(.*?)<\/tr>/is', $m[1], $trs);
        foreach ($trs[1] as $tr) {
            $cells = [];
            preg_match_all('/<(td|th)[^>]*>(.*?)<\/\1>/is', $tr, $tds);
            foreach ($tds[2] as $td) {
                $cells[] = trim(strip_tags($td));
            }
            $rows[] = '| ' . implode(' | ', $cells) . ' |';
        }
        return "\n" . implode("\n", $rows) . "\n\n";
    }, $html);

    // Line breaks / divs / sections → newlines
    $html = preg_replace('/<br\s*\/?>/', "\n", $html);
    $html = preg_replace('/<\/(div|section|article|main)[^>]*>/i', "\n", $html);
    $html = preg_replace('/<hr[^>]*\/?>/', "\n---\n", $html);
    $html = preg_replace('/&nbsp;/i', ' ', $html);

    // Strip remaining tags
    $html = strip_tags($html);

    // Decode HTML entities
    $html = html_entity_decode($html, ENT_QUOTES | ENT_HTML5, 'UTF-8');

    // Ensure valid UTF-8 (prevents json_encode failures downstream)
    $html = mb_convert_encoding($html, 'UTF-8', 'UTF-8');
    if (function_exists('iconv')) {
        $clean = @iconv('UTF-8', 'UTF-8//IGNORE', $html);
        if ($clean !== false) $html = $clean;
    }

    // ── Aggressive whitespace cleanup ──────────────────────────────────────
    // Strip trailing spaces from every line
    $html = preg_replace('/[  \t]+$/m', '', $html);  // trailing spaces/tabs per line
    // Strip lines that contain only whitespace
    $html = preg_replace('/^[\s]+$/m', '', $html);
    // Collapse 3+ consecutive blank lines down to one blank line
    $html = preg_replace('/\n{3,}/', "\n\n", $html);
    // Remove leading blank lines
    $html = ltrim($html, "\n");
    $html = trim($html);

    return $html;
}
