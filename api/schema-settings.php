<?php
/**
 * Schema Gen Settings API
 * GET  - load settings (returns both prompt templates)
 * POST - save settings (accepts both prompt templates)
 */
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

require_once '../config/auth.php';
startSecureSession();
if (empty($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Authentication required']);
    exit;
}

$settingsFile = __DIR__ . '/../data/schema-gen-settings.json';

$defaults = [
    'provider'             => '',
    'prompt_template'      => "Analyze the following webpage content and generate comprehensive, advanced JSON-LD structured data (Schema.org markup). Include all relevant schema types, properties, and nested entities. Include FAQ schema if applicable. Output ONLY valid JSON-LD wrapped in <script type=\"application/ld+json\"> tags.\n\nWebpage Content:\n[PAGE_MARKDOWN]",
    'url_prompt_template'  => "You will be given a URL. Crawl the page and generate comprehensive, advanced JSON-LD structured data (Schema.org markup) for the page content. Include all relevant schema types, properties, and nested entities. Include FAQ schema if applicable. Output ONLY valid JSON-LD wrapped in <script type=\"application/ld+json\"> tags.\n\nPage URL: [PAGE_URL]",
    'identify_prompt_template' => "You will be given a URL. Crawl the page and identify ALL applicable Schema.org types and Google Rich Results types that should be implemented on this page. Do NOT write any schema markup code.\n\nFor each applicable type, provide:\n1. The Schema.org type name (e.g. Article, FAQPage, LocalBusiness, Product, BreadcrumbList, etc.)\n2. A brief one-line reason why it applies to this page content\n\nFormat your response as a simple numbered list. Be thorough and include every relevant type.\n\nPage URL: [PAGE_URL]",
];

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (!file_exists($settingsFile)) {
        echo json_encode($defaults);
    } else {
        $stored = json_decode(file_get_contents($settingsFile), true) ?: [];
        // Merge with defaults so new fields always present
        echo json_encode(array_merge($defaults, $stored));
    }

} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!$data) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON']);
        exit;
    }

    // Load existing to merge
    $existing = [];
    if (file_exists($settingsFile)) {
        $existing = json_decode(file_get_contents($settingsFile), true) ?: [];
    }

    // Update only fields that were sent
    if (isset($data['prompt_template'])) {
        if (empty($data['prompt_template'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Markdown prompt template cannot be empty']);
            exit;
        }
        if (strpos($data['prompt_template'], '[PAGE_MARKDOWN]') === false) {
            http_response_code(400);
            echo json_encode(['error' => 'Markdown prompt template must contain [PAGE_MARKDOWN]']);
            exit;
        }
        $existing['prompt_template'] = $data['prompt_template'];
    }

    if (isset($data['url_prompt_template'])) {
        if (empty($data['url_prompt_template'])) {
            http_response_code(400);
            echo json_encode(['error' => 'URL prompt template cannot be empty']);
            exit;
        }
        if (strpos($data['url_prompt_template'], '[PAGE_URL]') === false) {
            http_response_code(400);
            echo json_encode(['error' => 'URL prompt template must contain [PAGE_URL]']);
            exit;
        }
        $existing['url_prompt_template'] = $data['url_prompt_template'];
    }

    if (isset($data['identify_prompt_template'])) {
        if (empty($data['identify_prompt_template'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Identify prompt template cannot be empty']);
            exit;
        }
        if (strpos($data['identify_prompt_template'], '[PAGE_URL]') === false) {
            http_response_code(400);
            echo json_encode(['error' => 'Identify prompt template must contain [PAGE_URL]']);
            exit;
        }
        $existing['identify_prompt_template'] = $data['identify_prompt_template'];
    }

    if (isset($data['provider'])) {
        $existing['provider'] = $data['provider'];
    }

    if (file_put_contents($settingsFile, json_encode($existing, JSON_PRETTY_PRINT)) === false) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to save settings']);
        exit;
    }

    echo json_encode(['success' => true, 'message' => 'Settings saved']);
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
