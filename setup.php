<?php
/**
 * Setup Script for Prompt Template Manager
 * 
 * This script helps initialize the database and check system requirements.
 * Run this once after installation by accessing: http://your-domain/setup.php
 * 
 * IMPORTANT: Delete this file after successful setup for security reasons.
 */

$errors = [];
$warnings = [];
$success = [];

// Check PHP version
if (version_compare(PHP_VERSION, '7.4.0', '<')) {
    $errors[] = "PHP 7.4 or higher is required. Current version: " . PHP_VERSION;
} else {
    $success[] = "PHP version: " . PHP_VERSION;
}

// Check required extensions
$required_extensions = ['pdo', 'pdo_mysql', 'json', 'mbstring'];
foreach ($required_extensions as $ext) {
    if (!extension_loaded($ext)) {
        $errors[] = "Required PHP extension missing: $ext";
    } else {
        $success[] = "PHP extension loaded: $ext";
    }
}

// Check if config file exists
if (!file_exists('config/database.php')) {
    $errors[] = "Database configuration file not found: config/database.php";
} else {
    $success[] = "Configuration file found";
}

// Check if schema file exists
if (!file_exists('database/schema.sql')) {
    $errors[] = "Database schema file not found: database/schema.sql";
} else {
    $success[] = "Schema file found";
}

// Test database connection and setup
$db_setup_success = false;
$db_error = '';

if (empty($errors)) {
    require_once 'config/database.php';
    
    try {
        // Try to connect without database first to create it
        $conn = new PDO(
            "mysql:host=" . DB_HOST . ";charset=utf8mb4",
            DB_USER,
            DB_PASS,
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
        );
        
        // Create database if it doesn't exist
        $conn->exec("CREATE DATABASE IF NOT EXISTS " . DB_NAME);
        $success[] = "Database '" . DB_NAME . "' created or already exists";
        
        // Use the database
        $conn->exec("USE " . DB_NAME);
        
        // Read and execute schema file
        $schema = file_get_contents('database/schema.sql');
        
        // Split by semicolons and execute each statement
        $statements = array_filter(array_map('trim', explode(';', $schema)));
        
        foreach ($statements as $statement) {
            if (!empty($statement) && !preg_match('/^--/', $statement)) {
                $conn->exec($statement);
            }
        }
        
        $success[] = "Database tables created successfully";
        
        // Verify tables were created
        $tables = $conn->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
        $expected_tables = ['prompt_templates', 'template_variables', 'prompt_history', 'error_logs'];
        
        foreach ($expected_tables as $table) {
            if (in_array($table, $tables)) {
                $success[] = "Table verified: $table";
            } else {
                $errors[] = "Table missing: $table";
            }
        }
        
        $db_setup_success = true;
        
    } catch (PDOException $e) {
        $db_error = $e->getMessage();
        $errors[] = "Database error: " . $db_error;
    }
}

