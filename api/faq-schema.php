<?php
/**
 * FAQ Schema Generator — DOCX Processor
 *
 * POST multipart/form-data:
 *   file     — the uploaded .docx file
 *   provider — claude | openai | gemini
 *   api_key  — the user's API key for the selected provider
 *
 * Response:
 *   On success: JSON { success: true, download_url: "...", filename: "..." }
 *   On error:   JSON { error: "..." }
 *
 * Process:
 *  1. Unzip the DOCX (it's a ZIP archive) and extract word/document.xml
 *  2. Parse the XML to extract all paragraph text (preserving order)
 *  3. Detect the FAQ section (headings containing "FAQ" / "Frequently Asked Questions")
 *  4. Extract Q&A pairs that follow the FAQ heading
 *  5. Build a prompt and call the chosen AI provider (non-streaming, await full response)
 *  6. Parse the returned JSON-LD schema
 *  7. Inject a new paragraph containing the schema code at the end of the DOCX XML
 *  8. Repack into a new DOCX, save with "FAQ-Schema-Added" suffix
 *  9. Return download URL
 */

// ── Max execution time (DOCX processing + AI call) ───────────────────────────
@ini_set('max_execution_time', 180);

// ── CORS / content type ───────────────────────────────────────────────────────
header('Content-Type: application/json');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    http_response_code(200);
    exit;
}

// ── Auth ──────────────────────────────────────────────────────────────────────
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

// ── Input validation ──────────────────────────────────────────────────────────
$provider = trim($_POST['provider'] ?? '');
$apiKey   = trim($_POST['api_key']  ?? '');
$validProviders = ['claude', 'openai', 'gemini'];

if (!in_array($provider, $validProviders, true)) {
    echo json_encode(['error' => 'Invalid provider. Must be one of: ' . implode(', ', $validProviders)]);
    exit;
}
if (!$apiKey) {
    echo json_encode(['error' => 'API key is required']);
    exit;
}
if (empty($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
    $uploadErrors = [
        UPLOAD_ERR_INI_SIZE   => 'File exceeds server upload limit',
        UPLOAD_ERR_FORM_SIZE  => 'File exceeds form size limit',
        UPLOAD_ERR_PARTIAL    => 'File only partially uploaded',
        UPLOAD_ERR_NO_FILE    => 'No file was uploaded',
        UPLOAD_ERR_NO_TMP_DIR => 'Missing temporary folder',
        UPLOAD_ERR_CANT_WRITE => 'Failed to write file to disk',
        UPLOAD_ERR_EXTENSION  => 'A PHP extension blocked the upload',
    ];
    $code = $_FILES['file']['error'] ?? UPLOAD_ERR_NO_FILE;
    echo json_encode(['error' => $uploadErrors[$code] ?? 'Upload error code ' . $code]);
    exit;
}

$uploadedFile = $_FILES['file'];
$originalName = basename($uploadedFile['name']);
$ext          = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));

if ($ext !== 'docx') {
    echo json_encode(['error' => 'Only .docx files are supported']);
    exit;
}

if ($uploadedFile['size'] > 20 * 1024 * 1024) {
    echo json_encode(['error' => 'File too large (max 20 MB)']);
    exit;
}

// ── Ensure uploads dir exists ──────────────────────────────────────────────────
$uploadsDir = __DIR__ . '/../data/faq-schema-uploads';
if (!is_dir($uploadsDir)) {
    mkdir($uploadsDir, 0755, true);
}

// ── Step 1: Extract document.xml from the DOCX (ZIP) ─────────────────────────
if (!class_exists('ZipArchive')) {
    echo json_encode(['error' => 'php-zip extension not available on this server']);
    exit;
}

$tmpPath = $uploadedFile['tmp_name'];
$zip = new ZipArchive();
if ($zip->open($tmpPath) !== true) {
    echo json_encode(['error' => 'Could not open the DOCX file — it may be corrupted']);
    exit;
}

$docXml = $zip->getFromName('word/document.xml');
$zip->close();

if ($docXml === false) {
    echo json_encode(['error' => 'word/document.xml not found inside the DOCX']);
    exit;
}

// ── Step 2: Parse paragraphs from document.xml ───────────────────────────────
/**
 * Extract all paragraph text nodes from the Open XML document.xml.
 * Returns array of ['text' => string, 'style' => string] per paragraph.
 */
