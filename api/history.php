<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../config/database.php';
require_once '../config/auth.php';

$authUser = requireAuth();

$method = $_SERVER['REQUEST_METHOD'];

try {
    $conn = getDbConnection();

    switch($method) {
        case 'GET':
            // Get all history entries
            $type = isset($_GET['type']) ? $_GET['type'] : 'all';

            if($type === 'prompts' || $type === 'all') {
                $stmt = $conn->prepare("
                    SELECT
                        'prompt' as type,
                        id,
                        template_name,
                        generated_prompt,
                        variable_data,
                        created_at
                    FROM prompt_history
                    WHERE user_id = ?
                    ORDER BY created_at DESC
                ");
                $stmt->execute([$authUser['id']]);
                $prompts = $stmt->fetchAll();
            } else {
                $prompts = [];
            }

            if($type === 'templates' || $type === 'all') {
                $stmt = $conn->prepare("
                    SELECT
                        'template' as type,
                        id,
                        template_name,
                        prompt_text,
                        created_at
                    FROM prompt_templates
                    WHERE user_id = ?
                    ORDER BY created_at DESC
                ");
                $stmt->execute([$authUser['id']]);
                $templates = $stmt->fetchAll();
            } else {
                $templates = [];
            }

            if($type === 'errors' || $type === 'all') {
                // Only admins see error logs
                if ($authUser['role'] === 'admin') {
                    $stmt = $conn->query("
                        SELECT
                            'error' as type,
                            id,
                            error_message,
                            error_context,
                            created_at
                        FROM error_logs
                        ORDER BY created_at DESC
                        LIMIT 100
                    ");
                    $errors = $stmt->fetchAll();
                } else {
                    $errors = [];
                }
            } else {
                $errors = [];
            }

            // Combine and sort by date
            $allHistory = array_merge($prompts, $templates, $errors);
            usort($allHistory, function($a, $b) {
                return strtotime($b['created_at']) - strtotime($a['created_at']);
            });

            echo json_encode($allHistory);
            break;

        case 'POST':
            // Save generated prompt to history
            $data = json_decode(file_get_contents('php://input'), true);

            if(!isset($data['template_id']) || !isset($data['generated_prompt'])) {
                throw new Exception('Template ID and generated prompt are required');
            }

            $stmt = $conn->prepare("
                INSERT INTO prompt_history
                (user_id, template_id, template_name, generated_prompt, variable_data)
                VALUES (?, ?, ?, ?, ?)
            ");

            $stmt->execute([
                $authUser['id'],
                $data['template_id'],
                $data['template_name'],
                $data['generated_prompt'],
                json_encode($data['variable_data'] ?? [])
            ]);

            echo json_encode([
                'success' => true,
                'id' => $conn->lastInsertId(),
                'message' => 'Prompt saved to history'
            ]);
            break;

        default:
            throw new Exception('Method not allowed');
    }

} catch(Exception $e) {
    logError($e->getMessage(), 'history.php - ' . $method);
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