// Check directory permissions
$writable_dirs = ['api', 'config'];
foreach ($writable_dirs as $dir) {
    if (is_writable($dir)) {
        $success[] = "Directory writable: $dir";
    } else {
        $warnings[] = "Directory not writable: $dir (may cause issues)";
    }
}

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Setup - Prompt Template Manager</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.min.css" rel="stylesheet">
</head>
<body class="bg-light">
    <div class="container my-5">
        <div class="card shadow">
            <div class="card-header bg-primary text-white">
                <h3 class="mb-0"><i class="bi bi-gear-fill"></i> Prompt Template Manager - Setup</h3>
            </div>
            <div class="card-body">
                <?php if (!empty($errors)): ?>
                    <div class="alert alert-danger">
                        <h5><i class="bi bi-x-circle-fill"></i> Errors Found</h5>
                        <ul class="mb-0">
                            <?php foreach ($errors as $error): ?>
                                <li><?php echo htmlspecialchars($error); ?></li>
                            <?php endforeach; ?>
                        </ul>
                    </div>
                <?php endif; ?>
                
                <?php if (!empty($warnings)): ?>
                    <div class="alert alert-warning">
                        <h5><i class="bi bi-exclamation-triangle-fill"></i> Warnings</h5>
                        <ul class="mb-0">
                            <?php foreach ($warnings as $warning): ?>
                                <li><?php echo htmlspecialchars($warning); ?></li>
                            <?php endforeach; ?>
                        </ul>
                    </div>
                <?php endif; ?>
                
                <?php if (!empty($success)): ?>
                    <div class="alert alert-success">
                        <h5><i class="bi bi-check-circle-fill"></i> Success</h5>
                        <ul class="mb-0">
                            <?php foreach ($success as $item): ?>
                                <li><?php echo htmlspecialchars($item); ?></li>
                            <?php endforeach; ?>
                        </ul>
                    </div>
                <?php endif; ?>
                
                <?php if (empty($errors) && $db_setup_success): ?>
                    <div class="alert alert-info">
                        <h5><i class="bi bi-info-circle-fill"></i> Setup Complete!</h5>
                        <p class="mb-0">Your Prompt Template Manager is ready to use.</p>
                    </div>
                    
                    <div class="d-grid gap-2 mt-4">
                        <a href="index.html" class="btn btn-primary btn-lg">
                            <i class="bi bi-house-fill"></i> Go to Home Page
                        </a>
                        <a href="template-creator.html" class="btn btn-success btn-lg">
                            <i class="bi bi-plus-circle-fill"></i> Create Your First Template
                        </a>
                    </div>
                    
                    <div class="alert alert-warning mt-4">
                        <strong><i class="bi bi-shield-exclamation"></i> Security Notice:</strong>
                        For security reasons, please delete this setup.php file after completing the setup.
                    </div>
                <?php elseif (empty($errors)): ?>
                    <div class="alert alert-info">
                        <h5><i class="bi bi-arrow-clockwise"></i> Ready to Setup</h5>
                        <p class="mb-2">All system requirements are met. Click the button below to initialize the database.</p>
                        <button onclick="location.reload()" class="btn btn-primary">
                            <i class="bi bi-play-fill"></i> Initialize Database
                        </button>
                    </div>
                <?php else: ?>
                    <div class="alert alert-danger mt-4">
                        <strong><i class="bi bi-exclamation-octagon"></i> Setup Cannot Continue</strong>
                        <p class="mb-0">Please fix the errors above and refresh this page.</p>
                    </div>
                    
                    <div class="card mt-4">
                        <div class="card-header">
                            <h5 class="mb-0">Common Solutions</h5>
                        </div>
                        <div class="card-body">
                            <h6>Database Configuration:</h6>
                            <p>Edit <code>config/database.php</code> with your MySQL credentials.</p>
                            
                            <h6>Database Creation:</h6>
                            <pre class="bg-dark text-white p-3 rounded">mysql -u root -p < database/schema.sql</pre>
                            
                            <h6>File Permissions:</h6>
                            <pre class="bg-dark text-white p-3 rounded">sudo chmod -R 755 /var/www/prompt-db.dainedvorak.com/</pre>
                        </div>
                    </div>
                <?php endif; ?>
                
                <hr class="my-4">
                
                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0"><i class="bi bi-info-circle"></i> System Information</h5>
                    </div>
                    <div class="card-body">
                        <table class="table table-sm">
                            <tr>
                                <th>PHP Version:</th>
                                <td><?php echo PHP_VERSION; ?></td>
                            </tr>
                            <tr>
                                <th>Server Software:</th>
                                <td><?php echo $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown'; ?></td>
                            </tr>
                            <tr>
                                <th>Document Root:</th>
                                <td><?php echo $_SERVER['DOCUMENT_ROOT'] ?? 'Unknown'; ?></td>
                            </tr>
                            <tr>
                                <th>PDO Drivers:</th>
                                <td><?php echo implode(', ', PDO::getAvailableDrivers()); ?></td>
                            </tr>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
