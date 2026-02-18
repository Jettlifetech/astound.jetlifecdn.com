// Home Page - Prompt Generator
const API_BASE = 'api/';

let currentTemplate = null;

// Load templates on page load
document.addEventListener('DOMContentLoaded', function() {
    loadTemplates();
    
    // Event listeners
    document.getElementById('templateSelect').addEventListener('change', handleTemplateChange);
    document.getElementById('promptForm').addEventListener('submit', handleFormSubmit);
    document.getElementById('resetBtn').addEventListener('click', resetForm);
    document.getElementById('copyBtn').addEventListener('click', copyToClipboard);
});

// Load all templates into dropdown
async function loadTemplates() {
    try {
        const response = await fetch(API_BASE + 'templates.php');
        const templates = await response.json();
        
        const select = document.getElementById('templateSelect');
        select.innerHTML = '<option value="">Select a template...</option>';
        
        templates.forEach(template => {
            const option = document.createElement('option');
            option.value = template.id;
            option.textContent = template.template_name;
            select.appendChild(option);
        });
    } catch (error) {
        showAlert('Error loading templates: ' + error.message, 'danger');
    }
}

// Handle template selection change
async function handleTemplateChange(e) {
    const templateId = e.target.value;
    const variableFieldsContainer = document.getElementById('variableFields');
    const outputSection = document.getElementById('outputSection');
    
    // Clear previous fields and output
    variableFieldsContainer.innerHTML = '';
    outputSection.style.display = 'none';
    
    if (!templateId) {
        currentTemplate = null;
        return;
    }
    
    try {
        // Fetch template details including variables
        const response = await fetch(API_BASE + `templates.php?id=${templateId}`);
        currentTemplate = await response.json();
        
        if (!currentTemplate) {
            showAlert('Template not found', 'danger');
            return;
        }
        
        // Display variable input fields
        if (currentTemplate.variables && currentTemplate.variables.length > 0) {
            currentTemplate.variables.forEach(variable => {
                const fieldDiv = createVariableField(variable);
                variableFieldsContainer.appendChild(fieldDiv);
            });
        } else {
            variableFieldsContainer.innerHTML = '<p class="text-white"><i class="bi bi-info-circle"></i> This template has no variables.</p>';
        }
    } catch (error) {
        showAlert('Error loading template: ' + error.message, 'danger');
    }
}

// Create input field for a variable
function createVariableField(variable) {
    const div = document.createElement('div');
    div.className = 'mb-3';
    
    const label = document.createElement('label');
    label.className = 'form-label fw-bold';
    label.textContent = variable.field_label;
    
    let input;
    switch(variable.field_type) {
        case 'textarea':
            input = document.createElement('textarea');
            input.className = 'form-control';
            input.rows = 3;
            break;
        case 'number':
            input = document.createElement('input');
            input.type = 'number';
            input.className = 'form-control';
            break;
        case 'date':
            input = document.createElement('input');
            input.type = 'date';
            input.className = 'form-control';
            break;
        case 'email':
            input = document.createElement('input');
            input.type = 'email';
            input.className = 'form-control';
            break;
        case 'url':
            input = document.createElement('input');
            input.type = 'url';
            input.className = 'form-control';
            break;
        default:
            input = document.createElement('input');
            input.type = 'text';
            input.className = 'form-control';
    }
    
    input.id = `var_${variable.variable_name}`;
    input.name = variable.variable_name;
    input.required = true;
    input.placeholder = `Enter ${variable.field_label.toLowerCase()}...`;
    
    div.appendChild(label);
    div.appendChild(input);
    
    return div;
}

// Handle form submission
async function handleFormSubmit(e) {
    e.preventDefault();
    
    if (!currentTemplate) {
        showAlert('Please select a template', 'warning');
        return;
    }
    
    try {
        // Collect variable values
        const variableData = {};
        if (currentTemplate.variables) {
            currentTemplate.variables.forEach(variable => {
                const input = document.getElementById(`var_${variable.variable_name}`);
                if (input) {
                    variableData[variable.variable_name] = input.value;
                }
            });
        }
        
        // Generate the prompt by replacing variables
        let generatedPrompt = currentTemplate.prompt_text;
        Object.keys(variableData).forEach(varName => {
            const regex = new RegExp(`\\[${varName}\\]`, 'g');
            generatedPrompt = generatedPrompt.replace(regex, variableData[varName]);
        });
        
        // Display the generated prompt
        document.getElementById('generatedPromptOutput').textContent = generatedPrompt;
        document.getElementById('outputSection').style.display = 'block';
        
        // Scroll to output
        document.getElementById('outputSection').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        
        // Save to history
        await saveToHistory(currentTemplate.id, currentTemplate.template_name, generatedPrompt, variableData);
        
        showAlert('Prompt generated successfully!', 'success');
    } catch (error) {
        showAlert('Error generating prompt: ' + error.message, 'danger');
    }
}

// Save generated prompt to history
async function saveToHistory(templateId, templateName, generatedPrompt, variableData) {
    try {
        await fetch(API_BASE + 'history.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                template_id: templateId,
                template_name: templateName,
                generated_prompt: generatedPrompt,
                variable_data: variableData
            })
        });
    } catch (error) {
        console.error('Error saving to history:', error);
    }
}

// Reset form
function resetForm() {
    document.getElementById('promptForm').reset();
    document.getElementById('variableFields').innerHTML = '';
    document.getElementById('outputSection').style.display = 'none';
    currentTemplate = null;
}

// Copy to clipboard
function copyToClipboard() {
    const promptText = document.getElementById('generatedPromptOutput').textContent;
    
    navigator.clipboard.writeText(promptText).then(() => {
        const btn = document.getElementById('copyBtn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="bi bi-check2"></i> Copied!';
        btn.classList.remove('btn-outline-primary');
        btn.classList.add('btn-success');
        
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.classList.remove('btn-success');
            btn.classList.add('btn-outline-primary');
        }, 2000);
    }).catch(err => {
        showAlert('Failed to copy: ' + err.message, 'danger');
    });
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
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}
