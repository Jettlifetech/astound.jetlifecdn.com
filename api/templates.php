<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-HTTP-Method-Override');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../config/database.php';
require_once '../config/auth.php';

$authUser = requireAuth();

$method = $_SERVER['REQUEST_METHOD'];

// Support POST with X-HTTP-Method-Override or action=update as PUT
if ($method === 'POST') {
    $overrideHeader = $_SERVER['HTTP_X_HTTP_METHOD_OVERRIDE'] ?? '';
    if (strtoupper($overrideHeader) === 'PUT') {
        $method = 'PUT';
    } else {
        // Peek at the JSON body for action=update
        $rawBody = file_get_contents('php://input');
        $peekData = json_decode($rawBody, true);
        if (isset($peekData['action']) && $peekData['action'] === 'update' && isset($peekData['id'])) {
            $method = 'PUT';
        }
        // Store raw body for later use since php://input can only be read once
        $GLOBALS['_RAW_BODY'] = $rawBody;
    }
}

try {
    $conn = getDbConnection();

    switch($method) {
        case 'GET':
            // Get all templates or specific template
            if(isset($_GET['id'])) {
                $stmt = $conn->prepare("
                    SELECT t.*,
                           GROUP_CONCAT(
                               CONCAT_WS('|', v.variable_name, v.field_label, v.field_type, v.variable_order)
                               ORDER BY v.variable_order
                               SEPARATOR ';;'
                           ) as variables
                    FROM prompt_templates t
                    LEFT JOIN template_variables v ON t.id = v.template_id
                    WHERE t.id = ? AND t.user_id = ?
                    GROUP BY t.id
                ");
                $stmt->execute([$_GET['id'], $authUser['id']]);
                $template = $stmt->fetch();

                if($template) {
                    // Parse variables
                    if($template['variables']) {
                        $vars = explode(';;', $template['variables']);
                        $template['variables'] = array_map(function($v) {
                            list($name, $label, $type, $order) = explode('|', $v);
                            return [
                                'variable_name' => $name,
                                'field_label' => $label,
                                'field_type' => $type,
                                'variable_order' => (int)$order
                            ];
                        }, $vars);
                    } else {
                        $template['variables'] = [];
                    }
                }

                echo json_encode($template);
            } else {
                // Get all templates for this user
                $stmt = $conn->prepare("SELECT id, template_name, created_at FROM prompt_templates WHERE user_id = ? ORDER BY template_name");
                $stmt->execute([$authUser['id']]);
                $templates = $stmt->fetchAll();
                echo json_encode($templates);
            }
            break;

        case 'PUT':
            // Update existing template
            $data = json_decode($GLOBALS['_RAW_BODY'] ?? file_get_contents('php://input'), true);
            $templateId = $data['id'] ?? ($_GET['id'] ?? null);

            if (!$templateId) {
                throw new Exception('Template ID is required for update');
            }
            if (!isset($data['template_name']) || !isset($data['prompt_text'])) {
                throw new Exception('Template name and prompt text are required');
            }

            // Verify ownership
            $stmt = $conn->prepare("SELECT id FROM prompt_templates WHERE id = ? AND user_id = ?");
            $stmt->execute([$templateId, $authUser['id']]);
            if (!$stmt->fetch()) {
                throw new Exception('Template not found or access denied');
            }

            $conn->beginTransaction();

            // Update template
            $stmt = $conn->prepare("UPDATE prompt_templates SET template_name = ?, prompt_text = ? WHERE id = ? AND user_id = ?");
            $stmt->execute([$data['template_name'], $data['prompt_text'], $templateId, $authUser['id']]);

            // Delete old variables and re-insert
            $stmt = $conn->prepare("DELETE FROM template_variables WHERE template_id = ?");
            $stmt->execute([$templateId]);

            if (isset($data['variables']) && is_array($data['variables'])) {
                $stmt = $conn->prepare("
                    INSERT INTO template_variables (template_id, variable_name, field_label, field_type, variable_order)
                    VALUES (?, ?, ?, ?, ?)
                ");
                foreach ($data['variables'] as $order => $var) {
                    $stmt->execute([
                        $templateId,
                        $var['variable_name'],
                        $var['field_label'],
                        $var['field_type'],
                        $var['variable_order'] ?? $order
                    ]);
                }
            }

            $conn->commit();

            echo json_encode([
                'success' => true,
                'id' => $templateId,
                'message' => 'Template updated successfully'
            ]);
            break;

        case 'POST':
            // Create new template
            $data = json_decode($GLOBALS['_RAW_BODY'] ?? file_get_contents('php://input'), true);

            if(!isset($data['template_name']) || !isset($data['prompt_text'])) {
                throw new Exception('Template name and prompt text are required');
            }

            // Extract variables from prompt text
            preg_match_all('/\[([^\]]+)\]/', $data['prompt_text'], $matches);
            $variables = array_unique($matches[1]);

            // Start transaction
            $conn->beginTransaction();

            // Insert template with user_id
            $stmt = $conn->prepare("INSERT INTO prompt_templates (user_id, template_name, prompt_text) VALUES (?, ?, ?)");
            $stmt->execute([$authUser['id'], $data['template_name'], $data['prompt_text']]);
            $templateId = $conn->lastInsertId();

            // Insert variables if provided
            if(isset($data['variables']) && is_array($data['variables'])) {
                $stmt = $conn->prepare("
                    INSERT INTO template_variables (template_id, variable_name, field_label, field_type, variable_order)
                    VALUES (?, ?, ?, ?, ?)
                ");

                $order = 0;
                foreach($data['variables'] as $var) {
                    $stmt->execute([
                        $templateId,
                        $var['variable_name'],
                        $var['field_label'],
                        $var['field_type'],
                        $order++
                    ]);
                }
            }

            $conn->commit();

            echo json_encode([
                'success' => true,
                'id' => $templateId,
                'variables' => $variables,
                'message' => 'Template created successfully'
            ]);
            break;

        case 'DELETE':
            // Delete template (only own)
            parse_str(file_get_contents('php://input'), $data);
            if(!isset($data['id'])) {
                throw new Exception('Template ID is required');
            }

            $stmt = $conn->prepare("DELETE FROM prompt_templates WHERE id = ? AND user_id = ?");
            $stmt->execute([$data['id'], $authUser['id']]);

            echo json_encode(['success' => true, 'message' => 'Template deleted successfully']);
            break;

        default:
            throw new Exception('Method not allowed');
    }

} catch(Exception $e) {
    logError($e->getMessage(), 'templates.php - ' . $method);
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
