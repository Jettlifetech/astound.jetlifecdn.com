<?php
// AI Chat Streaming Proxy
// Receives prompt + provider + api_key, streams AI response back as SSE

// Disable output buffering for streaming
@ini_set('output_buffering', 'off');
@ini_set('zlib.output_compression', false);
@ini_set('max_execution_time', 120);
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
$data = json_decode(file_get_contents('php://input'), true);
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

// SSE helpers
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
        case 'claude':
            streamClaude($prompt, $apiKey);
            break;
        case 'openai':
            streamOpenAI($prompt, $apiKey);
            break;
        case 'gemini':
            streamGemini($prompt, $apiKey);
            break;
    }
} catch (Exception $e) {
    sendSSE(['error' => $e->getMessage()]);
}
sendDone();

// --- Provider implementations ---

function streamClaude($prompt, $apiKey) {
    $url = 'https://api.anthropic.com/v1/messages';
    $payload = json_encode([
        'model'      => 'claude-sonnet-4-20250514',
        'max_tokens' => 4096,
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
        CURLOPT_TIMEOUT        => 120,
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

function streamOpenAI($prompt, $apiKey) {
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
        CURLOPT_TIMEOUT        => 120,
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

function streamGemini($prompt, $apiKey) {
    $url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?alt=sse&key=' . urlencode($apiKey);
    $payload = json_encode([
        'contents' => [
            ['parts' => [['text' => $prompt]]]
        ]
    ]);

    $headers = [
        'Content-Type: application/json'
    ];

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => $payload,
        CURLOPT_HTTPHEADER     => $headers,
        CURLOPT_RETURNTRANSFER => false,
        CURLOPT_TIMEOUT        => 120,
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