function parseDocxParagraphs(string $xml): array {
    $dom = new DOMDocument();
    $dom->loadXML($xml, LIBXML_NOWARNING | LIBXML_NOERROR);
    $body = $dom->getElementsByTagNameNS(
        'http://schemas.openxmlformats.org/wordprocessingml/2006/main', 'body'
    )->item(0);

    if (!$body) return [];

    $paragraphs = [];
    $ns = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';

    foreach ($body->childNodes as $node) {
        if ($node->localName !== 'p') continue;

        // Get paragraph style (Heading1, Heading2, Normal, etc.)
        $style = 'Normal';
        $pPr = $node->getElementsByTagNameNS($ns, 'pPr')->item(0);
        if ($pPr) {
            $pStyle = $pPr->getElementsByTagNameNS($ns, 'pStyle')->item(0);
            if ($pStyle) {
                $style = $pStyle->getAttributeNS($ns, 'val');
                if (!$style) $style = $pStyle->getAttribute('w:val');
            }
        }

        // Accumulate all run text nodes (w:t inside w:r)
        $text = '';
        $runs = $node->getElementsByTagNameNS($ns, 'r');
        foreach ($runs as $run) {
            $tNodes = $run->getElementsByTagNameNS($ns, 't');
            foreach ($tNodes as $t) {
                $text .= $t->textContent;
            }
        }

        $paragraphs[] = [
            'text'  => $text,
            'style' => $style,
        ];
    }

    return $paragraphs;
}

$paragraphs = parseDocxParagraphs($docXml);

if (empty($paragraphs)) {
    echo json_encode(['error' => 'No readable paragraphs found in the document']);
    exit;
}

// ── Step 3: Find FAQ section ──────────────────────────────────────────────────
/**
 * Locate the FAQ heading and extract Q&A pairs that follow it.
 * Heuristics:
 *  - Heading paragraph whose text matches "FAQ" or "Frequently Asked Questions"
 *  - After the heading, consecutive non-empty paragraphs are treated as
 *    alternating Question / Answer pairs (common content brief format)
 *  - Also handles explicit "Q:" / "A:" prefixes
 *  - Stops collecting at the next major heading after the FAQ heading
 */
function extractFaqPairs(array $paragraphs): array {
    $faqStart = -1;

    // Find FAQ heading
    foreach ($paragraphs as $i => $p) {
        $txt = strtolower(trim($p['text']));
        $isHeading = preg_match('/^heading/i', $p['style']);
        if (
            ($isHeading || strlen($txt) < 120) &&
            (str_contains($txt, 'faq') || str_contains($txt, 'frequently asked'))
        ) {
            $faqStart = $i;
            break;
        }
    }

    if ($faqStart === -1) {
        // No heading found — try the full doc as FAQ content
        // (user may have uploaded a pure FAQ doc)
        $faqStart = 0;
    }

    // Collect paragraphs after the FAQ heading until we hit another major heading
    $faqParas = [];
    for ($i = $faqStart + 1; $i < count($paragraphs); $i++) {
        $p = $paragraphs[$i];
        $isNewHeading = preg_match('/^heading[12]/i', $p['style']) &&
                        $i > $faqStart + 1 &&
                        !preg_match('/faq|frequently asked/i', strtolower($p['text']));
        if ($isNewHeading) break;
        if (trim($p['text']) !== '') {
            $faqParas[] = $p['text'];
        }
    }

    if (empty($faqParas)) return [];

    // Try to detect explicit Q: A: prefixes
    $hasExplicitQA = false;
    foreach ($faqParas as $line) {
        if (preg_match('/^(Q[:.)\s]|Question[:.)\s])/i', trim($line))) {
            $hasExplicitQA = true;
            break;
        }
    }

    $pairs = [];
    if ($hasExplicitQA) {
        $currentQ = '';
        $currentA = '';
        foreach ($faqParas as $line) {
            $line = trim($line);
            if (preg_match('/^(Q[:.)\s]|Question[:.)\s])(.*)/is', $line, $m)) {
                if ($currentQ && $currentA) {
                    $pairs[] = ['question' => $currentQ, 'answer' => $currentA];
                }
                $currentQ = trim($m[2]);
                $currentA = '';
            } elseif (preg_match('/^(A[:.)\s]|Answer[:.)\s])(.*)/is', $line, $m)) {
                $currentA = trim($m[2]);
            } else {
                // Continuation of previous answer
                if ($currentQ) {
                    $currentA .= ($currentA ? ' ' : '') . $line;
                }
            }
        }
        if ($currentQ && $currentA) {
            $pairs[] = ['question' => $currentQ, 'answer' => $currentA];
        }
    } else {
        // Assume alternating Q / A (no explicit prefixes)
        // Questions tend to end with '?' or be shorter paragraphs
        for ($i = 0; $i + 1 < count($faqParas); $i += 2) {
            $q = trim($faqParas[$i]);
            $a = trim($faqParas[$i + 1] ?? '');
            if ($q) {
                $pairs[] = ['question' => $q, 'answer' => $a];
            }
        }
    }

    return $pairs;
}

