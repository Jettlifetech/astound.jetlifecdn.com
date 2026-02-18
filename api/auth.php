<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../config/auth.php';

$action = $_GET['action'] ?? '';

try {
    switch ($action) {
        case 'login':
            handleLogin();
            break;
        case 'logout':
            handleLogout();
            break;
        case 'check':
            handleCheck();
            break;
        case 'users':
            handleUsers($_SERVER['REQUEST_METHOD']);
            break;
        case 'change-password':
            handleChangePassword();
            break;
        default:
            http_response_code(400);
            echo json_encode(['error' => 'Invalid action']);
    }
} catch (Exception $e) {
    logError($e->getMessage(), 'auth.php - ' . $action);
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

// --- Action Handlers ---

function handleLogin() {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        return;
    }

    startSecureSession();

    // Rate limiting
    if (!empty($_SESSION['login_lockout']) && time() < $_SESSION['login_lockout']) {
        $remaining = $_SESSION['login_lockout'] - time();
        http_response_code(429);
        echo json_encode(['error' => "Too many attempts. Try again in {$remaining} seconds."]);
        return;
    }

    $data = json_decode(file_get_contents('php://input'), true);
    $username = trim($data['username'] ?? '');
    $password = $data['password'] ?? '';

    if (!$username || !$password) {
        http_response_code(400);
        echo json_encode(['error' => 'Username and password required']);
        return;
    }

    // Try JSON file first (primary), MySQL fallback
    $user = null;
    $jsonPath = __DIR__ . '/../data/users.json';
    if (file_exists($jsonPath)) {
        $dbData = json_decode(file_get_contents($jsonPath), true);
        if ($dbData && isset($dbData['users'])) {
            foreach ($dbData['users'] as $u) {
                if (strcasecmp($u['username'], $username) === 0) {
                    $user = $u;
                    break;
                }
            }
        }
    }

    // MySQL fallback
    if (!$user) {
        try {
            $conn = getDbConnection();
            $stmt = $conn->prepare("SELECT id, username, email, password_hash, role FROM users WHERE username = ?");
            $stmt->execute([$username]);
            $user = $stmt->fetch();
        } catch (Exception $e) {
            // MySQL unavailable, continue with null user
        }
    }

    if (!$user || !password_verify($password, $user['password_hash'])) {
        $_SESSION['login_attempts'] = ($_SESSION['login_attempts'] ?? 0) + 1;
        if ($_SESSION['login_attempts'] >= 5) {
            $_SESSION['login_lockout'] = time() + 60;
            $_SESSION['login_attempts'] = 0;
        }
        http_response_code(401);
        echo json_encode(['error' => 'Invalid credentials']);
        return;
    }

    // Success
    session_regenerate_id(true);
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['username'] = $user['username'];
    $_SESSION['role'] = $user['role'];
    $_SESSION['login_attempts'] = 0;
    unset($_SESSION['login_lockout']);

    echo json_encode([
        'success' => true,
        'user' => [
            'id' => $user['id'],
            'username' => $user['username'],
            'role' => $user['role']
        ]
    ]);
}

function handleLogout() {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        return;
    }

    startSecureSession();
    session_destroy();
    echo json_encode(['success' => true]);
}

function handleCheck() {
    $user = getAuthUser();
    if ($user) {
        echo json_encode([
            'authenticated' => true,
            'user' => $user
        ]);
    } else {
        echo json_encode(['authenticated' => false]);
    }
}

function handleUsers($method) {
    switch ($method) {
        case 'GET':
            $user = requireAdmin();
            $conn = getDbConnection();
            $stmt = $conn->query("SELECT id, username, email, role, created_at FROM users ORDER BY created_at");
            echo json_encode($stmt->fetchAll());
            break;

        case 'POST':
            $user = requireAdmin();
            $data = json_decode(file_get_contents('php://input'), true);

            $username = trim($data['username'] ?? '');
            $email = trim($data['email'] ?? '');
            $password = $data['password'] ?? '';
            $role = $data['role'] ?? 'user';

            // Validate
            if (!$username || strlen($username) < 3 || strlen($username) > 50) {
                throw new Exception('Username must be 3-50 characters');
            }
            if (!preg_match('/^[a-zA-Z0-9_]+$/', $username)) {
                throw new Exception('Username can only contain letters, numbers, and underscores');
            }
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                throw new Exception('Invalid email address');
            }
            $pwError = validatePassword($password);
            if ($pwError) {
                throw new Exception($pwError);
            }
            if (!in_array($role, ['admin', 'user'])) {
                $role = 'user';
            }

            $conn = getDbConnection();
            $hash = password_hash($password, PASSWORD_DEFAULT);
            $stmt = $conn->prepare("INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)");
            $stmt->execute([$username, $email, $hash, $role]);

            echo json_encode([
                'success' => true,
                'id' => $conn->lastInsertId(),
                'message' => "User '{$username}' created"
            ]);
            break;

        case 'DELETE':
            $user = requireAdmin();
            $data = json_decode(file_get_contents('php://input'), true);
            if (empty($data)) {
                parse_str(file_get_contents('php://input'), $data);
            }
            $deleteId = intval($data['id'] ?? 0);

            if (!$deleteId) {
                throw new Exception('User ID required');
            }
            if ($deleteId === $user['id']) {
                throw new Exception('Cannot delete your own account');
            }

            // Prevent deleting last admin
            $conn = getDbConnection();
            $stmt = $conn->prepare("SELECT role FROM users WHERE id = ?");
            $stmt->execute([$deleteId]);
            $target = $stmt->fetch();

            if (!$target) {
                throw new Exception('User not found');
            }

            if ($target['role'] === 'admin') {
                $adminCount = $conn->query("SELECT COUNT(*) FROM users WHERE role = 'admin'")->fetchColumn();
                if ($adminCount <= 1) {
                    throw new Exception('Cannot delete the last admin account');
                }
            }

            $stmt = $conn->prepare("DELETE FROM users WHERE id = ?");
            $stmt->execute([$deleteId]);
            echo json_encode(['success' => true, 'message' => 'User deleted']);
            break;

        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
    }
}

function handleChangePassword() {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        return;
    }

    $user = requireAuth();
    $data = json_decode(file_get_contents('php://input'), true);

    $currentPassword = $data['current_password'] ?? '';
    $newPassword = $data['new_password'] ?? '';

    if (!$currentPassword || !$newPassword) {
        throw new Exception('Current and new passwords required');
    }

    $pwError = validatePassword($newPassword);
    if ($pwError) {
        throw new Exception($pwError);
    }

    $conn = getDbConnection();
    $stmt = $conn->prepare("SELECT password_hash FROM users WHERE id = ?");
    $stmt->execute([$user['id']]);
    $row = $stmt->fetch();

    if (!password_verify($currentPassword, $row['password_hash'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Current password is incorrect']);
        return;
    }

    $hash = password_hash($newPassword, PASSWORD_DEFAULT);
    $stmt = $conn->prepare("UPDATE users SET password_hash = ? WHERE id = ?");
    $stmt->execute([$hash, $user['id']]);

    echo json_encode(['success' => true, 'message' => 'Password changed']);
}

function validatePassword($password) {
    if (strlen($password) < 8) return 'Password must be at least 8 characters';
    if (!preg_match('/[A-Za-z]/', $password)) return 'Password must contain at least one letter';
    if (!preg_match('/[0-9]/', $password)) return 'Password must contain at least one number';
    return null;
}
