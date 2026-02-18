<?php
// Database Configuration
define('DB_HOST', 'localhost');
define('DB_USER', 'jltremoteroot');  // Change this to your MySQL username
define('DB_PASS', 'DuiES#aowbfPgRD');      // Change this to your MySQL password
define('DB_NAME', 'prompt_db');

// Create database connection
function getDbConnection() {
    try {
        $conn = new PDO(
            "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
            DB_USER,
            DB_PASS,
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false
            ]
        );
        return $conn;
    } catch(PDOException $e) {
        logError("Database connection failed: " . $e->getMessage(), "Connection");
        throw $e;
    }
}

// Log errors to database
function logError($message, $context = '') {
    try {
        $conn = new PDO(
            "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
            DB_USER,
            DB_PASS
        );
        $stmt = $conn->prepare("INSERT INTO error_logs (error_message, error_context) VALUES (?, ?)");
        $stmt->execute([$message, $context]);
    } catch(PDOException $e) {
        error_log("Failed to log error to database: " . $e->getMessage());
    }
}
?>