$faqPairs = extractFaqPairs($paragraphs);

if (empty($faqPairs)) {
    echo json_encode(['error' => 'No FAQ content could be detected in this document. Make sure the document has a section heading containing "FAQ" or "Frequently Asked Questions" followed by question and answer pairs.']);
    exit;
}

// ── Step 4: Build AI prompt ───────────────────────────────────────────────────
$pairsText = '';
foreach ($faqPairs as $idx => $pair) {
    $num = $idx + 1;
    $pairsText .= "Q{$num}: {$pair['question']}\nA{$num}: {$pair['answer']}\n\n";
}

$aiPrompt = <<<PROMPT
You are an SEO Schema expert. Based on the FAQ questions and answers below, generate VALID JSON-LD structured data using the FAQPage schema type.

Requirements:
- Use schema.org/FAQPage type
- Include ALL questions and answers provided
- Output ONLY the raw JSON-LD object (no markdown fences, no explanation, no <script> tags)
- The JSON must be valid and parseable
- Use proper escaping for any quotes or special characters in the text
- Keep answers concise but complete

FAQ Content:
{$pairsText}

Output only the JSON-LD object starting with { and ending with }
PROMPT;

// ── Step 5: Call AI (non-streaming, await full response) ──────────────────────
/**
 * Call AI provider and return the complete text response.
 * We use a direct (non-streaming) request here since we need the full
 * JSON-LD to manipulate before injecting it into the DOCX.
 */
function callAiProvider(string $provider, string $apiKey, string $prompt): string {
    switch ($provider) {
        case 'claude':  return callClaude($apiKey, $prompt);
        case 'openai':  return callOpenAI($apiKey, $prompt);
        case 'gemini':  return callGemini($apiKey, $prompt);
        default:        throw new RuntimeException('Unknown provider');
    }
}

function callClaude(string $apiKey, string $prompt): string {
    $payload = json_encode([
        'model'      => 'claude-opus-4-5',
        'max_tokens' => 4096,
        'messages'   => [['role' => 'user', 'content' => $prompt]]
    ]);

    $ch = curl_init('https://api.anthropic.com/v1/messages');
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => $payload,
        CURLOPT_HTTPHEADER     => [
            'Content-Type: application/json',
            'x-api-key: ' . $apiKey,
            'anthropic-version: 2023-06-01',
        ],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 120,
        CURLOPT_SSL_VERIFYPEER => false,
    ]);

    $body = curl_exec($ch);
    $err  = curl_error($ch);
    curl_close($ch);

    if ($body === false) throw new RuntimeException('Claude request failed: ' . $err);
    $json = json_decode($body, true);
    if (!$json) throw new RuntimeException('Invalid JSON from Claude API');
    if (isset($json['error'])) throw new RuntimeException($json['error']['message'] ?? 'Claude error');
    return $json['content'][0]['text'] ?? '';
}

function callOpenAI(string $apiKey, string $prompt): string {
    $payload = json_encode([
        'model'    => 'gpt-4o',
        'messages' => [['role' => 'user', 'content' => $prompt]]
    ]);

    $ch = curl_init('https://api.openai.com/v1/chat/completions');
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => $payload,
        CURLOPT_HTTPHEADER     => [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $apiKey,
        ],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 120,
        CURLOPT_SSL_VERIFYPEER => false,
    ]);

    $body = curl_exec($ch);
    $err  = curl_error($ch);
    curl_close($ch);

    if ($body === false) throw new RuntimeException('OpenAI request failed: ' . $err);
    $json = json_decode($body, true);
    if (!$json) throw new RuntimeException('Invalid JSON from OpenAI API');
    if (isset($json['error'])) throw new RuntimeException($json['error']['message'] ?? 'OpenAI error');
    return $json['choices'][0]['message']['content'] ?? '';
}

function callGemini(string $apiKey, string $prompt): string {
    $url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' . urlencode($apiKey);
    $payload = json_encode([
        'contents' => [['parts' => [['text' => $prompt]]]]
    ]);

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => $payload,
        CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 120,
        CURLOPT_SSL_VERIFYPEER => false,
    ]);

    $body = curl_exec($ch);
    $err  = curl_error($ch);
    curl_close($ch);

    if ($body === false) throw new RuntimeException('Gemini request failed: ' . $err);
    $json = json_decode($body, true);
    if (!$json) throw new RuntimeException('Invalid JSON from Gemini API');
    if (isset($json['error'])) throw new RuntimeException($json['error']['message'] ?? 'Gemini error');
    return $json['candidates'][0]['content']['parts'][0]['text'] ?? '';
}

try {
    $rawAiResponse = callAiProvider($provider, $apiKey, $aiPrompt);
} catch (Exception $e) {
    echo json_encode(['error' => 'AI call failed: ' . $e->getMessage()]);
    exit;
}

