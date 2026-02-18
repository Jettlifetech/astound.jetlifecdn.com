// Template Creator Page
const API_BASE = 'api/';

let extractedVariables = [];

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    loadExistingTemplates();
    
    // Event listeners
    document.getElementById('parseVariablesBtn').addEventListener('click', parseVariables);
    document.getElementById('saveTemplateBtn').addEventListener('click', saveTemplate);
    document.getElementById('cancelBtn').addEventListener('click', cancelConfiguration);
});

// Parse variables from prompt text
function parseVariables() {
    const templateName = document.getElementById('templateName').value.trim();
    const promptText = document.getElementById('promptText').value.trim();
    
    if (!templateName) {
        showAlert('Please enter a template name', 'warning');
        return;
    }
    
    if (!promptText) {
        showAlert('Please enter prompt text', 'warning');
        return;
    }
    
    // Extract variables using regex [variable-name]
    const regex = /\[([^\]]+)\]/g;
    const matches = [...promptText.matchAll(regex)];
    extractedVariables = [...new Set(matches.map(m => m[1]))]; // Remove duplicates
    
    if (extractedVariables.length === 0) {
        showAlert('No variables found in the prompt. Variables should be in [variable-name] format.', 'info');
        return;
    }
    
    // Show variable configuration section
    displayVariableConfiguration();
    document.getElementById('variableConfigSection').style.display = 'block';
    
    // Scroll to configuration section
    document.getElementById('variableConfigSection').scrollIntoView({ behavior: 'smooth' });
}

// Display variable configuration fields
function displayVariableConfiguration() {
    const container = document.getElementById('variableConfigContainer');
    container.innerHTML = '';
    
    extractedVariables.forEach((varName, index) => {
        const configItem = createVariableConfigItem(varName, index);
        container.appendChild(configItem);
    });
}

// Create configuration item for a variable
function createVariableConfigItem(varName, index) {
    const div = document.createElement('div');
    div.className = 'variable-config-item';
    div.innerHTML = `
        <div class="row align-items-center">
            <div class="col-md-4">
                <label class="form-label fw-bold">Variable Name</label>
                <input type="text" class="form-control bg-light" value="${varName}" readonly>
            </div>
            <div class="col-md-4">
                <label class="form-label fw-bold">Field Label</label>
                <input type="text" class="form-control variable-label" 
                       id="label_${index}" 
                       placeholder="e.g., Email Tone" 
                       value="${formatLabel(varName)}"
                       required>
            </div>
            <div class="col-md-4">
                <label class="form-label fw-bold">Input Type</label>
                <select class="form-select variable-type" id="type_${index}">
                    <option value="text">Text</option>
                    <option value="textarea">Text Area</option>
                    <option value="number">Number</option>
                    <option value="date">Date</option>
                    <option value="email">Email</option>
                    <option value="url">URL</option>
                </select>
            </div>
        </div>
    `;
    
    return div;
}

// Format variable name into a readable label
function formatLabel(varName) {
    return varName
        .replace(/-/g, ' ')
        .replace(/_/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

// Save template
async function saveTemplate() {
    const templateName = document.getElementById('templateName').value.trim();
    const promptText = document.getElementById('promptText').value.trim();
    
    if (!templateName || !promptText) {
        showAlert('Please fill in all required fields', 'warning');
        return;
    }
    
    // Collect variable configurations
    const variables = extractedVariables.map((varName, index) => {
        const label = document.getElementById(`label_${index}`).value.trim();
        const type = document.getElementById(`type_${index}`).value;
        
        if (!label) {
            throw new Error(`Please provide a label for variable: ${varName}`);
        }
        
        return {
            variable_name: varName,
            field_label: label,
            field_type: type
        };
    });
    
    try {
        // Save to database via API
        const response = await fetch(API_BASE + 'templates.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                template_name: templateName,
                prompt_text: promptText,
                variables: variables
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showAlert('Template created successfully!', 'success');
            
            // Reset form
            document.getElementById('templateForm').reset();
            document.getElementById('variableConfigSection').style.display = 'none';
            extractedVariables = [];
            
            // Reload templates list
            loadExistingTemplates();
        } else {
            throw new Error(result.error || 'Failed to save template');
        }
    } catch (error) {
        showAlert('Error saving template: ' + error.message, 'danger');
    }
}

// Cancel configuration
function cancelConfiguration() {
    if (confirm('Are you sure you want to cancel? All configuration will be lost.')) {
        document.getElementById('variableConfigSection').style.display = 'none';
        extractedVariables = [];
    }
}

// Load existing templates
async function loadExistingTemplates() {
    try {
        const response = await fetch(API_BASE + 'templates.php');
        const templates = await response.json();
        
        const listContainer = document.getElementById('templatesList');
        listContainer.innerHTML = '';
        
        if (templates.length === 0) {
            listContainer.innerHTML = '<p class="text-white text-center py-3">No templates created yet.</p>';
            return;
        }
        
        templates.forEach(template => {
            const item = document.createElement('div');
            item.className = 'list-group-item list-group-item-action';
            item.innerHTML = `
                <div class="d-flex w-100 justify-content-between align-items-center">
                    <div>
                        <h6 class="mb-1">${template.template_name}</h6>
                        <small class="text-white">
                            <i class="bi bi-calendar"></i> ${formatDate(template.created_at)}
                        </small>
                    </div>
                    <button class="btn btn-sm btn-danger" onclick="deleteTemplate(${template.id}, '${template.template_name}')">
                        <i class="bi bi-trash"></i> Delete
                    </button>
                </div>
            `;
            listContainer.appendChild(item);
        });
    } catch (error) {
        console.error('Error loading templates:', error);
    }
}

// Delete template
async function deleteTemplate(id, name) {
    if (!confirm(`Are you sure you want to delete the template "${name}"?`)) {
        return;
    }
    
    try {
        const response = await fetch(API_BASE + 'templates.php', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: `id=${id}`
        });
        
        const result = await response.json();
        
        if (result.success) {
            showAlert('Template deleted successfully', 'success');
            loadExistingTemplates();
        } else {
            throw new Error(result.error || 'Failed to delete template');
        }
    } catch (error) {
        showAlert('Error deleting template: ' + error.message, 'danger');
    }
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

// Show alert message
function showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.role = 'alert';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    const container = document.getElementById('alertContainer');
    container.innerHTML = '';
    container.appendChild(alertDiv);
    
    // Scroll to alert
    alertDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}
