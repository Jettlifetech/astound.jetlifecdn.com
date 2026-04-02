<?php
require_once __DIR__ . '/database.php';

/**
 * Start a secure PHP session with hardened cookie settings.
 */
function startSecureSession() {
    if (session_status() === PHP_SESSION_ACTIVE) return;

    ini_set('session.cookie_httponly', 1);
    ini_set('session.cookie_samesite', 'Strict');
    ini_set('session.use_strict_mode', 1);
    if (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') {
        ini_set('session.cookie_secure', 1);
    }
    ini_set('session.gc_maxlifetime', 86400); // 24 hours
    ini_set('session.cookie_lifetime', 86400); // cookie persists 24 hours
    session_start();
}

/**
 * Require authentication. Returns user array or sends 401 and exits.
 */
function requireAuth() {
    startSecureSession();
    if (empty($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Authentication required']);
        exit;
    }
    return [
        'id' => $_SESSION['user_id'],
        'username' => $_SESSION['username'],
        'role' => $_SESSION['role']
    ];
}

/**
 * Non-blocking auth check. Returns user array or null.
 */
function getAuthUser() {
    startSecureSession();
    if (empty($_SESSION['user_id'])) return null;
    return [
        'id' => $_SESSION['user_id'],
        'username' => $_SESSION['username'],
        'role' => $_SESSION['role']
    ];
}

/**
 * Require admin or super_admin role. Returns user array or sends 403 and exits.
 */
function requireAdmin() {
    $user = requireAuth();
    if ($user['role'] !== 'admin' && $user['role'] !== 'super_admin') {
        http_response_code(403);
        echo json_encode(['error' => 'Admin access required']);
        exit;
    }
    return $user;
}

/**
 * Require super_admin role only. Returns user array or sends 403 and exits.
 */
function requireSuperAdmin() {
    $user = requireAuth();
    if ($user['role'] !== 'super_admin') {
        http_response_code(403);
        echo json_encode(['error' => 'Super Admin access required']);
        exit;
    }
    return $user;
}

/**
 * Check if a user array has admin privileges (admin or super_admin).
 */
function isAdmin($user) {
    return in_array($user['role'], ['admin', 'super_admin']);
}