if (!$rawAiResponse) {
    echo json_encode(['error' => 'AI returned an empty response']);
    exit;
}

// ── Step 6: Extract and validate the JSON-LD ─────────────────────────────────
// Strip markdown fences if the AI wrapped it anyway
$schemaJson = $rawAiResponse;
// Remove ```json ... ``` or ``` ... ``` fences
$schemaJson = preg_replace('/^```(?:json)?\s*/i', '', trim($schemaJson));
$schemaJson = preg_replace('/\s*```$/i', '', $schemaJson);
$schemaJson = trim($schemaJson);

// Validate JSON
$parsed = json_decode($schemaJson);
if (!$parsed) {
    echo json_encode(['error' => 'AI did not return valid JSON. Response preview: ' . substr($schemaJson, 0, 200)]);
    exit;
}

// Re-encode pretty-printed
$schemaJsonPretty = json_encode($parsed, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

// Wrap in <script> tags
$schemaBlock = '<script type="application/ld+json">' . "\n" . $schemaJsonPretty . "\n" . '</script>';

// ── Step 7: Inject schema into DOCX XML ──────────────────────────────────────
/**
 * Build an Open XML paragraph element containing the schema code as a
 * styled "code" paragraph (Courier New, preserved whitespace).
 * We escape the schema text for XML before injecting.
 */
function buildCodeParagraphXml(string $text): string {
    $escaped = htmlspecialchars($text, ENT_XML1, 'UTF-8');

    // Split into lines, each wrapped in w:r / w:t
    $lines    = explode("\n", $escaped);
    $runXml   = '';
    foreach ($lines as $i => $line) {
        if ($i > 0) {
            $runXml .= '<w:r><w:br w:type="textWrapping"/></w:r>';
        }
        $xmlSpace = (strlen($line) !== strlen(ltrim($line)) || strlen($line) !== strlen(rtrim($line)))
            ? ' xml:space="preserve"'
            : '';
        $runXml .= '<w:r>'
            . '<w:rPr><w:rFonts w:ascii="Courier New" w:hAnsi="Courier New"/><w:sz w:val="18"/><w:szCs w:val="18"/></w:rPr>'
            . "<w:t{$xmlSpace}>" . $line . '</w:t>'
            . '</w:r>';
    }

    return '<w:p xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
        . '<w:pPr>'
        . '<w:pStyle w:val="Normal"/>'
        . '<w:spacing w:before="240" w:after="0"/>'
        . '<w:jc w:val="left"/>'
        . '</w:pPr>'
        . $runXml
        . '</w:p>';
}

// Build a heading paragraph "FAQ Schema (JSON-LD)"
$headingPara = '<w:p xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
    . '<w:pPr><w:pStyle w:val="Heading2"/><w:spacing w:before="480" w:after="120"/></w:pPr>'
    . '<w:r><w:t>FAQ Schema (JSON-LD)</w:t></w:r>'
    . '</w:p>';

$codePara = buildCodeParagraphXml($schemaBlock);

// Insert both paragraphs before </w:body>
$injected = $headingPara . "\n" . $codePara . "\n";
$newDocXml = preg_replace('/<\/w:body>/i', $injected . '</w:body>', $docXml, 1);

if (!$newDocXml) {
    echo json_encode(['error' => 'Failed to inject schema into document XML']);
    exit;
}

// ── Step 8: Repack into a new DOCX ───────────────────────────────────────────
$stem     = pathinfo($originalName, PATHINFO_FILENAME);
$outName  = $stem . '-FAQ-Schema-Added.docx';
$outPath  = $uploadsDir . '/' . $outName;

// Copy the original DOCX to output path, then update document.xml in-place
if (!copy($tmpPath, $outPath)) {
    echo json_encode(['error' => 'Failed to create output file']);
    exit;
}

$zipOut = new ZipArchive();
if ($zipOut->open($outPath) !== true) {
    echo json_encode(['error' => 'Failed to open output DOCX for writing']);
    exit;
}
$zipOut->addFromString('word/document.xml', $newDocXml);
$zipOut->close();

// ── Step 9: Return success with download URL ──────────────────────────────────
// Serve the download via a little time-based token approach:
// We pass back a relative URL to a download handler, or alternatively
// stream the file directly. Simplest: return a download endpoint URL.
$downloadUrl = '/api/faq-schema-download.php?file=' . urlencode($outName)
             . '&uid=' . urlencode($_SESSION['user_id']);

echo json_encode([
    'success'        => true,
    'filename'       => $outName,
    'faq_count'      => count($faqPairs),
    'download_url'   => $downloadUrl,
    'schema_preview' => substr($schemaJsonPretty, 0, 600),
]);
