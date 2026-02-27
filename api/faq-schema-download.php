<?php
/**
 * FAQ Schema Download Handler
 * Serves the generated DOCX file for download.
 * Validates the requesting user owns the file before serving.
 */

require_once '../config/auth.php';
startSecureSession();

if (empty($_SESSION['user_id'])) {
    http_response_code(401);
    echo 'Authentication required';
    exit;
}

$filename = basename($_GET['file'] ?? '');
$uid      = $_GET['uid'] ?? '';

// Validate: must end in .docx, no path traversal
if (!$filename || !str_ends_with($filename, '.docx') || str_contains($filename, '..')) {
    http_response_code(400);
    echo 'Invalid filename';
    exit;
}

// Only allow the session user's downloads
if ((string)$uid !== (string)$_SESSION['user_id']) {
    http_response_code(403);
    echo 'Forbidden';
    exit;
}

$filePath = __DIR__ . '/../data/faq-schema-uploads/' . $filename;

if (!file_exists($filePath)) {
    http_response_code(404);
    echo 'File not found or expired';
    exit;
}

// Serve the file
header('Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document');
header('Content-Disposition: attachment; filename="' . $filename . '"');
header('Content-Length: ' . filesize($filePath));
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');

readfile($filePath);

// Clean up after serving (optional — remove if you want to keep files)
@unlink($filePath);
exit;
