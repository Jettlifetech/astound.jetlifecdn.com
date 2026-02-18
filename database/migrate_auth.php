<?php
/**
 * Authentication Migration Script
 *
 * Creates users table, seeds default admin, and adds user_id columns
 * to prompt_templates and prompt_history.
 *
 * Run from CLI: php database/migrate_auth.php
 */

// Only allow CLI execution
if (php_sapi_name() !== 'cli') {
    http_response_code(403);
    echo 'This script can only be run from the command line.';
    exit(1);
}

require_once __DIR__ . '/../config/database.php';

try {
    $conn = getDbConnection();
    echo "Connected to database.\n";

    // 1. Create users table
    $conn->exec("CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('admin', 'user') NOT NULL DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )");
    echo "  [OK] users table ready.\n";

    // 2. Seed default admin account (idempotent)
    $exists = $conn->query("SELECT COUNT(*) FROM users WHERE username = 'admin'")->fetchColumn();
    if (!$exists) {
        $hash = password_hash('ChangeMe123!', PASSWORD_DEFAULT);
        $stmt = $conn->prepare("INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, 'admin')");
        $stmt->execute(['admin', 'admin@localhost', $hash]);
        echo "  [OK] Default admin account created (username: admin, password: ChangeMe123!).\n";
    } else {
        echo "  [SKIP] Admin account already exists.\n";
    }

    // Get admin ID for default user_id values
    $adminId = $conn->query("SELECT id FROM users WHERE username = 'admin'")->fetchColumn();

    // 3. Add user_id to prompt_templates (if not exists)
    $cols = $conn->query("SHOW COLUMNS FROM prompt_templates LIKE 'user_id'")->fetchAll();
    if (empty($cols)) {
        $conn->exec("ALTER TABLE prompt_templates ADD COLUMN user_id INT NOT NULL DEFAULT {$adminId} AFTER id");
        $conn->exec("ALTER TABLE prompt_templates ADD FOREIGN KEY (user_id) REFERENCES users(id)");
        $conn->exec("CREATE INDEX idx_templates_user ON prompt_templates(user_id)");
        echo "  [OK] Added user_id to prompt_templates (existing rows assigned to admin).\n";
    } else {
        echo "  [SKIP] prompt_templates.user_id already exists.\n";
    }

    // 4. Add user_id to prompt_history (if not exists)
    $cols = $conn->query("SHOW COLUMNS FROM prompt_history LIKE 'user_id'")->fetchAll();
    if (empty($cols)) {
        $conn->exec("ALTER TABLE prompt_history ADD COLUMN user_id INT NOT NULL DEFAULT {$adminId} AFTER id");
        $conn->exec("ALTER TABLE prompt_history ADD FOREIGN KEY (user_id) REFERENCES users(id)");
        $conn->exec("CREATE INDEX idx_history_user ON prompt_history(user_id)");
        echo "  [OK] Added user_id to prompt_history (existing rows assigned to admin).\n";
    } else {
        echo "  [SKIP] prompt_history.user_id already exists.\n";
    }

    echo "\nMigration complete!\n";

} catch (Exception $e) {
    echo "\n[ERROR] Migration failed: " . $e->getMessage() . "\n";
    exit(1);
}
