// History Page
const API_BASE = 'api/';

let allHistory = [];
let currentFilter = 'all';

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    loadHistory();
    
    // Filter button event listeners
    document.querySelectorAll('[data-filter]').forEach(btn => {
        btn.addEventListener('click', function() {
            // Update active button
            document.querySelectorAll('[data-filter]').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Apply filter
            currentFilter = this.dataset.filter;
            displayHistory();
        });
    });
});

// Load history from API
async function loadHistory() {
    try {
        const response = await fetch(API_BASE + 'history.php');
        allHistory = await response.json();
        
        displayHistory();
        updateStatistics();
        
        document.getElementById('loadingSpinner').style.display = 'none';
        
    } catch (error) {
        console.error('Error loading history:', error);
        document.getElementById('loadingSpinner').innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle"></i> Error loading history: ${error.message}
            </div>
        `;
    }
}

// Display history items based on current filter
function displayHistory() {
    const container = document.getElementById('historyContainer');
    const emptyState = document.getElementById('emptyState');
    
    // Filter items based on current filter
    let filteredHistory = allHistory;
    if (currentFilter !== 'all') {
        filteredHistory = allHistory.filter(item => {
            if (currentFilter === 'prompts') return item.type === 'prompt';
            if (currentFilter === 'templates') return item.type === 'template';
            if (currentFilter === 'errors') return item.type === 'error';
            return true;
        });
    }
    
    if (filteredHistory.length === 0) {
        container.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    
    container.style.display = 'block';
    emptyState.style.display = 'none';
    container.innerHTML = '';
    
    filteredHistory.forEach(item => {
        const historyItem = createHistoryItem(item);
        container.appendChild(historyItem);
    });
}

// Create history item element
function createHistoryItem(item) {
    const div = document.createElement('div');
    div.className = `card history-item type-${item.type} mb-3`;
    
    let content = '';
    let badgeClass = '';
    let badgeIcon = '';
    
    switch(item.type) {
        case 'prompt':
            badgeClass = 'bg-primary';
            badgeIcon = 'bi-file-text';
            content = `
                <div class="card-header">
                    <div class="d-flex justify-content-between align-items-center text-white">
                        <h6 class="mb-0">
                            <span class="badge ${badgeClass} badge-type me-2">
                                <i class="bi ${badgeIcon}"></i> Prompt Generated
                            </span>
                            ${item.template_name}
                        </h6>
                        <small class="text-white">
                            <i class="bi bi-clock"></i> ${formatDate(item.created_at)}
                        </small>
                    </div>
                </div>
                <div class="card-body">
                    <h6 class="mb-2 text-white">Generated Prompt:</h6>
                    <div class="prompt-text">${escapeHtml(item.generated_prompt)}</div>
                    ${item.variable_data ? createVariableDataDisplay(item.variable_data) : ''}
                    <button class="btn btn-sm btn-outline-primary mt-2" onclick="copyPromptText('${escapeHtml(item.generated_prompt)}')">
                        <i class="bi bi-clipboard"></i> Copy
                    </button>
                </div>
            `;
            break;
            
        case 'template':
            badgeClass = 'bg-success';
            badgeIcon = 'bi-file-earmark-plus';
            content = `
                <div class="card-header">
                    <div class="d-flex justify-content-between align-items-center text-white">
                        <h6 class="mb-0 text-white">
                            <span class="badge ${badgeClass} badge-type me-2">
                                <i class="bi ${badgeIcon}"></i> Template Created
                            </span>
                            ${item.template_name}
                        </h6>
                        <small class="text-white">
                            <i class="bi bi-clock"></i> ${formatDate(item.created_at)}
                        </small>
                    </div>
                </div>
                <div class="card-body">
                    <h6 class="mb-2 text-white">Template Text:</h6>
                    <div class="prompt-text">${escapeHtml(item.prompt_text)}</div>
                </div>
            `;
            break;
            
        case 'error':
            badgeClass = 'bg-danger';
            badgeIcon = 'bi-exclamation-triangle';
            content = `
                <div class="card-header">
                    <div class="d-flex justify-content-between align-items-center text-white">
                        <h6 class="mb-0">
                            <span class="badge ${badgeClass} badge-type me-2">
                                <i class="bi ${badgeIcon}"></i> Error
                            </span>
                            Error Log
                        </h6>
                        <small class="text-white">
                            <i class="bi bi-clock"></i> ${formatDate(item.created_at)}
                        </small>
                    </div>
                </div>
                <div class="card-body">
                    <h6 class="mb-2">Error Message:</h6>
                    <div class="alert alert-danger mb-2">
                        <i class="bi bi-exclamation-circle"></i> ${escapeHtml(item.error_message)}
                    </div>
                    ${item.error_context ? `<p class="mb-0"><strong>Context:</strong> ${escapeHtml(item.error_context)}</p>` : ''}
                </div>
            `;
            break;
    }
    
    div.innerHTML = content;
    return div;
}

// Create variable data display
function createVariableDataDisplay(variableDataJson) {
    try {
        const data = typeof variableDataJson === 'string' ? JSON.parse(variableDataJson) : variableDataJson;
        
        if (Object.keys(data).length === 0) {
            return '';
        }
        
        let html = '<div class="mt-3"><h6 class="mb-2">Variables Used:</h6><ul class="list-group list-group-flush">';
        
        for (const [key, value] of Object.entries(data)) {
            html += `<li class="list-group-item"><strong>${key}:</strong> ${escapeHtml(value)}</li>`;
        }
        
        html += '</ul></div>';
        return html;
    } catch (error) {
        return '';
    }
}

// Update statistics
function updateStatistics() {
    const promptCount = allHistory.filter(item => item.type === 'prompt').length;
    const templateCount = allHistory.filter(item => item.type === 'template').length;
    const errorCount = allHistory.filter(item => item.type === 'error').length;
    
    document.getElementById('promptCount').textContent = promptCount;
    document.getElementById('templateCount').textContent = templateCount;
    document.getElementById('errorCount').textContent = errorCount;
}

// Copy prompt text to clipboard
function copyPromptText(text) {
    // Unescape HTML entities
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    const unescapedText = textarea.value;
    
    navigator.clipboard.writeText(unescapedText).then(() => {
        // Show toast notification
        const toast = document.createElement('div');
        toast.className = 'position-fixed bottom-0 end-0 p-3';
        toast.style.zIndex = '9999';
        toast.innerHTML = `
            <div class="toast show" role="alert">
                <div class="toast-header bg-success text-white">
                    <i class="bi bi-check-circle-fill me-2"></i>
                    <strong class="me-auto">Copied!</strong>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
                </div>
                <div class="toast-body">
                    Prompt copied to clipboard
                </div>
            </div>
        `;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }).catch(err => {
        alert('Failed to copy: ' + err.message);
    });
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString();
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, m => map[m]);
}
