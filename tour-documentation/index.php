<?php
// --- PHP Backend Logic ---

// Define the directory to scan (current directory)
$scan_dir = __DIR__;

// Action: Handle file deletion
if (isset($_GET['action']) && $_GET['action'] === 'delete' && isset($_GET['file'])) {
    $file_to_delete = basename($_GET['file']); // Sanitize: strip any path traversal
    $full_path = $scan_dir . DIRECTORY_SEPARATOR . $file_to_delete;

    if (file_exists($full_path) && $full_path !== __FILE__) { // Prevent deleting this script
        if (is_dir($full_path)) {
            rmdir($full_path); // Remove empty directory
        } else {
            unlink($full_path); // Delete file
        }
        http_response_code(200);
    } else {
        http_response_code(404);
    }
    exit;
}

// Build directory listing array
$items = [];
$id = 1;
$scan_results = scandir($scan_dir);

foreach ($scan_results as $entry) {
    // Skip hidden files and current/parent directory entries
    if ($entry === '.' || $entry === '..' || str_starts_with($entry, '.')) {
        continue;
    }

    $full_path = $scan_dir . DIRECTORY_SEPARATOR . $entry;
    $mod_time  = date('Y-m-d h:i A', filemtime($full_path));

    if (is_dir($full_path)) {
        $items[] = [
            'id'       => $id++,
            'type'     => 'folder',
            'fileType' => 'folder',
            'name'     => $entry,
            'date'     => $mod_time,
            'size'     => '—',
        ];
    } else {
        $bytes = filesize($full_path);
        if ($bytes >= 1073741824)      $size = number_format($bytes / 1073741824, 2) . ' GB';
        elseif ($bytes >= 1048576)     $size = number_format($bytes / 1048576, 2)    . ' MB';
        elseif ($bytes >= 1024)        $size = number_format($bytes / 1024, 2)        . ' KB';
        else                           $size = $bytes . ' B';

        $ext = strtolower(pathinfo($entry, PATHINFO_EXTENSION));
        $file_type_map = [
            'pdf'  => 'pdf',
            'png'  => 'img', 'jpg' => 'img', 'jpeg' => 'img',
            'gif'  => 'img', 'svg' => 'img', 'webp' => 'img',
            'html' => 'code', 'php' => 'code', 'js'  => 'code',
            'css'  => 'code', 'ts'  => 'code', 'json' => 'code',
            'sh'   => 'code', 'py'  => 'code',
        ];
        $file_type = $file_type_map[$ext] ?? 'file';

        $items[] = [
            'id'       => $id++,
            'type'     => 'file',
            'fileType' => $file_type,
            'name'     => $entry,
            'date'     => $mod_time,
            'size'     => $size,
        ];
    }
}

