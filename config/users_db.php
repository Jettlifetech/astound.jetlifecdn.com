<?php
/**
 * JSON-file-based user database helper.
 * All user CRUD operations read/write to data/users.json.
 */

define('USERS_JSON_PATH', __DIR__ . '/../data/users.json');

/**
 * Read all users from JSON file.
 * Returns associative array with 'next_id' and 'users' keys.
 */
function readUsersDb() {
    if (!file_exists(USERS_JSON_PATH)) {
        return ['next_id' => 1, 'users' => []];
    }
    $raw = file_get_contents(USERS_JSON_PATH);
    $data = json_decode($raw, true);
    if (!$data || !isset($data['users'])) {
        return ['next_id' => 1, 'users' => []];
    }
    return $data;
}

/**
 * Write users database back to JSON file.
 */
function writeUsersDb($data) {
    $dir = dirname(USERS_JSON_PATH);
    if (!is_dir($dir)) mkdir($dir, 0755, true);
    $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    file_put_contents(USERS_JSON_PATH, $json, LOCK_EX);
}

/**
 * Find user by username.
 */
function findUserByUsername($username) {
    $db = readUsersDb();
    foreach ($db['users'] as $u) {
        if (strcasecmp($u['username'], $username) === 0) {
            return $u;
        }
    }
    return null;
}

/**
 * Find user by ID.
 */
function findUserById($id) {
    $db = readUsersDb();
    foreach ($db['users'] as $u) {
        if ((int)$u['id'] === (int)$id) {
            return $u;
        }
    }
    return null;
}

/**
 * Get all users (without password_hash).
 */
function getAllUsers() {
    $db = readUsersDb();
    return array_map(function($u) {
        unset($u['password_hash']);
        return $u;
    }, $db['users']);
}

/**
 * Create a new user. Returns the new user array (without password_hash).
 */
function createUser($username, $password, $email = '', $firstName = '', $lastName = '', $role = 'user') {
    $db = readUsersDb();

    // Check duplicate username
    foreach ($db['users'] as $u) {
        if (strcasecmp($u['username'], $username) === 0) {
            throw new Exception("Username '{$username}' already exists");
        }
    }

    $newUser = [
        'id' => $db['next_id'],
        'username' => $username,
        'first_name' => $firstName,
        'last_name' => $lastName,
        'email' => $email,
        'password_hash' => password_hash($password, PASSWORD_DEFAULT),
        'role' => in_array($role, ['admin', 'user']) ? $role : 'user',
        'created_at' => date('c')
    ];

    $db['users'][] = $newUser;
    $db['next_id']++;
    writeUsersDb($db);

    // Also sync to MySQL if available
    syncUserToMySQL($newUser);

    $safe = $newUser;
    unset($safe['password_hash']);
    return $safe;
}

/**
 * Update a user by ID. Only updates provided fields.
 */
function updateUser($id, $updates) {
    $db = readUsersDb();
    $found = false;
    $updatedUser = null;

    foreach ($db['users'] as &$u) {
        if ((int)$u['id'] === (int)$id) {
            $found = true;

            // Check username uniqueness if changing username
            if (isset($updates['username']) && strcasecmp($updates['username'], $u['username']) !== 0) {
                foreach ($db['users'] as $other) {
                    if ((int)$other['id'] !== (int)$id && strcasecmp($other['username'], $updates['username']) === 0) {
                        throw new Exception("Username '{$updates['username']}' already exists");
                    }
                }
                $u['username'] = $updates['username'];
            }

            if (isset($updates['first_name'])) $u['first_name'] = $updates['first_name'];
            if (isset($updates['last_name'])) $u['last_name'] = $updates['last_name'];
            if (isset($updates['email'])) $u['email'] = $updates['email'];
            if (isset($updates['role'])) $u['role'] = in_array($updates['role'], ['admin', 'user']) ? $updates['role'] : $u['role'];

            // Only hash password if a new one is provided
            if (!empty($updates['password'])) {
                if (strlen($updates['password']) < 6) {
                    throw new Exception('Password must be at least 6 characters');
                }
                $u['password_hash'] = password_hash($updates['password'], PASSWORD_DEFAULT);
            }

            $updatedUser = $u;
            break;
        }
    }
    unset($u);

    if (!$found) throw new Exception('User not found');

    writeUsersDb($db);
    syncUserToMySQL($updatedUser);

    $safe = $updatedUser;
    unset($safe['password_hash']);
    return $safe;
}

/**
 * Delete a user by ID.
 */
function deleteUser($id, $currentUserId) {
    if ((int)$id === (int)$currentUserId) {
        throw new Exception('Cannot delete your own account');
    }

    $db = readUsersDb();

    // Check if deleting last admin
    $target = null;
    foreach ($db['users'] as $u) {
        if ((int)$u['id'] === (int)$id) {
            $target = $u;
            break;
        }
    }
    if (!$target) throw new Exception('User not found');

    if ($target['role'] === 'admin') {
        $adminCount = count(array_filter($db['users'], fn($u) => $u['role'] === 'admin'));
        if ($adminCount <= 1) {
            throw new Exception('Cannot delete the last admin account');
        }
    }

    $db['users'] = array_values(array_filter($db['users'], fn($u) => (int)$u['id'] !== (int)$id));
    writeUsersDb($db);

    // Also remove from MySQL
    try {
        require_once __DIR__ . '/database.php';
        $conn = getDbConnection();
        $stmt = $conn->prepare("DELETE FROM users WHERE id = ?");
        $stmt->execute([(int)$id]);
    } catch (Exception $e) { /* ignore MySQL sync errors */ }

    return true;
}

/**
 * Sync a user record to MySQL (for auth compatibility).
 */
function syncUserToMySQL($user) {
    try {
        require_once __DIR__ . '/database.php';
        $conn = getDbConnection();

        // Check if columns exist, add if not
        try {
            $conn->exec("ALTER TABLE users ADD COLUMN first_name VARCHAR(100) DEFAULT '' AFTER username");
        } catch (Exception $e) { /* column exists */ }
        try {
            $conn->exec("ALTER TABLE users ADD COLUMN last_name VARCHAR(100) DEFAULT '' AFTER first_name");
        } catch (Exception $e) { /* column exists */ }

        // Upsert
        $stmt = $conn->prepare("
            INSERT INTO users (id, username, first_name, last_name, email, password_hash, role, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                username = VALUES(username),
                first_name = VALUES(first_name),
                last_name = VALUES(last_name),
                email = VALUES(email),
                password_hash = VALUES(password_hash),
                role = VALUES(role)
        ");
        $stmt->execute([
            $user['id'],
            $user['username'],
            $user['first_name'] ?? '',
            $user['last_name'] ?? '',
            $user['email'] ?? '',
            $user['password_hash'],
            $user['role'],
            $user['created_at']
        ]);
    } catch (Exception $e) {
        // Non-critical: MySQL sync can fail silently
        error_log('MySQL user sync failed: ' . $e->getMessage());
    }
}
