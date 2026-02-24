<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-HTTP-Method-Override');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

require_once '../config/database.php';
require_once '../config/auth.php';

$authUser = requireAuth();
$method = $_SERVER['REQUEST_METHOD'];

// Support POST with override header or action=update body
$GLOBALS['_RAW_BODY'] = '';
if ($method === 'POST') {
    $overrideHeader = $_SERVER['HTTP_X_HTTP_METHOD_OVERRIDE'] ?? '';
    if (strtoupper($overrideHeader) === 'PUT') {
        $method = 'PUT';
    } else {
        $GLOBALS['_RAW_BODY'] = file_get_contents('php://input');
        $peekData = json_decode($GLOBALS['_RAW_BODY'], true);
        if (isset($peekData['action'])) {
            switch ($peekData['action']) {
                case 'update':
                    if (isset($peekData['id'])) { $method = 'PUT'; }
                    break;
                case 'increment_use':
                case 'bulk_category':
                case 'bulk_group':
                case 'bulk_delete':
                case 'export':
                case 'import':
                case 'toggle_public':
                    $method = 'ACTION';
                    break;
            }
        }
    }
}

try {
    $conn = getDbConnection();

    switch ($method) {

        // ── GET ───────────────────────────────────────────────────────────
        case 'GET':
            if (isset($_GET['id'])) {
                // Fetch own template OR a public template
                $stmt = $conn->prepare("
                    SELECT t.*, u.username as owner_username,
                           GROUP_CONCAT(
                               CONCAT_WS('|', v.variable_name, v.field_label, v.field_type, v.variable_order)
                               ORDER BY v.variable_order
                               SEPARATOR ';;'
                           ) as variables
                    FROM prompt_templates t
                    LEFT JOIN template_variables v ON t.id = v.template_id
                    LEFT JOIN users u ON t.user_id = u.id
                    WHERE t.id = ? AND (t.user_id = ? OR t.is_public = 1)
                    GROUP BY t.id
                ");
                $stmt->execute([$_GET['id'], $authUser['id']]);
                $template = $stmt->fetch();
                if ($template) {
                    $template['variables'] = $template['variables']
                        ? array_map(function($v) {
                            list($name, $label, $type, $order) = explode('|', $v);
                            return ['variable_name' => $name, 'field_label' => $label,
                                    'field_type' => $type, 'variable_order' => (int)$order];
                          }, explode(';;', $template['variables']))
                        : [];
                    $template['is_owner'] = ((int)$template['user_id'] === (int)$authUser['id']);
                }
                echo json_encode($template);
            } elseif (isset($_GET['public_only'])) {
                // Fetch only public templates from ALL users (for browsing)
                $stmt = $conn->prepare("
                    SELECT t.id, t.template_name, t.created_at, t.updated_at, t.use_count,
                           t.category, t.group_name, t.group_color, t.is_public, t.user_id,
                           u.username as owner_username,
                           (t.user_id = ?) as is_owner
                    FROM prompt_templates t
                    LEFT JOIN users u ON t.user_id = u.id
                    WHERE t.is_public = 1
                    ORDER BY t.use_count DESC, t.created_at DESC
                ");
                $stmt->execute([$authUser['id']]);
                echo json_encode($stmt->fetchAll());
            } else {
                // Fetch own templates + public templates from other users
                $stmt = $conn->prepare("
                    SELECT t.id, t.template_name, t.created_at, t.updated_at, t.use_count,
                           t.category, t.group_name, t.group_color, t.is_public, t.user_id,
                           u.username as owner_username,
                           (t.user_id = ?) as is_owner
                    FROM prompt_templates t
                    LEFT JOIN users u ON t.user_id = u.id
                    WHERE t.user_id = ? OR t.is_public = 1
                    ORDER BY (t.user_id = ?) DESC, t.created_at DESC
                ");
                $stmt->execute([$authUser['id'], $authUser['id'], $authUser['id']]);
                echo json_encode($stmt->fetchAll());
            }
            break;

        // ── ACTION (special POST variants) ────────────────────────────────
        case 'ACTION':
            $data = json_decode($GLOBALS['_RAW_BODY'], true);
            $action = $data['action'];

            if ($action === 'increment_use') {
                // Allow incrementing use_count on own OR public template
                $stmt = $conn->prepare("UPDATE prompt_templates SET use_count = use_count + 1 WHERE id = ? AND (user_id = ? OR is_public = 1)");
                $stmt->execute([$data['id'], $authUser['id']]);
                echo json_encode(['success' => true]);

            } elseif ($action === 'toggle_public') {
                // Toggle is_public for own template
                $id = (int)($data['id'] ?? 0);
                $isPublic = (int)(bool)($data['is_public'] ?? false);
                if (!$id) throw new Exception('Template ID is required');
                $stmt = $conn->prepare("UPDATE prompt_templates SET is_public = ? WHERE id = ? AND user_id = ?");
                $stmt->execute([$isPublic, $id, $authUser['id']]);
                if (!$stmt->rowCount()) throw new Exception('Template not found or access denied');
                echo json_encode(['success' => true, 'is_public' => $isPublic]);

            } elseif ($action === 'bulk_category') {
                // Set category for multiple templates (own only)
                $ids = array_map('intval', $data['ids'] ?? []);
                $category = $data['category'] ?? null;
                if (!$ids) throw new Exception('No template IDs provided');
                $placeholders = implode(',', array_fill(0, count($ids), '?'));
                $stmt = $conn->prepare("UPDATE prompt_templates SET category = ? WHERE id IN ($placeholders) AND user_id = ?");
                $stmt->execute(array_merge([$category], $ids, [$authUser['id']]));
                echo json_encode(['success' => true, 'updated' => $stmt->rowCount()]);

            } elseif ($action === 'bulk_group') {
                // Assign group to multiple templates (own only)
                $ids = array_map('intval', $data['ids'] ?? []);
                $groupName = $data['group_name'] ?? null;
                $groupColor = $data['group_color'] ?? null;
                if (!$ids) throw new Exception('No template IDs provided');
                $placeholders = implode(',', array_fill(0, count($ids), '?'));
                $stmt = $conn->prepare("UPDATE prompt_templates SET group_name = ?, group_color = ? WHERE id IN ($placeholders) AND user_id = ?");
                $stmt->execute(array_merge([$groupName, $groupColor], $ids, [$authUser['id']]));
                echo json_encode(['success' => true, 'updated' => $stmt->rowCount()]);

            } elseif ($action === 'bulk_delete') {
                $ids = array_map('intval', $data['ids'] ?? []);
                if (!$ids) throw new Exception('No template IDs provided');
                $placeholders = implode(',', array_fill(0, count($ids), '?'));
                $stmt = $conn->prepare("DELETE FROM prompt_templates WHERE id IN ($placeholders) AND user_id = ?");
                $stmt->execute(array_merge($ids, [$authUser['id']]));
                echo json_encode(['success' => true, 'deleted' => $stmt->rowCount()]);

            } elseif ($action === 'export') {
                // Export own templates as JSON
                $ids = isset($data['ids']) ? array_map('intval', $data['ids']) : null;
                $where = $ids ? "t.id IN (" . implode(',', $ids) . ") AND t.user_id = ?" : "t.user_id = ?";
                $stmt = $conn->prepare("
                    SELECT t.template_name, t.prompt_text, t.category, t.group_name, t.group_color, t.is_public, t.created_at,
                           GROUP_CONCAT(
                               CONCAT_WS('|', v.variable_name, v.field_label, v.field_type, v.variable_order)
                               ORDER BY v.variable_order SEPARATOR ';;'
                           ) as variables
                    FROM prompt_templates t
                    LEFT JOIN template_variables v ON t.id = v.template_id
                    WHERE $where
                    GROUP BY t.id
                    ORDER BY t.template_name
                ");
                $stmt->execute([$authUser['id']]);
                $rows = $stmt->fetchAll();
                $export = array_map(function($t) {
                    $t['variables'] = $t['variables']
                        ? array_map(function($v) {
                            list($name, $label, $type, $order) = explode('|', $v);
                            return ['variable_name' => $name, 'field_label' => $label,
                                    'field_type' => $type, 'variable_order' => (int)$order];
                          }, explode(';;', $t['variables']))
                        : [];
                    return $t;
                }, $rows);
                echo json_encode(['success' => true, 'templates' => $export, 'exported_at' => date('c')]);

            } elseif ($action === 'import') {
                // Import templates from JSON
                $templates = $data['templates'] ?? [];
                if (!is_array($templates) || !$templates) throw new Exception('No templates in import data');
                $conn->beginTransaction();
                $imported = 0; $skipped = 0;
                $stmtCheck = $conn->prepare("SELECT id FROM prompt_templates WHERE template_name = ? AND user_id = ?");
                $stmtIns   = $conn->prepare("INSERT INTO prompt_templates (user_id, template_name, prompt_text, category, group_name, group_color, is_public) VALUES (?,?,?,?,?,?,?)");
                $stmtVar   = $conn->prepare("INSERT INTO template_variables (template_id, variable_name, field_label, field_type, variable_order) VALUES (?,?,?,?,?)");
                foreach ($templates as $t) {
                    $name = $t['template_name'] ?? '';
                    $text = $t['prompt_text'] ?? '';
                    if (!$name || !$text) { $skipped++; continue; }
                    $stmtCheck->execute([$name, $authUser['id']]);
                    if ($stmtCheck->fetch()) { $skipped++; continue; } // skip duplicates
                    $isPublic = (int)(bool)($t['is_public'] ?? false);
                    $stmtIns->execute([$authUser['id'], $name, $text,
                        $t['category'] ?? null, $t['group_name'] ?? null, $t['group_color'] ?? null, $isPublic]);
                    $newId = $conn->lastInsertId();
                    foreach ($t['variables'] ?? [] as $order => $v) {
                        $stmtVar->execute([$newId, $v['variable_name'], $v['field_label'],
                            $v['field_type'], $v['variable_order'] ?? $order]);
                    }
                    $imported++;
                }
                $conn->commit();
                echo json_encode(['success' => true, 'imported' => $imported, 'skipped' => $skipped]);
            }
            break;

        // ── PUT ───────────────────────────────────────────────────────────
        case 'PUT':
            $data = json_decode($GLOBALS['_RAW_BODY'] ?: file_get_contents('php://input'), true);
            $templateId = $data['id'] ?? ($_GET['id'] ?? null);
            if (!$templateId) throw new Exception('Template ID is required');
            if (!isset($data['template_name']) || !isset($data['prompt_text'])) throw new Exception('Name and prompt text required');

            $stmt = $conn->prepare("SELECT id FROM prompt_templates WHERE id = ? AND user_id = ?");
            $stmt->execute([$templateId, $authUser['id']]);
            if (!$stmt->fetch()) throw new Exception('Template not found or access denied');

            $isPublic = isset($data['is_public']) ? (int)(bool)$data['is_public'] : null;

            $conn->beginTransaction();
            if ($isPublic !== null) {
                $stmt = $conn->prepare("UPDATE prompt_templates SET template_name = ?, prompt_text = ?, category = ?, group_name = ?, group_color = ?, is_public = ? WHERE id = ? AND user_id = ?");
                $stmt->execute([$data['template_name'], $data['prompt_text'],
                    $data['category'] ?? null, $data['group_name'] ?? null, $data['group_color'] ?? null,
                    $isPublic, $templateId, $authUser['id']]);
            } else {
                $stmt = $conn->prepare("UPDATE prompt_templates SET template_name = ?, prompt_text = ?, category = ?, group_name = ?, group_color = ? WHERE id = ? AND user_id = ?");
                $stmt->execute([$data['template_name'], $data['prompt_text'],
                    $data['category'] ?? null, $data['group_name'] ?? null, $data['group_color'] ?? null,
                    $templateId, $authUser['id']]);
            }

            $stmt = $conn->prepare("DELETE FROM template_variables WHERE template_id = ?");
            $stmt->execute([$templateId]);

            if (isset($data['variables']) && is_array($data['variables'])) {
                $stmt = $conn->prepare("INSERT INTO template_variables (template_id, variable_name, field_label, field_type, variable_order) VALUES (?,?,?,?,?)");
                foreach ($data['variables'] as $order => $var) {
                    $stmt->execute([$templateId, $var['variable_name'], $var['field_label'],
                        $var['field_type'], $var['variable_order'] ?? $order]);
                }
            }
            $conn->commit();
            echo json_encode(['success' => true, 'id' => $templateId, 'message' => 'Template updated']);
            break;

        // ── POST (create) ─────────────────────────────────────────────────
        case 'POST':
            $data = json_decode($GLOBALS['_RAW_BODY'] ?: file_get_contents('php://input'), true);
            if (!isset($data['template_name']) || !isset($data['prompt_text'])) throw new Exception('Name and prompt text required');

            $isPublic = isset($data['is_public']) ? (int)(bool)$data['is_public'] : 0;

            $conn->beginTransaction();
            $stmt = $conn->prepare("INSERT INTO prompt_templates (user_id, template_name, prompt_text, category, group_name, group_color, is_public) VALUES (?,?,?,?,?,?,?)");
            $stmt->execute([$authUser['id'], $data['template_name'], $data['prompt_text'],
                $data['category'] ?? null, $data['group_name'] ?? null, $data['group_color'] ?? null, $isPublic]);
            $templateId = $conn->lastInsertId();

            if (isset($data['variables']) && is_array($data['variables'])) {
                $stmt = $conn->prepare("INSERT INTO template_variables (template_id, variable_name, field_label, field_type, variable_order) VALUES (?,?,?,?,?)");
                $order = 0;
                foreach ($data['variables'] as $var) {
                    $stmt->execute([$templateId, $var['variable_name'], $var['field_label'],
                        $var['field_type'], $order++]);
                }
            }
            $conn->commit();
            echo json_encode(['success' => true, 'id' => $templateId, 'message' => 'Template created']);
            break;

        // ── DELETE ────────────────────────────────────────────────────────
        case 'DELETE':
            parse_str(file_get_contents('php://input'), $data);
            if (!isset($data['id'])) throw new Exception('Template ID is required');
            $stmt = $conn->prepare("DELETE FROM prompt_templates WHERE id = ? AND user_id = ?");
            $stmt->execute([$data['id'], $authUser['id']]);
            echo json_encode(['success' => true]);
            break;

        default:
            throw new Exception('Method not allowed');
    }

} catch (Exception $e) {
    logError($e->getMessage(), 'templates.php - ' . $method);
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