$directory_json = json_encode($items);
$current_dir    = htmlspecialchars($scan_dir);
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Files Index | Daine Dvorak</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        body {
            background-color: #f4f6f9;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
        }
        .animated-gradient-bg {
            background: linear-gradient(-45deg, #0f172a, #312e81, #4338ca, #3b82f6);
            background-size: 400% 400%;
            animation: gradientBG 15s ease infinite;
            color: white;
            padding: 4rem 2rem;
            border-bottom: 5px solid #6366f1;
        }
        @keyframes gradientBG {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }
        .navbar {
            background-color: #ffffff;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .navbar-brand svg { display: block; }
        .table-container {
            margin-top: -50px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            overflow: hidden;
            padding: 20px;
        }
        .table thead {
            background-color: #f8fafc;
            color: #64748b;
            text-transform: uppercase;
            font-size: 0.85rem;
            letter-spacing: 0.05em;
        }
        .table-hover tbody tr:hover {
            background-color: #f1f5f9;
            transition: background-color 0.2s ease;
        }
        .icon-cell { width: 40px; text-align: center; }
        .folder-icon { color: #f59e0b; }
        .file-icon   { color: #64748b; }
        .pdf-icon    { color: #ef4444; }
        .img-icon    { color: #3b82f6; }
        .code-icon   { color: #10b981; }
        footer {
            margin-top: auto;
            background-color: #000000;
            color: #ffffff;
            padding: 20px 0;
            text-align: center;
            font-size: 0.9rem;
        }
        .btn { transition: transform 0.1s ease; }
        .btn:active { transform: scale(0.95); }
    </style>
</head>
<body>
    <nav class="navbar navbar-expand-lg navbar-light sticky-top">
        <div class="container">
            <a class="navbar-brand" href="#">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 50" width="200" height="50">
                  <defs>
                    <linearGradient id="spaceGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style="stop-color:#6366f1"/>
                      <stop offset="50%" style="stop-color:#8b5cf6"/>
                      <stop offset="100%" style="stop-color:#06b6d4"/>
                    </linearGradient>
                    <linearGradient id="accentGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" style="stop-color:#f97316"/>
                      <stop offset="100%" style="stop-color:#ef4444"/>
                    </linearGradient>
                    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="0.5" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>
                  <circle cx="15" cy="8" r="1" fill="#a5b4fc" opacity="0.7" filter="url(#glow)"/>
                  <circle cx="35" cy="42" r="0.8" fill="#c4b5fd" opacity="0.6" filter="url(#glow)"/>
                  <circle cx="48" cy="12" r="0.6" fill="#67e8f9" opacity="0.5" filter="url(#glow)"/>
                  <g transform="translate(5, 3)">
                    <path d="M12 0 L30 0 L36 6 L36 38 C36 40 34 42 32 42 L8 42 C6 42 4 40 4 38 L4 6 C4 3 6 0 8 0 Z" fill="url(#spaceGradient)" opacity="0.95"/>
                    <path d="M30 0 L30 6 L36 6 Z" fill="#4f46e5" opacity="0.6"/>
                    <path d="M20 2 L24 8 L16 8 Z" fill="url(#accentGradient)"/>
                    <line x1="10" y1="16" x2="20" y2="16" stroke="#e0e7ff" stroke-width="1.5" stroke-linecap="round"/>
                    <line x1="10" y1="22" x2="26" y2="22" stroke="#e0e7ff" stroke-width="1.5" stroke-linecap="round"/>
                    <line x1="10" y1="28" x2="22" y2="28" stroke="#e0e7ff" stroke-width="1.5" stroke-linecap="round"/>
                    <circle cx="28" cy="16" r="2" fill="#67e8f9"/>
                    <line x1="22" y1="16" x2="26" y2="16" stroke="#67e8f9" stroke-width="1"/>
                    <path d="M15 42 L17 48 L20 44 L23 48 L25 42" fill="none" stroke="url(#accentGradient)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <ellipse cx="20" cy="42" rx="4" ry="1.5" fill="#6366f1"/>
                  </g>
                  <g transform="translate(52, 0)">
                    <text x="0" y="28" font-family="'Segoe UI', Arial, sans-serif" font-size="20" font-weight="900" fill="url(#spaceGradient)">Files</text>
                    <text x="52" y="28" font-family="'Segoe UI', Arial, sans-serif" font-size="20" font-weight="700" fill="url(#spaceGradient)">Index</text>
                  </g>
                  <ellipse cx="25" cy="25" rx="22" ry="8" fill="none" stroke="#8b5cf6" stroke-width="0.8" stroke-dasharray="3,2" opacity="0.5" transform="rotate(-20, 25, 25)"/>
                  <circle cx="45" cy="18" r="2" fill="#06b6d4" filter="url(#glow)"/>
                </svg>
            </a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse justify-content-end" id="navbarNav">
                <ul class="navbar-nav">
                    <li class="nav-item"><a class="nav-link active" href="https://code.jetlifecdn.com/">Home</a></li>
                </ul>
            </div>
        </div>
    </nav>

    <div class="container-fluid animated-gradient-bg mb-4">
        <div class="container text-center text-lg-start">
            <h1 class="display-4 fw-bold">Directory Explorer</h1>
            <p class="lead text-white-50">Manage your digital assets securely and efficiently.</p>
        </div>
    </div>

    <div class="container mb-5">
        <div class="table-container">
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h4 class="mb-0 text-dark">
                    <i class="fas fa-hdd me-2 text-primary"></i>
                    Current Directory: <?= $current_dir ?>
                </h4>
                <button class="btn btn-outline-primary btn-sm" onclick="location.reload()">
                    <i class="fas fa-sync-alt me-1"></i> Refresh
                </button>
            </div>
            <div class="table-responsive">
                <table class="table table-hover align-middle">
                    <thead>
                        <tr>
                            <th scope="col">Type</th>
                            <th scope="col">Date Modified</th>
                            <th scope="col">Name</th>
                            <th scope="col">Size</th>
                            <th scope="col" class="text-center">Action</th>
                            <th scope="col" class="text-center">Delete</th>
                        </tr>
                    </thead>
                    <tbody id="file-directory-body"></tbody>
                </table>
            </div>
        </div>
    </div>

    <footer>
        <div class="container">
            <p class="mb-0">Created By: Daine Dvorak 2026</p>
        </div>
    </footer>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script>
        let directoryData = <?= $directory_json ?>;

        function getIconHtml(item) {
            if (item.type === 'folder') return '<i class="fas fa-folder folder-icon fa-lg"></i>';
            switch (item.fileType) {
                case 'pdf':  return '<i class="fas fa-file-pdf pdf-icon fa-lg"></i>';
                case 'img':  return '<i class="fas fa-file-image img-icon fa-lg"></i>';
                case 'code': return '<i class="fas fa-file-code code-icon fa-lg"></i>';
                default:     return '<i class="fas fa-file file-icon fa-lg"></i>';
            }
        }

        function renderTable() {
            const tbody = document.getElementById('file-directory-body');
            tbody.innerHTML = '';
            if (directoryData.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-muted">Directory is empty</td></tr>';
                return;
            }
            directoryData.forEach(item => {
                const tr = document.createElement('tr');
                const actionButton = item.type === 'folder'
                    ? `<button class="btn btn-warning btn-sm text-dark fw-bold w-100" onclick="openFolder('${item.name}')">
                           <i class="fas fa-folder-open me-1"></i> Open Folder
                       </button>`
                    : `<button class="btn btn-outline-primary btn-sm w-100" onclick="viewFile('${item.name}')">
                           <i class="fas fa-eye me-1"></i> View File
                       </button>`;
                tr.innerHTML = `
                    <td class="icon-cell">${getIconHtml(item)}</td>
                    <td class="text-muted fw-small">${item.date}</td>
                    <td class="fw-bold text-dark">${item.name}</td>
                    <td><span class="badge bg-light text-dark border">${item.size}</span></td>
                    <td style="width:180px;">${actionButton}</td>
                    <td class="text-center" style="width:100px;">
                        <button class="btn btn-danger btn-sm" onclick="deleteItem(${item.id}, '${item.name}')">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </td>`;
                tbody.appendChild(tr);
            });
        }

        function viewFile(fileName)   { window.open(fileName, '_blank'); }
        function openFolder(folderName) { window.open(folderName, '_blank'); }

        async function deleteItem(id, name) {
            if (!confirm(`Are you sure you want to permanently delete "${name}"?`)) return;
            try {
                await fetch(`?action=delete&file=${encodeURIComponent(name)}`);
                location.reload();
            } catch (error) {
                alert('Error deleting file: ' + error);
            }
        }

        document.addEventListener('DOMContentLoaded', renderTable);
    </script>
</body>
</html>
