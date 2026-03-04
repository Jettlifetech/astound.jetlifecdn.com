<?php
/**
 * Migration: Add default_value, is_hidden, version, is_archived columns
 *
 * Run once:  php database/migrate_template_features.php
 */
require_once __DIR__ . '/../config/database.php';

try {
    $conn = getDbConnection();
    echo "Connected to database.\n";

    // 1. default_value on template_variables
    $cols = $conn->query("SHOW COLUMNS FROM template_variables LIKE 'default_value'")->fetchAll();
    if (empty($cols)) {
        $conn->exec("ALTER TABLE template_variables ADD COLUMN default_value TEXT DEFAULT NULL AFTER variable_order");
        echo "  [OK] Added default_value to template_variables.\n";
    } else {
        echo "  [SKIP] template_variables.default_value already exists.\n";
    }

    // 2. is_hidden on prompt_templates
    $cols = $conn->query("SHOW COLUMNS FROM prompt_templates LIKE 'is_hidden'")->fetchAll();
    if (empty($cols)) {
        $conn->exec("ALTER TABLE prompt_templates ADD COLUMN is_hidden TINYINT(1) NOT NULL DEFAULT 0 COMMENT '1=hidden from Generate dropdown'");
        echo "  [OK] Added is_hidden to prompt_templates.\n";
    } else {
        echo "  [SKIP] prompt_templates.is_hidden already exists.\n";
    }

    // 3. version on prompt_templates
    $cols = $conn->query("SHOW COLUMNS FROM prompt_templates LIKE 'version'")->fetchAll();
    if (empty($cols)) {
        $conn->exec("ALTER TABLE prompt_templates ADD COLUMN version INT NOT NULL DEFAULT 1");
        echo "  [OK] Added version to prompt_templates.\n";
    } else {
        echo "  [SKIP] prompt_templates.version already exists.\n";
    }

    // 4. is_archived on prompt_templates
    $cols = $conn->query("SHOW COLUMNS FROM prompt_templates LIKE 'is_archived'")->fetchAll();
    if (empty($cols)) {
        $conn->exec("ALTER TABLE prompt_templates ADD COLUMN is_archived TINYINT(1) NOT NULL DEFAULT 0 COMMENT '1=archived old version'");
        echo "  [OK] Added is_archived to prompt_templates.\n";
    } else {
        echo "  [SKIP] prompt_templates.is_archived already exists.\n";
    }

    // 5. Update unique key to include version (allows same name with different versions)
    $indexes = $conn->query("SHOW INDEX FROM prompt_templates WHERE Key_name = 'uq_user_template'")->fetchAll();
    if (!empty($indexes)) {
        $conn->exec("ALTER TABLE prompt_templates DROP INDEX uq_user_template");
        $conn->exec("ALTER TABLE prompt_templates ADD UNIQUE KEY uq_user_template_ver (user_id, template_name, version)");
        echo "  [OK] Updated unique key to include version.\n";
    } else {
        $indexes2 = $conn->query("SHOW INDEX FROM prompt_templates WHERE Key_name = 'uq_user_template_ver'")->fetchAll();
        if (empty($indexes2)) {
            $conn->exec("ALTER TABLE prompt_templates ADD UNIQUE KEY uq_user_template_ver (user_id, template_name, version)");
            echo "  [OK] Added unique key with version.\n";
        } else {
            echo "  [SKIP] uq_user_template_ver already exists.\n";
        }
    }

    // 6. Index for quick archived filtering
    $indexes3 = $conn->query("SHOW INDEX FROM prompt_templates WHERE Key_name = 'idx_is_archived'")->fetchAll();
    if (empty($indexes3)) {
        $conn->exec("CREATE INDEX idx_is_archived ON prompt_templates(is_archived)");
        echo "  [OK] Added idx_is_archived index.\n";
    } else {
        echo "  [SKIP] idx_is_archived already exists.\n";
    }

    echo "\nMigration complete!\n";

} catch (Exception $e) {
    echo "\n[ERROR] Migration failed: " . $e->getMessage() . "\n";
    exit(1);
}
