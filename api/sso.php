<?php
/**
 * api/sso.php — Single-Sign-On token management
 *
 * Admin-only actions (require admin session):
 *   GET    ?action=list            → List all generated tokens
 *   GET    ?action=list_users      → List users available for token generation
 *   POST   ?action=create          → Create a new SSO token
 *   DELETE ?action=revoke&id=N     → Revoke / permanently delete a token
 *
 * Public action (no auth needed):
 *   GET    ?action=redeem&token=XX → Validate token, start session, return JSON success
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

require_once '../config/auth.php';

// SSO settings
define('SSO_DEFAULT_TTL_HOURS', 168); // 7 days
define('SSO_MAX_TTL_HOURS',     720); // 30 days max

$action = $_GET['action'] ?? '';

try {
    switch ($action) {

        // ── list all tokens (admin) ──────────────────────────────────────────
        case 'list':
            $admin = requireAdmin();
            $conn  = getDbConnection();
            $stmt  = $conn->query("
                SELECT s.id, s.token, s.created_at, s.expires_at, s.used_at, s.label,
                       u.username AS for_user,
                       cb.username AS created_by,
                       CASE WHEN s.used_at IS NOT NULL THEN 'used'
                            WHEN s.expires_at < NOW()  THEN 'expired'
                            ELSE 'active' END AS status
                FROM sso_tokens s
                JOIN users u  ON s.user_id            = u.id
                JOIN users cb ON s.created_by_user_id = cb.id
                ORDER BY s.created_at DESC
            ");
            echo json_encode($stmt->fetchAll());
            break;

        // ── list users (admin) ───────────────────────────────────────────────
        case 'list_users':
            $admin = requireAdmin();
            $conn  = getDbConnection();
            $stmt  = $conn->query("SELECT id, username, email, role FROM users ORDER BY username");
            echo json_encode($stmt->fetchAll());
            break;

        // ── create token (admin) ─────────────────────────────────────────────
        case 'create':
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                http_response_code(405); echo json_encode(['error' => 'POST required']); exit;
            }
            $admin    = requireAdmin();
            $data     = json_decode(file_get_contents('php://input'), true) ?? [];
            $userId   = intval($data['user_id'] ?? 0);
            $ttlHours = min(intval($data['ttl_hours'] ?? SSO_DEFAULT_TTL_HOURS), SSO_MAX_TTL_HOURS);
            $label    = trim(substr($data['label'] ?? '', 0, 100));

            if (!$userId) {
                http_response_code(400); echo json_encode(['error' => 'user_id required']); exit;
            }

            $conn = getDbConnection();
            $check = $conn->prepare("SELECT id, username FROM users WHERE id = ?");
            $check->execute([$userId]);
            $targetUser = $check->fetch();
            if (!$targetUser) {
                http_response_code(404); echo json_encode(['error' => 'User not found']); exit;
            }

            // Cryptographically secure 64-hex-char token (256-bit entropy)
            $token = bin2hex(random_bytes(32));

            $stmt = $conn->prepare("
                INSERT INTO sso_tokens (user_id, token, expires_at, created_by_user_id, label)
                VALUES (?, ?, DATE_ADD(NOW(), INTERVAL ? HOUR), ?, ?)
            ");
            $stmt->execute([$userId, $token, $ttlHours, $admin['id'], $label ?: null]);

            // Build the SSO URL pointing at the SPA root (index.html picks up ?sso_token=)
            $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
            $host   = $_SERVER['HTTP_HOST'] ?? 'localhost';
            $appDir = rtrim(dirname(dirname($_SERVER['SCRIPT_NAME'])), '/\\');
            $ssoUrl = $scheme . '://' . $host . $appDir . '/index.html?sso_token=' . urlencode($token);

            echo json_encode([
                'success'    => true,
                'token_id'   => (int) $conn->lastInsertId(),
                'token'      => $token,
                'for_user'   => $targetUser['username'],
                'expires_in' => $ttlHours . ' hours',
                'sso_url'    => $ssoUrl,
            ]);
            break;

        // ── revoke token (admin) ─────────────────────────────────────────────
        case 'revoke':
            $admin   = requireAdmin();
            $body    = json_decode(file_get_contents('php://input'), true) ?? [];
            $tokenId = intval($_GET['id'] ?? $body['id'] ?? 0);
            if (!$tokenId) {
                http_response_code(400); echo json_encode(['error' => 'Token ID required']); exit;
            }
            $conn = getDbConnection();
            $stmt = $conn->prepare("DELETE FROM sso_tokens WHERE id = ?");
            $stmt->execute([$tokenId]);
            echo json_encode(['success' => true, 'deleted' => $stmt->rowCount()]);
            break;

        // ── redeem token (public — no auth required) ─────────────────────────
        case 'redeem':
            $token = trim($_GET['token'] ?? '');
            if (strlen($token) !== 64 || !ctype_xdigit($token)) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid or missing token.']);
                exit;
            }

            $conn = getDbConnection();
            $stmt = $conn->prepare("
                SELECT s.id, s.user_id, s.expires_at, s.used_at,
                       u.username, u.role
                FROM sso_tokens s
                JOIN users u ON s.user_id = u.id
                WHERE s.token = ?
            ");
            $stmt->execute([$token]);
            $row = $stmt->fetch();

            if (!$row) {
                http_response_code(401);
                echo json_encode(['error' => 'SSO link not found or revoked.']);
                exit;
            }
            if ($row['used_at'] !== null) {
                http_response_code(401);
                echo json_encode(['error' => 'This SSO link has already been used. Links are single-use.']);
                exit;
            }
            if (strtotime($row['expires_at']) < time()) {
                http_response_code(401);
                echo json_encode(['error' => 'This SSO link has expired. Ask an admin to generate a new one.']);
                exit;
            }

            // Mark as used immediately (single-use enforcement)
            $mark = $conn->prepare("UPDATE sso_tokens SET used_at = NOW() WHERE id = ?");
            $mark->execute([$row['id']]);

            // Create authenticated PHP session
            startSecureSession();
            session_regenerate_id(true);
            $_SESSION['user_id'] = $row['user_id'];
            $_SESSION['username'] = $row['username'];
            $_SESSION['role']    = $row['role'];

            // JS will call checkAuth() to confirm session, then showApp()
            echo json_encode([
                'success'  => true,
                'username' => $row['username'],
                'role'     => $row['role'],
            ]);
            break;

        default:
            http_response_code(400);
            echo json_encode(['error' => 'Invalid action. Valid: list, list_users, create, revoke, redeem']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
