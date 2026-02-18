<?php
/**
 * User Management API (Admin only)
 * CRUD operations for users, stored in data/users.json
 */
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../config/auth.php';
require_once '../config/users_db.php';

// Require authentication
$authUser = requireAuth();

// Require admin role
if ($authUser['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['error' => 'Admin access required']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            // List all users
            $users = getAllUsers();
            echo json_encode($users);
            break;

        case 'POST':
            // Create new user
            $data = json_decode(file_get_contents('php://input'), true);

            if (empty($data['username']) || strlen(trim($data['username'])) < 1) {
                throw new Exception('Username is required');
            }
            if (empty($data['password']) || strlen($data['password']) < 6) {
                throw new Exception('Password is required (minimum 6 characters)');
            }

            $user = createUser(
                trim($data['username']),
                $data['password'],
                trim($data['email'] ?? ''),
                trim($data['first_name'] ?? ''),
                trim($data['last_name'] ?? ''),
                $data['role'] ?? 'user'
            );

            http_response_code(201);
            echo json_encode(['success' => true, 'user' => $user]);
            break;

        case 'PUT':
            // Update existing user
            $data = json_decode(file_get_contents('php://input'), true);
            $userId = $data['id'] ?? ($_GET['id'] ?? null);

            if (!$userId) {
                throw new Exception('User ID is required');
            }
            if (empty($data['username']) || strlen(trim($data['username'])) < 1) {
                throw new Exception('Username is required');
            }
            if (!empty($data['password']) && strlen($data['password']) < 6) {
                throw new Exception('Password must be at least 6 characters');
            }

            $updates = [
                'username' => trim($data['username']),
                'first_name' => trim($data['first_name'] ?? ''),
                'last_name' => trim($data['last_name'] ?? ''),
                'email' => trim($data['email'] ?? ''),
                'role' => $data['role'] ?? 'user'
            ];

            // Only include password if provided
            if (!empty($data['password'])) {
                $updates['password'] = $data['password'];
            }

            $user = updateUser($userId, $updates);
            echo json_encode(['success' => true, 'user' => $user]);
            break;

        case 'DELETE':
            // Delete user
            $userId = $_GET['id'] ?? null;
            if (!$userId) {
                // Try from body
                $data = json_decode(file_get_contents('php://input'), true);
                $userId = $data['id'] ?? null;
            }

            if (!$userId) {
                throw new Exception('User ID is required');
            }

            deleteUser($userId, $authUser['id']);
            echo json_encode(['success' => true, 'message' => 'User deleted']);
            break;

        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
    }
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['error' => $e->getMessage()]);
}
