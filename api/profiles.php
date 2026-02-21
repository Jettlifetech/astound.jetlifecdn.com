<?php
/**
 * Data Profiles API
 * CRUD for user's data profiles and retrieval of global template variables.
 */
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../config/database.php';
require_once '../config/auth.php';

$authUser = requireAuth();
$conn = getDbConnection();

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

try {
    if ($method === 'GET') {
        if ($action === 'variables') {
            // Get all unique variable names across all current templates to build the "Master Form"
            // We group by variable_name to avoid duplicates.
            // We take the most common label/type or just the first found.
            $sql = "SELECT variable_name, 
                           MAX(field_label) as field_label, 
                           MAX(field_type) as field_type 
                    FROM template_variables 
                    GROUP BY variable_name 
                    ORDER BY variable_name";
            $stmt = $conn->prepare($sql);
            $stmt->execute();
            echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
        } else {
            // Get all profiles for the logged-in user
            $sql = "SELECT id, profile_name, profile_data, created_at, updated_at FROM user_data_profiles WHERE user_id = ? ORDER BY profile_name";
            $stmt = $conn->prepare($sql);
            $stmt->execute([$authUser['id']]);
            $profiles = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // integrity check: ensure profile_data is always valid JSON or object
            foreach ($profiles as &$p) {
                if (is_string($p['profile_data'])) {
                    $decoded = json_decode($p['profile_data'], true);
                    $p['profile_data'] = $decoded ?: [];
                }
            }
            echo json_encode($profiles);
        }
    } 
    elseif ($method === 'POST') {
        // Create new profile
        $data = json_decode(file_get_contents('php://input'), true);
        if (empty($data['profile_name'])) throw new Exception("Profile Name is required");
        
        // profile_data should be a JSON object of key-values
        $profileData = $data['profile_data'] ?? [];
        
        $sql = "INSERT INTO user_data_profiles (user_id, profile_name, profile_data) VALUES (?, ?, ?)";
        $stmt = $conn->prepare($sql);
        $stmt->execute([$authUser['id'], $data['profile_name'], json_encode($profileData)]);
        echo json_encode(['success' => true, 'id' => $conn->lastInsertId(), 'message' => 'Profile created']);
    } 
    elseif ($method === 'PUT') {
        // Update existing profile
        $data = json_decode(file_get_contents('php://input'), true);
        if (empty($data['id'])) throw new Exception("Profile ID is required");
        if (empty($data['profile_name'])) throw new Exception("Profile Name is required");
        
        $profileData = $data['profile_data'] ?? [];

        $sql = "UPDATE user_data_profiles SET profile_name = ?, profile_data = ? WHERE id = ? AND user_id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->execute([$data['profile_name'], json_encode($profileData), $data['id'], $authUser['id']]);
        
        if ($stmt->rowCount() === 0) {
            // Check if it exists but belongs to someone else, or just didn't change
            // For now, assume success or "no changes made"
        }
        echo json_encode(['success' => true, 'message' => 'Profile updated']);
    } 
    elseif ($method === 'DELETE') {
        // Delete profile
        $id = $_GET['id'] ?? null;
        if (!$id) throw new Exception("Profile ID is required");
        
        $sql = "DELETE FROM user_data_profiles WHERE id = ? AND user_id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->execute([$id, $authUser['id']]);
        echo json_encode(['success' => true, 'message' => 'Profile deleted']);
    }
} catch (Exception $e) {
    http_response_code(400); // Bad Request or Internal Server Error depending on context, using 400 for logic errors
    echo json_encode(['error' => $e->getMessage()]);
}
