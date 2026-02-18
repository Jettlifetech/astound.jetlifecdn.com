/* Prompt DB Cosmic SPA
   - Hash router (#/generate, #/templates, #/history)
   - AJAX via fetch
   - Inline editing modal for templates (create + edit)
   - Falling stars in navbar & ripple interactions
*/

const API_BASE = (window.APP_CONFIG && window.APP_CONFIG.API_BASE) || 'api/';

// --- Simple state store ---
const Store = {
  state: {
    templates: [],
    selectedTemplate: null,
    history: [],
    searchQuery: ''
  },
  listeners: new Set(),
  set(partial) { Object.assign(this.state, partial); this.emit(); },
  emit() { this.listeners.forEach(l => l(this.state)); },
  subscribe(listener) { this.listeners.add(listener); return () => this.listeners.delete(listener); }
};

// --- Utilities ---
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const h = (tag, attrs = {}, ...children) => {
  const el = document.createElement(tag);
  Object.entries(attrs || {}).forEach(([k, v]) => {
    if (k === 'class') el.className = v;
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.substring(2), v);
    else if (k === 'html') el.innerHTML = v;
    else if (v !== undefined && v !== null) el.setAttribute(k, v);
  });
  children.flat().forEach(c => { if (c != null) el.append(typeof c === 'string' ? document.createTextNode(c) : c); });
  return el;
};

function toast(message, type = 'info') {
  const container = $('#toastContainer');
  const wrapper = h('div', { class: 'toast align-items-center text-bg-' + (type === 'info' ? 'secondary' : type), role: 'status', 'aria-live': 'polite', 'aria-atomic': 'true' });
  wrapper.innerHTML = `<div class="d-flex">
    <div class="toast-body">${message}</div>
    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
  </div>`;
  container.appendChild(wrapper);
  const t = new bootstrap.Toast(wrapper, { delay: 2800 });
  t.show();
  wrapper.addEventListener('hidden.bs.toast', () => wrapper.remove());
}

function confirmDialog({ title = 'Confirm', body = 'Are you sure?', okText = 'OK', okClass = 'btn-danger' }) {
  return new Promise(resolve => {
    $('#confirmTitle').textContent = title;
    $('#confirmBody').textContent = body;
    const okBtn = $('#confirmOkBtn');
    okBtn.textContent = okText;
    okBtn.className = 'btn ' + okClass;
    const modal = new bootstrap.Modal($('#confirmModal'));
    const handler = () => { cleanup(); resolve(true); };
    const cleanup = () => {
      okBtn.removeEventListener('click', handler);
      $('#confirmModal').removeEventListener('hidden.bs.modal', cancelHandler);
    };
    const cancelHandler = () => { cleanup(); resolve(false); };
    okBtn.addEventListener('click', handler, { once: true });
    $('#confirmModal').addEventListener('hidden.bs.modal', cancelHandler, { once: true });
    modal.show();
  });
}

// --- API helpers (AJAX) ---
const api = {
  async get(path) {
    const res = await fetch(API_BASE + path, { headers: { 'Accept': 'application/json' } });
    if (res.status === 401) {
      console.info('Session expired or not authenticated for:', path);
      return null;
    }
    if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
    return res.json();
  },
  async post(path, data) {
    const res = await fetch(API_BASE + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(`POST ${path} failed: ${res.status}`);
    try { return await res.json(); } catch { return { success: true }; }
  },
  async del(path, formEncodedBody) {
    const res = await fetch(API_BASE + path, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
      body: formEncodedBody
    });
    if (!res.ok) throw new Error(`DELETE ${path} failed: ${res.status}`);
    return res.json();
  },
  // Update with robust fallbacks (PUT, POST override, action=update)
  async updateTemplate(payload) {
    // Preferred: PUT with JSON body
    try {
      const res = await fetch(API_BASE + 'templates.php', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) return await res.json();
    } catch (e) { }

    // Fallback: PUT to /templates.php?id=ID
    try {
      const res = await fetch(API_BASE + `templates.php?id=${encodeURIComponent(payload.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) return await res.json();
    } catch (e) { }

    // Legacy fallback: POST with override
    const res = await fetch(API_BASE + 'templates.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-HTTP-Method-Override': 'PUT' },
      body: JSON.stringify({ ...payload, action: 'update', _method: 'PUT' })
    });
    if (!res.ok) throw new Error(`Update failed: ${res.status}`);
    return res.json();
  }
};

// --- Router ---
const Routes = {
  '/generate': renderGenerate,
  '/templates': renderTemplates,
  '/history': renderHistory,
  '/settings': renderSettings,
  '/users': renderUsers
};

function setActiveNav() {
  const hash = location.hash || '#/generate';
  $$('.app-sidebar .nav-link').forEach(a => a.classList.toggle('active', a.getAttribute('href') === hash));
}
async function router() {
  setActiveNav();
  const route = (location.hash || '#/generate').replace(/^#/, '');
  const view = Routes[route] || renderGenerate;
  await view();
}
window.addEventListener('hashchange', router);

// --- Global search & refresh ---
$('#globalSearch').addEventListener('input', e => {
  Store.set({ searchQuery: e.target.value.toLowerCase() });
});
$('#refreshBtn').addEventListener('click', async () => {
  try {
    await Promise.all([loadTemplates(true), loadHistory(true)]);
    toast('Data refreshed among the stars ✨', 'success');
  } catch (e) {
    toast('Refresh failed: ' + e.message, 'danger');
  }
});

// --- Data loading ---
async function loadTemplates(force = false) {
  if (!force && Store.state.templates.length) return;
  const templates = await api.get('templates.php');
  if (templates !== null && Array.isArray(templates)) {
    Store.set({ templates });
  }
}
async function loadTemplateDetail(id) {
  const tpl = await api.get(`templates.php?id=${id}`);
  if (!tpl) throw new Error('Failed to load template details (not authenticated)');
  return tpl;
}
async function loadHistory(force = false) {
  if (!force && Store.state.history.length) return;
  const history = await api.get('history.php');
  if (history !== null && Array.isArray(history)) {
    Store.set({ history });
  }
}

// --- Views ---

// Generate view
async function renderGenerate() {
  await loadTemplates();
  const root = $('#view-root');
  root.innerHTML = '';

  const state = Store.state;

  const header = h('div', { class: 'd-flex align-items-center justify-content-between mb-3' },
    h('h2', { class: 'mb-0 text-gradient' }, 'Generate'),
    h('div', {},
      h('a', { href: '#/templates', class: 'btn btn-outline-light cosmic-btn', 'data-ripple': '' },
        h('i', { class: 'bi bi-plus-circle me-1' }), 'New Template'
      )
    )
  );

  const card = h('div', { class: 'card card-surface' });
  const body = h('div', { class: 'card-body' });

  const selectGroup = h('div', { class: 'mb-3' },
    h('label', { for: 'genTemplate', class: 'form-label fw-bold' }, 'Prompt Template'),
    h('select', { class: 'form-select cosmic-input', id: 'genTemplate' },
      h('option', { value: '' }, 'Select a template…'),
      state.templates
        .filter(t => t.template_name?.toLowerCase().includes(Store.state.searchQuery))
        .map(t => h('option', { value: t.id }, t.template_name))
    )
  );

  const variablesContainer = h('div', { id: 'genVars', class: 'row g-3' });
  const actionsRow = h('div', { class: 'd-flex gap-2' });
  const genBtn = h('button', { class: 'btn btn-primary cosmic-btn', id: 'genBtn', 'data-ripple': '' }, h('i', { class: 'bi bi-magic me-1' }), 'Generate');
  const resetBtn = h('button', { class: 'btn btn-outline-light cosmic-btn', 'data-ripple': '' }, h('i', { class: 'bi bi-arrow-counterclockwise me-1' }), 'Reset');

  actionsRow.append(genBtn, resetBtn);

  body.append(selectGroup, variablesContainer, actionsRow);
  card.append(body);

  const outCard = h('div', { class: 'card card-surface mt-3', id: 'outputCard', style: 'display:none;' });
  const outBody = h('div', { class: 'card-body' },
    h('div', { class: 'd-flex justify-content-between align-items-center mb-2 flex-wrap gap-2' },
      h('h5', { class: 'mb-0 text-white' }, 'Generated Prompt'),
      h('div', { class: 'd-flex gap-2 align-items-center flex-wrap' },
        h('button', { class: 'btn btn-outline-light btn-sm cosmic-btn', id: 'copyBtn', 'data-ripple': '' }, h('i', { class: 'bi bi-clipboard me-1' }), 'Copy'),
        h('select', { class: 'form-select form-select-sm cosmic-input', id: 'aiProviderSelect', style: 'width:auto;min-width:130px;' },
          h('option', { value: 'claude' }, 'Claude'),
          h('option', { value: 'openai' }, 'OpenAI'),
          h('option', { value: 'gemini' }, 'Gemini')
        ),
        h('button', { class: 'btn btn-success btn-sm cosmic-btn', id: 'sendToAiBtn', 'data-ripple': '' },
          h('i', { class: 'bi bi-send me-1' }), 'Send to AI Tool'
        )
      )
    ),
    h('pre', { class: 'pretty mb-0', id: 'generatedOut', role: 'region', 'aria-live': 'polite' })
  );
  outCard.append(outBody);

  // AI Response card
  const aiCard = h('div', { class: 'card card-surface mt-3', id: 'aiResponseCard', style: 'display:none;' });
  const aiBody = h('div', { class: 'card-body' },
    h('div', { class: 'd-flex justify-content-between align-items-center mb-2' },
      h('h5', { class: 'mb-0 text-white' }, h('i', { class: 'bi bi-robot me-2' }), 'AI Response'),
      h('div', { class: 'd-flex gap-2' },
        h('button', { class: 'btn btn-outline-danger btn-sm cosmic-btn', id: 'stopAiBtn', style: 'display:none;', 'data-ripple': '' },
          h('i', { class: 'bi bi-stop-circle me-1' }), 'Stop'
        ),
        h('button', { class: 'btn btn-outline-light btn-sm cosmic-btn', id: 'copyAiBtn', 'data-ripple': '' },
          h('i', { class: 'bi bi-clipboard me-1' }), 'Copy'
        )
      )
    ),
    h('div', { id: 'aiResponseContent', class: 'ai-response-content' })
  );
  aiCard.append(aiBody);

  root.append(header, card, outCard, aiCard);

  // behaviors
  $('#genTemplate').addEventListener('change', async (e) => {
    variablesContainer.innerHTML = '';
    const id = e.target.value;
    if (!id) { Store.set({ selectedTemplate: null }); return; }
    try {
      const detail = await loadTemplateDetail(id);
      Store.set({ selectedTemplate: detail });
      renderVars(detail);
    } catch (err) { toast('Failed to load template: ' + err.message, 'danger'); }
  });

  function inputFor(variable) {
    const col = h('div', { class: 'col-12 col-md-6' });
    const group = h('div', { class: 'mb-2' });
    const label = h('label', { class: 'form-label fw-semibold' }, variable.field_label);
    let input;
    switch (variable.field_type) {
      case 'textarea': input = h('textarea', { class: 'form-control cosmic-input', rows: '3' }); break;
      case 'number': input = h('input', { type: 'number', class: 'form-control cosmic-input' }); break;
      case 'date': input = h('input', { type: 'date', class: 'form-control cosmic-input' }); break;
      case 'email': input = h('input', { type: 'email', class: 'form-control cosmic-input' }); break;
      case 'url': input = h('input', { type: 'url', class: 'form-control cosmic-input' }); break;
      default: input = h('input', { type: 'text', class: 'form-control cosmic-input' });
    }
    input.id = `var_${variable.variable_name}`;
    input.placeholder = `Enter ${variable.field_label.toLowerCase()}…`;
    input.required = true;
    group.append(label, input);
    col.append(group);
    return col;
  }
  function renderVars(detail) {
    variablesContainer.innerHTML = '';
    if (!detail.variables || !detail.variables.length) {
      variablesContainer.append(h('div', { class: 'col-12 text-secondary' }, h('i', { class: 'bi bi-info-circle me-1' }), 'This template has no variables.'));
      return;
    }
    detail.variables.forEach(v => variablesContainer.append(inputFor(v)));
  }

  let aiAbortController = null;

  resetBtn.addEventListener('click', () => {
    $('#genTemplate').value = '';
    variablesContainer.innerHTML = '';
    $('#outputCard').style.display = 'none';
    $('#aiResponseCard').style.display = 'none';
    if (aiAbortController) { aiAbortController.abort(); aiAbortController = null; }
    Store.set({ selectedTemplate: null });
  });

  genBtn.addEventListener('click', async () => {
    const t = Store.state.selectedTemplate;
    if (!t) { toast('Please choose a template.', 'warning'); return; }
    const variableData = {};
    (t.variables || []).forEach(v => {
      const input = $(`#var_${CSS.escape(v.variable_name)}`);
      variableData[v.variable_name] = (input?.value ?? '');
    });
    let prompt = t.prompt_text;
    Object.keys(variableData).forEach(name => {
      const re = new RegExp(`\\[${escapeRegExp(name)}\\]`, 'g');
      prompt = prompt.replace(re, variableData[name]);
    });
    $('#generatedOut').textContent = prompt;
    $('#outputCard').style.display = '';
    try {
      await api.post('history.php', {
        template_id: t.id, template_name: t.template_name,
        generated_prompt: prompt, variable_data: variableData
      });
      const now = new Date().toISOString();
      const optimistic = { type: 'prompt', template_id: t.id, template_name: t.template_name, generated_prompt: prompt, variable_data: variableData, created_at: now };
      Store.set({ history: [optimistic, ...Store.state.history] });
    } catch (e) { console.warn('Failed to save to history:', e); }
    toast('Prompt generated!', 'success');
  });

  $('#copyBtn').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText($('#generatedOut').textContent); toast('Copied to clipboard', 'success'); }
    catch (e) { toast('Copy failed: ' + e.message, 'danger'); }
  });

  // --- Send to AI Tool ---
  $('#sendToAiBtn').addEventListener('click', async () => {
    const prompt = $('#generatedOut').textContent;
    if (!prompt) { toast('Generate a prompt first.', 'warning'); return; }

    const provider = $('#aiProviderSelect').value;
    const keyMap = { claude: 'prompt-db-claude-key', openai: 'prompt-db-openai-key', gemini: 'prompt-db-gemini-key' };
    const apiKey = localStorage.getItem(keyMap[provider]);
    if (!apiKey) {
      toast(`No API key for ${provider}. Configure it in Settings > API Keys.`, 'warning');
      return;
    }

    const aiCardEl = $('#aiResponseCard');
    const contentEl = $('#aiResponseContent');
    const sendBtn = $('#sendToAiBtn');
    const stopBtn = $('#stopAiBtn');

    // Show card with typing indicator
    aiCardEl.style.display = '';
    contentEl.innerHTML = '';
    contentEl.append(h('div', { class: 'ai-typing-indicator' }, h('span', {}), h('span', {}), h('span', {})));

    // UI state: sending
    stopBtn.style.display = '';
    sendBtn.disabled = true;
    sendBtn.innerHTML = '';
    sendBtn.append(h('span', { class: 'spinner-border spinner-border-sm me-1', role: 'status' }), 'Sending...');

    // Auto-scroll
    aiCardEl.scrollIntoView({ behavior: 'smooth', block: 'start' });

    aiAbortController = new AbortController();

    try {
      const res = await fetch(API_BASE + 'ai-chat.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, provider, api_key: apiKey }),
        signal: aiAbortController.signal
      });

      if (!res.ok && !res.headers.get('content-type')?.includes('text/event-stream')) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(err.error || `Request failed: ${res.status}`);
      }

      // Clear typing indicator, create output element
      contentEl.innerHTML = '';
      const textEl = h('pre', { class: 'pretty mb-0 ai-response-text' });
      contentEl.append(textEl);

      // Stream response
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); // keep incomplete line in buffer

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const data = trimmed.slice(6);
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.error) throw new Error(parsed.error);
              if (parsed.text) {
                fullText += parsed.text;
                textEl.textContent = fullText;
                textEl.scrollTop = textEl.scrollHeight;
              }
            } catch (e) {
              if (e.message && !e.message.includes('Unexpected') && !e.message.includes('JSON')) throw e;
            }
          }
        }
      }

      if (fullText) toast('AI response received', 'success');
      else toast('AI returned an empty response', 'info');
    } catch (e) {
      if (e.name === 'AbortError') {
        toast('AI request stopped', 'info');
      } else {
        contentEl.innerHTML = '';
        contentEl.append(h('div', { class: 'alert alert-danger mb-0' },
          h('i', { class: 'bi bi-exclamation-triangle me-2' }), 'Error: ' + e.message
        ));
        toast('AI request failed: ' + e.message, 'danger');
      }
    } finally {
      aiAbortController = null;
      stopBtn.style.display = 'none';
      sendBtn.disabled = false;
      sendBtn.innerHTML = '';
      sendBtn.append(h('i', { class: 'bi bi-send me-1' }), 'Send to AI Tool');
    }
  });

  // Stop AI streaming
  $('#stopAiBtn').addEventListener('click', () => {
    if (aiAbortController) aiAbortController.abort();
  });

  // Copy AI response
  $('#copyAiBtn').addEventListener('click', async () => {
    const text = $('.ai-response-text')?.textContent;
    if (!text) { toast('No AI response to copy', 'warning'); return; }
    try { await navigator.clipboard.writeText(text); toast('AI response copied', 'success'); }
    catch (e) { toast('Copy failed: ' + e.message, 'danger'); }
  });
}

// Templates view
async function renderTemplates() {
  await loadTemplates(true);
  const root = $('#view-root');
  root.innerHTML = '';

  const header = h('div', { class: 'd-flex align-items-center justify-content-between mb-3' },
    h('h2', { class: 'mb-0 text-gradient' }, 'Templates'),
    h('a', { href: '#/generate', class: 'btn btn-outline-light cosmic-btn', 'data-ripple': '' }, h('i', { class: 'bi bi-magic me-1' }), 'Go to Generate')
  );

  // Creator card
  const card = h('div', { class: 'card card-surface' });
  const body = h('div', { class: 'card-body' });

  const form = h('form', { id: 'tplForm' });
  const nameGroup = h('div', { class: 'mb-3' },
    h('label', { for: 'tplName', class: 'form-label fw-bold' }, 'Template Name'),
    h('input', { class: 'form-control cosmic-input', id: 'tplName', required: true, placeholder: 'e.g. Email Writer, Story Idea Generator' })
  );
  const textGroup = h('div', { class: 'mb-3' },
    h('label', { for: 'tplText', class: 'form-label fw-bold' }, 'Prompt Text'),
    h('textarea', { id: 'tplText', class: 'form-control cosmic-input', rows: '8', required: true, placeholder: 'Write your prompt using [variable-names]…' }),
    h('div', { class: 'form-text' }, h('i', { class: 'bi bi-info-circle me-1 text-white' }), 'Use [variable-name] format for variables.')
  );
  const parseBtn = h('button', { type: 'button', class: 'btn btn-info cosmic-btn', id: 'parseBtn', 'data-ripple': '' }, h('i', { class: 'bi bi-search me-1' }), 'Parse variables');

  const configSection = h('div', { id: 'varConfig', style: 'display:none;' },
    h('hr'),
    h('h5', {}, 'Configure Variables'),
    h('p', { class: 'text-secondary' }, 'Define labels and input types for each detected variable.'),
    h('div', { id: 'varConfigContainer' }),
    h('div', { class: 'd-flex gap-2 mt-3 justify-content-end' },
      h('button', { type: 'button', class: 'btn btn-secondary cosmic-btn', id: 'cancelCfg', 'data-ripple': '' }, h('i', { class: 'bi bi-x-circle me-1' }), 'Cancel'),
      h('button', { type: 'button', class: 'btn btn-success cosmic-btn', id: 'saveTpl', 'data-ripple': '' }, h('i', { class: 'bi bi-save me-1' }), 'Save Template')
    )
  );

  form.append(nameGroup, textGroup, parseBtn, configSection);
  body.append(form);
  card.append(body);

  // Existing templates
  const listCard = h('div', { class: 'card card-surface mt-3' });
  const listBody = h('div', { class: 'card-body' });
  const listHeader = h('div', { class: 'd-flex justify-content-between align-items-center mb-2' },
    h('h5', { class: 'mb-0' }, 'Existing Templates'),
    h('div', {},
      h('span', { class: 'badge text-bg-secondary', id: 'tplCountBadge' }, Store.state.templates.length + ' total')
    )
  );
  const list = h('div', { id: 'tplList', class: 'list-group' });
  listBody.append(listHeader, list);
  listCard.append(listBody);

  root.append(header, card, listCard);

  // Load list
  renderTemplateList();

  // Behaviors
  let extractedVariables = [];

  $('#parseBtn').addEventListener('click', () => {
    const name = $('#tplName').value.trim();
    const text = $('#tplText').value.trim();
    if (!name) return toast('Please enter a template name', 'warning');
    if (!text) return toast('Please enter prompt text', 'warning');

    const regex = /\[([^\]]+)\]/g;
    extractedVariables = Array.from(text.matchAll(regex)).map(m => m[1]);
    extractedVariables = [...new Set(extractedVariables)];
    if (!extractedVariables.length) {
      $('#varConfig').style.display = 'none';
      return toast('No variables found. Use [variable-name] format.', 'info');
    }
    const cfg = $('#varConfigContainer');
    cfg.innerHTML = '';
    extractedVariables.forEach((varName, i) => cfg.append(variableConfigItem(varName, i)));
    $('#varConfig').style.display = '';
    $('#varConfig').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });

  $('#cancelCfg').addEventListener('click', async () => {
    const ok = await confirmDialog({ title: 'Cancel configuration?', body: 'All variable configuration will be lost.' });
    if (ok) { $('#varConfig').style.display = 'none'; extractedVariables = []; }
  });

  $('#saveTpl').addEventListener('click', async () => {
    const name = $('#tplName').value.trim();
    const text = $('#tplText').value.trim();
    if (!name || !text) return toast('Please fill in all required fields', 'warning');
    try {
      const variables = extractedVariables.map((varName, i) => {
        const label = $(`#label_${i}`).value.trim();
        const type = $(`#type_${i}`).value;
        if (!label) throw new Error(`Please provide a label for "${varName}"`);
        return { variable_name: varName, field_label: label, field_type: type };
      });

      const result = await api.post('templates.php', { template_name: name, prompt_text: text, variables });
      if (result && result.success === false) throw new Error(result.error || 'Failed to save template');

      toast('Template created!', 'success');
      $('#tplForm').reset(); $('#varConfig').style.display = 'none'; extractedVariables = [];
      await loadTemplates(true);
      renderTemplateList();
    } catch (e) { toast('Error saving template: ' + e.message, 'danger'); }
  });

  function variableConfigItem(varName, index) {
    const pretty = formatLabel(varName);
    const row = h('div', { class: 'variable-row mb-2' },
      h('div', { class: 'row g-3 align-items-center' },
        h('div', { class: 'col-md-4' },
          h('label', { class: 'form-label fw-bold' }, 'Variable Name'),
          h('input', { class: 'form-control cosmic-input', value: varName, readonly: true })
        ),
        h('div', { class: 'col-md-4' },
          h('label', { class: 'form-label fw-bold' }, 'Field Label'),
          h('input', { class: 'form-control cosmic-input', id: `label_${index}`, value: pretty, required: true, placeholder: 'e.g., Email Tone' })
        ),
        h('div', { class: 'col-md-4' },
          h('label', { class: 'form-label fw-bold' }, 'Input Type'),
          (() => {
            const select = h('select', { class: 'form-select cosmic-input', id: `type_${index}` });
            ['text', 'textarea', 'number', 'date', 'email', 'url'].forEach(t => select.append(h('option', { value: t }, t)));
            return select;
          })()
        )
      )
    );
    return row;
  }

  function renderTemplateList() {
    const q = Store.state.searchQuery;
    const items = Store.state.templates
      .filter(t => !q || (t.template_name?.toLowerCase().includes(q)));
    list.innerHTML = '';
    if (!items.length) {
      list.innerHTML = `<div class="text-center text-muted py-4">No templates found.</div>`;
      return;
    }
    items.forEach(t => {
      const item = h('div', { class: 'list-group-item d-flex w-100 justify-content-between align-items-center glass mb-2' },
        h('div', {},
          h('div', { class: 'fw-semibold' }, t.template_name),
          h('small', { class: 'text-muted' }, (t.created_at ? new Date(t.created_at).toLocaleString() : ''))
        ),
        h('div', { class: 'd-flex gap-2' },
          h('button', { class: 'btn btn-sm btn-outline-light cosmic-btn', title: 'Edit', 'data-ripple': '', onclick: () => openEditTemplateModal(t.id) }, h('i', { class: 'bi bi-pencil' })),
          h('a', {
            href: `#/generate`, class: 'btn btn-sm btn-outline-info cosmic-btn', title: 'Use in Generate', 'data-ripple': '', onclick: (e) => {
              setTimeout(async () => {
                const sel = $('#genTemplate');
                if (sel) { sel.value = t.id; sel.dispatchEvent(new Event('change')); }
              }, 0);
            }
          }, h('i', { class: 'bi bi-play' })),
          h('button', {
            class: 'btn btn-sm btn-outline-danger cosmic-btn', title: 'Delete', 'data-ripple': '', onclick: async () => {
              const ok = await confirmDialog({ title: 'Delete template?', body: `Delete "${t.template_name}"? This cannot be undone.`, okText: 'Delete' });
              if (!ok) return;
              try {
                const result = await api.del('templates.php', `id=${encodeURIComponent(t.id)}`);
                if (result && result.success === false) throw new Error(result.error || 'Failed to delete');
                toast('Template deleted', 'success');
                await loadTemplates(true);
                renderTemplateList();
              } catch (e) { toast('Delete failed: ' + e.message, 'danger'); }
            }
          }, h('i', { class: 'bi bi-trash' }))
        )
      );
      list.append(item);
    });
  }

  // Re-render list on search update
  const unsub = Store.subscribe(() => renderTemplateList());
  const onHash = () => { window.removeEventListener('hashchange', onHash); unsub(); };
  window.addEventListener('hashchange', onHash);
}

// History view
async function renderHistory() {
  await loadHistory();
  const root = $('#view-root');
  root.innerHTML = '';

  const header = h('div', { class: 'd-flex align-items-center justify-content-between mb-3' },
    h('h2', { class: 'mb-0 text-gradient' }, 'History'),
    h('div', { class: 'btn-group', role: 'group', 'aria-label': 'Filter' },
      h('button', { class: 'btn btn-outline-light active cosmic-btn', 'data-ripple': '', 'data-filter': 'all' }, 'All'),
      h('button', { class: 'btn btn-outline-light cosmic-btn', 'data-ripple': '', 'data-filter': 'prompts' }, 'Prompts'),
      h('button', { class: 'btn btn-outline-light cosmic-btn', 'data-ripple': '', 'data-filter': 'templates' }, 'Templates'),
      h('button', { class: 'btn btn-outline-light cosmic-btn', 'data-ripple': '', 'data-filter': 'errors' }, 'Errors')
    )
  );

  const stats = (() => {
    const card = h('div', { class: 'row g-3 mb-3' },
      statCard('primary', 'Prompts Generated', 'statPrompts'),
      statCard('success', 'Templates Created', 'statTemplates'),
      statCard('danger', 'Errors Logged', 'statErrors')
    );
    return card;
  })();

  const listCard = h('div', { class: 'card card-surface' });
  const listBody = h('div', { class: 'card-body' });
  const list = h('div', { id: 'histList' });
  listBody.append(list);
  listCard.append(listBody);

  root.append(header, stats, listCard);

  // Actions
  let filter = 'all';
  header.querySelectorAll('[data-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      header.querySelectorAll('[data-filter]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      filter = btn.getAttribute('data-filter');
      renderList();
    });
  });

  function statCard(color, label, id) {
    return h('div', { class: 'col-12 col-md-4' },
      h('div', { class: 'card text-center glass' },
        h('div', { class: 'card-body' },
          h('h2', { class: `text-${color}`, id }, '0'),
          h('div', { class: 'text-muted' }, label)
        )
      )
    );
  }

  function renderList() {
    const q = Store.state.searchQuery;
    let items = Store.state.history;
    if (filter !== 'all') {
      items = items.filter(i => {
        if (filter === 'prompts') return i.type === 'prompt';
        if (filter === 'templates') return i.type === 'template';
        if (filter === 'errors') return i.type === 'error';
        return true;
      });
    }
    if (q) {
      const inText = (s) => (s || '').toString().toLowerCase().includes(q);
      items = items.filter(i =>
        inText(i.template_name) ||
        inText(i.generated_prompt) ||
        inText(i.error_message) ||
        inText(i.prompt_text)
      );
    }
    $('#statPrompts').textContent = Store.state.history.filter(i => i.type === 'prompt').length;
    $('#statTemplates').textContent = Store.state.history.filter(i => i.type === 'template').length;
    $('#statErrors').textContent = Store.state.history.filter(i => i.type === 'error').length;

    list.innerHTML = '';
    if (!items.length) {
      list.innerHTML = `<div class="text-center text-muted py-4"><i class="bi bi-inbox" style="font-size:2rem"></i><div class="mt-2">No history items.</div></div>`;
      return;
    }
    items.forEach(i => list.append(historyCard(i)));
  }

  function historyCard(item) {
    const typeMap = {
      prompt: { badge: 'primary', icon: 'bi-file-text', label: 'Prompt Generated' },
      template: { badge: 'success', icon: 'bi-file-earmark-plus', label: 'Template Created' },
      error: { badge: 'danger', icon: 'bi-exclamation-triangle', label: 'Error' }
    };
    const meta = typeMap[item.type] || { badge: 'secondary', icon: 'bi-dot', label: 'Item' };
    const card = h('div', { class: 'card mb-3 border-start border-4 border-' + meta.badge + ' glass' },
      h('div', { class: 'card-header bg-transparent' },
        h('div', { class: 'd-flex justify-content-between align-items-center' },
          h('div', { class: 'd-flex align-items-center gap-2 text-white' },
            h('span', { class: `badge text-bg-${meta.badge} badge-chip` },
              h('i', { class: `bi ${meta.icon} me-1` }), meta.label
            ),
            h('strong', {}, item.template_name || '')
          ),
          h('small', { class: 'text-muted' },
            h('i', { class: 'bi bi-clock me-1' }),
            (item.created_at ? formatDate(item.created_at) : '')
          )
        )
      ),
      h('div', { class: 'card-body' },
        (() => {
          if (item.type === 'prompt') {
            return h('div', {},
              h('div', { class: 'fw-semibold mb-1 text-white' }, 'Generated Prompt:'),
              h('pre', { class: 'pretty' }, item.generated_prompt || ''),
              h('div', { class: 'd-flex flex-wrap gap-2 align-items-center mt-2' },
                h('button', {
                  class: 'btn btn-sm btn-outline-light cosmic-btn', 'data-ripple': '', onclick: async () => {
                    try { await navigator.clipboard.writeText(item.generated_prompt || ''); toast('Copied', 'success'); }
                    catch (e) { toast('Copy failed: ' + e.message, 'danger'); }
                  }
                }, h('i', { class: 'bi bi-clipboard me-1' }), 'Copy'),
                item.variable_data ? variableList(item.variable_data) : null
              )
            );
          } else if (item.type === 'template') {
            return h('div', {},
              h('div', { class: 'fw-semibold mb-1 text-white' }, 'Template Text:'),
              h('pre', { class: 'pretty' }, item.prompt_text || '')
            );
          } else if (item.type === 'error') {
            return h('div', {},
              h('div', { class: 'fw-semibold mb-1' }, 'Error Message:'),
              h('div', { class: 'alert alert-danger' }, item.error_message || ''),
              item.error_context ? h('p', {}, h('strong', {}, 'Context: '), item.error_context) : null
            );
          }
          return h('div', {}, h('pre', { class: 'pretty' }, JSON.stringify(item, null, 2)));
        })()
      )
    );
    return card;
  }

  function variableList(variableData) {
    let obj = variableData;
    if (typeof obj === 'string') { try { obj = JSON.parse(obj); } catch { obj = {}; } }
    const items = Object.entries(obj);
    if (!items.length) return null;
    const ul = h('ul', { class: 'list-group list-group-flush mt-2' });
    items.forEach(([k, v]) => ul.append(h('li', { class: 'list-group-item bg-transparent text-white' }, h('strong', {}, k + ': '), String(v))));
    return ul;
  }

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
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  }

  renderList();
  const unsub = Store.subscribe(() => renderList());
  const onHash = () => { window.removeEventListener('hashchange', onHash); unsub(); };
  window.addEventListener('hashchange', onHash);
}

// Settings view
function renderSettings() {
  const root = $('#view-root');
  root.innerHTML = '';

  // 10 Color Themes
  const themes = [
    { id: 'lavender', name: 'Lavender', emoji: '💜', desc: 'Soft purple tones' },
    { id: 'ocean', name: 'Ocean', emoji: '🌊', desc: 'Calming blue waters' },
    { id: 'peach', name: 'Peach', emoji: '🍑', desc: 'Warm orange glow' },
    { id: 'mint', name: 'Mint', emoji: '🌿', desc: 'Fresh green vibes' },
    { id: 'rose', name: 'Rose', emoji: '🌸', desc: 'Gentle pink blush' },
    { id: 'slate', name: 'Slate', emoji: '💼', desc: 'Professional gray' },
    { id: 'gold', name: 'Gold', emoji: '✨', desc: 'Luxurious warmth' },
    { id: 'teal', name: 'Teal', emoji: '🦚', desc: 'Rich cyan depth' },
    { id: 'coral', name: 'Coral', emoji: '🐚', desc: 'Vibrant sunset' },
    { id: 'indigo', name: 'Indigo', emoji: '🔮', desc: 'Deep mystery' }
  ];

  // 6 Style Filters
  const styles = [
    { id: 'glass', name: 'Glassmorphism', icon: 'bi-transparency', desc: 'Frosted glass with blur effects' },
    { id: 'glassy', name: 'Glassy', icon: 'bi-droplet', desc: 'Crystal clear with reflections' },
    { id: 'bubbly', name: 'Bubbly', icon: 'bi-circle', desc: 'Playful rounded bubble shapes' },
    { id: 'material', name: 'Google Material', icon: 'bi-layers', desc: 'Clean shadows and elevation' },
    { id: 'neumorphism', name: 'Neumorphism', icon: 'bi-circle-square', desc: 'Soft extruded shapes' },
    { id: 'skeuomorphism', name: 'Skeuomorphism', icon: 'bi-box', desc: 'Realistic textures and depth' }
  ];

  const currentTheme = localStorage.getItem('prompt-db-theme') || 'lavender';
  const currentStyle = localStorage.getItem('prompt-db-style') || 'glass';

  // Header
  const header = h('div', { class: 'd-flex align-items-center justify-content-between mb-4' },
    h('h2', { class: 'mb-0 text-gradient' }, h('i', { class: 'bi bi-gear me-2' }), 'Settings')
  );

  // Tabs
  const tabNav = h('ul', { class: 'nav nav-tabs mb-4', role: 'tablist' },
    h('li', { class: 'nav-item', role: 'presentation' },
      h('button', { class: 'nav-link active', id: 'look-tab', 'data-bs-toggle': 'tab', 'data-bs-target': '#look-panel', type: 'button', role: 'tab' },
        h('i', { class: 'bi bi-palette me-2' }), 'Look and Feel'
      )
    ),
    h('li', { class: 'nav-item', role: 'presentation' },
      h('button', { class: 'nav-link', id: 'apikeys-tab', 'data-bs-toggle': 'tab', 'data-bs-target': '#apikeys-panel', type: 'button', role: 'tab' },
        h('i', { class: 'bi bi-key me-2' }), 'API Keys'
      )
    )
  );

  // Helper for API key fields
  function apiKeyField(label, storageKey, placeholder, icon) {
    const savedVal = localStorage.getItem(storageKey) || '';
    const wrapper = h('div', { class: 'mb-3' });
    const labelEl = h('label', { class: 'form-label fw-bold' },
      h('i', { class: `bi ${icon} me-2` }), label
    );
    const inputGroup = h('div', { class: 'input-group' });
    const input = h('input', {
      type: 'password',
      class: 'form-control cosmic-input',
      id: `input-${storageKey}`,
      placeholder: placeholder,
      value: savedVal,
      autocomplete: 'off'
    });
    const toggleBtn = h('button', {
      class: 'btn btn-outline-secondary',
      type: 'button',
      title: 'Show/hide key',
      onclick: () => {
        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';
        toggleBtn.innerHTML = '';
        toggleBtn.append(h('i', { class: isPassword ? 'bi bi-eye-slash' : 'bi bi-eye' }));
      }
    }, h('i', { class: 'bi bi-eye' }));

    inputGroup.append(input, toggleBtn);
    wrapper.append(labelEl, inputGroup);
    return wrapper;
  }

  // Tab Content
  const tabContent = h('div', { class: 'tab-content' },
    h('div', { class: 'tab-pane fade show active', id: 'look-panel', role: 'tabpanel' },
      // Color Themes Section
      h('div', { class: 'card card-surface mb-4' },
        h('div', { class: 'card-body' },
          h('h5', { class: 'mb-3' }, h('i', { class: 'bi bi-palette-fill me-2' }), 'Color Theme'),
          h('p', { class: 'text-muted mb-4' }, 'Choose a color palette for the interface.'),
          h('div', { class: 'row g-3', id: 'themeGrid' })
        )
      ),
      // Style Filter Section
      h('div', { class: 'card card-surface' },
        h('div', { class: 'card-body' },
          h('h5', { class: 'mb-3' }, h('i', { class: 'bi bi-brush me-2' }), 'UI Style'),
          h('p', { class: 'text-muted mb-4' }, 'Apply a design style filter over your chosen colors.'),
          h('div', { class: 'row g-3', id: 'styleGrid' })
        )
      )
    ),
    // API Keys Tab
    h('div', { class: 'tab-pane fade', id: 'apikeys-panel', role: 'tabpanel' },
      h('div', { class: 'card card-surface mb-4' },
        h('div', { class: 'card-body' },
          h('h5', { class: 'mb-3' }, h('i', { class: 'bi bi-shield-lock me-2' }), 'AI Provider API Keys'),
          h('p', { class: 'text-muted mb-4' }, 'Configure API keys for AI providers. Keys are stored locally in your browser and never saved on the server.'),
          h('div', { class: 'alert alert-info d-flex align-items-start gap-2 mb-4' },
            h('i', { class: 'bi bi-info-circle mt-1' }),
            h('div', {}, 'API keys are stored in your browser\'s localStorage and sent directly to providers via a server proxy. They are never persisted server-side.')
          ),
          apiKeyField('Claude (Anthropic)', 'prompt-db-claude-key', 'sk-ant-api03-...', 'bi-chat-dots'),
          apiKeyField('OpenAI', 'prompt-db-openai-key', 'sk-...', 'bi-robot'),
          apiKeyField('Gemini (Google)', 'prompt-db-gemini-key', 'AI...', 'bi-stars'),
          h('div', { class: 'd-flex justify-content-between align-items-center flex-wrap gap-2 mt-3' },
            h('div', { class: 'd-flex gap-2' },
              h('button', { class: 'btn btn-outline-info cosmic-btn', id: 'exportApiKeys', 'data-ripple': '' },
                h('i', { class: 'bi bi-download me-1' }), 'Export Keys'
              ),
              h('label', { class: 'btn btn-outline-warning cosmic-btn mb-0', 'data-ripple': '', for: 'importApiKeysFile' },
                h('i', { class: 'bi bi-upload me-1' }), 'Import Keys'
              ),
              h('input', { type: 'file', class: 'd-none', id: 'importApiKeysFile', accept: '.json' })
            ),
            h('button', { class: 'btn btn-success cosmic-btn', id: 'saveApiKeys', 'data-ripple': '' },
              h('i', { class: 'bi bi-save me-1' }), 'Save API Keys'
            )
          )
        )
      )
    )
  );

  root.append(header, tabNav, tabContent);

  // API Keys save handler
  $('#saveApiKeys')?.addEventListener('click', () => {
    const keys = [
      { key: 'prompt-db-claude-key', input: '#input-prompt-db-claude-key' },
      { key: 'prompt-db-openai-key', input: '#input-prompt-db-openai-key' },
      { key: 'prompt-db-gemini-key', input: '#input-prompt-db-gemini-key' }
    ];
    keys.forEach(({ key, input: sel }) => {
      const val = $(sel)?.value?.trim();
      if (val) {
        localStorage.setItem(key, val);
      } else {
        localStorage.removeItem(key);
      }
    });
    toast('API keys saved', 'success');
  });

  // Export API Keys handler
  $('#exportApiKeys')?.addEventListener('click', () => {
    const keyDefs = [
      { key: 'prompt-db-claude-key', label: 'Claude (Anthropic)' },
      { key: 'prompt-db-openai-key', label: 'OpenAI' },
      { key: 'prompt-db-gemini-key', label: 'Gemini (Google)' }
    ];
    const exportData = {
      _meta: {
        app: 'Prompt DB',
        version: '2.0',
        exported_at: new Date().toISOString(),
        description: 'API Keys export file for Prompt DB. Import this file to restore your keys.'
      },
      api_keys: {}
    };
    let hasKeys = false;
    keyDefs.forEach(({ key, label }) => {
      const val = localStorage.getItem(key);
      if (val) {
        exportData.api_keys[key] = { label, value: val };
        hasKeys = true;
      } else {
        exportData.api_keys[key] = { label, value: '' };
      }
    });
    if (!hasKeys) {
      toast('No API keys to export. Save some keys first.', 'warning');
      return;
    }
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prompt-db-api-keys-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast('API keys exported successfully', 'success');
  });

  // Import API Keys handler
  $('#importApiKeysFile')?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // Validate structure
      if (!data.api_keys || typeof data.api_keys !== 'object') {
        throw new Error('Invalid file format: missing api_keys object');
      }

      const validKeys = ['prompt-db-claude-key', 'prompt-db-openai-key', 'prompt-db-gemini-key'];
      let importedCount = 0;

      Object.entries(data.api_keys).forEach(([key, entry]) => {
        if (validKeys.includes(key)) {
          const val = typeof entry === 'string' ? entry : (entry.value || '');
          if (val) {
            localStorage.setItem(key, val);
            importedCount++;
          } else {
            localStorage.removeItem(key);
          }
          // Update the input field if it exists
          const input = $(`#input-${key}`);
          if (input) {
            input.value = typeof entry === 'string' ? entry : (entry.value || '');
          }
        }
      });

      if (importedCount === 0) {
        toast('No valid API keys found in the file', 'warning');
      } else {
        toast(`Imported ${importedCount} API key${importedCount > 1 ? 's' : ''} successfully`, 'success');
      }
    } catch (err) {
      if (err instanceof SyntaxError) {
        toast('Invalid JSON file. Please select a valid API keys export file.', 'danger');
      } else {
        toast('Import failed: ' + err.message, 'danger');
      }
    }
    // Reset file input so re-selecting the same file triggers change
    e.target.value = '';
  });

  // Render theme cards
  const themeGrid = $('#themeGrid');
  themes.forEach(theme => {
    const isActive = theme.id === currentTheme;
    const card = h('div', { class: 'col-6 col-sm-4 col-lg-3 col-xl-2' },
      h('div', {
        class: `theme-card ${isActive ? 'active' : ''}`,
        'data-theme-id': theme.id,
        onclick: () => selectTheme(theme.id, theme.name)
      },
        h('div', { class: 'text-center' },
          h('span', { class: 'theme-emoji d-block mb-2' }, theme.emoji),
          h('div', { class: 'theme-name' }, theme.name),
          h('div', { class: 'theme-desc small' }, theme.desc)
        ),
        isActive ? h('span', { class: 'badge bg-success position-absolute top-0 end-0 m-2' }, h('i', { class: 'bi bi-check-lg' })) : null
      )
    );
    themeGrid.append(card);
  });

  // Render style cards
  const styleGrid = $('#styleGrid');
  styles.forEach(style => {
    const isActive = style.id === currentStyle;
    const card = h('div', { class: 'col-12 col-sm-6 col-lg-3' },
      h('div', {
        class: `style-card ${isActive ? 'active' : ''}`,
        'data-style-id': style.id,
        onclick: () => selectStyle(style.id, style.name)
      },
        h('div', { class: 'd-flex align-items-center gap-3' },
          h('i', { class: `bi ${style.icon} fs-3` }),
          h('div', {},
            h('div', { class: 'style-name fw-semibold' }, style.name),
            h('div', { class: 'style-desc small text-muted' }, style.desc)
          )
        ),
        isActive ? h('span', { class: 'badge bg-success ms-auto' }, h('i', { class: 'bi bi-check-lg' })) : null
      )
    );
    styleGrid.append(card);
  });

  function selectTheme(themeId, themeName) {
    document.documentElement.setAttribute('data-theme', themeId);
    localStorage.setItem('prompt-db-theme', themeId);

    $$('.theme-card').forEach(card => {
      const isActive = card.getAttribute('data-theme-id') === themeId;
      card.classList.toggle('active', isActive);
      const badge = card.querySelector('.badge');
      if (isActive && !badge) {
        card.append(h('span', { class: 'badge bg-success position-absolute top-0 end-0 m-2' }, h('i', { class: 'bi bi-check-lg' })));
      } else if (!isActive && badge) {
        badge.remove();
      }
    });
    toast(`Color theme: ${themeName}`, 'success');
  }

  function selectStyle(styleId, styleName) {
    document.documentElement.setAttribute('data-style', styleId);
    localStorage.setItem('prompt-db-style', styleId);

    $$('.style-card').forEach(card => {
      const isActive = card.getAttribute('data-style-id') === styleId;
      card.classList.toggle('active', isActive);
      const badge = card.querySelector('.badge');
      if (isActive && !badge) {
        card.querySelector('.d-flex').append(h('span', { class: 'badge bg-success ms-auto' }, h('i', { class: 'bi bi-check-lg' })));
      } else if (!isActive && badge) {
        badge.remove();
      }
    });
    toast(`UI style: ${styleName}`, 'success');
  }
}

// --- Inline Edit Modal ---
let editModal, editTplCurrent = null;
async function openEditTemplateModal(templateId) {
  try {
    const detail = await loadTemplateDetail(templateId);
    editTplCurrent = detail;
    // Populate form
    $('#editTplName').value = detail.template_name || '';
    $('#editTplText').value = detail.prompt_text || '';

    const cont = $('#editVarContainer');
    cont.innerHTML = '';
    (detail.variables || []).forEach((v, i) => cont.append(editVariableRow(v, i)));

    if (!editModal) editModal = new bootstrap.Modal($('#editTplModal'));
    editModal.show();

    // Re-parse button
    $('#reparseBtn').onclick = () => {
      const re = /\[([^\]]+)\]/g;
      const found = [...($('#editTplText').value || '').matchAll(re)].map(m => m[1]);
      const unique = [...new Set(found)];
      const existing = new Set($$('#editVarContainer .evar-name').map(i => i.value));
      // Add any missing variables with default config
      unique.forEach((name) => {
        if (!existing.has(name)) cont.append(editVariableRow({ variable_name: name, field_label: formatLabel(name), field_type: 'text' }, cont.children.length));
      });
      toast('Re-parsed variables from prompt text', 'info');
    };

    // Add variable button
    $('#addVarBtn').onclick = () => cont.append(editVariableRow({ variable_name: 'new-variable', field_label: 'New Variable', field_type: 'text' }, cont.children.length));

    // Save
    $('#saveTplBtn').onclick = async () => {
      try {
        const name = $('#editTplName').value.trim();
        const text = $('#editTplText').value.trim();
        if (!name || !text) throw new Error('Please fill in name and prompt text');
        const vars = [...$$('#editVarContainer .variable-row')].map((row, order) => ({
          variable_name: $('.evar-name', row).value.trim(),
          field_label: $('.evar-label', row).value.trim(),
          field_type: $('.evar-type', row).value,
          variable_order: order + 1
        }));
        // Basic validation
        if (new Set(vars.map(v => v.variable_name)).size !== vars.length) throw new Error('Duplicate variable names detected');
        if (vars.some(v => !v.field_label || !v.variable_name)) throw new Error('Variables must have names and labels');

        const payload = { id: editTplCurrent.id, template_name: name, prompt_text: text, variables: vars };
        const res = await api.updateTemplate(payload);
        if (res && res.success === false) throw new Error(res.error || 'Failed to update');

        toast('Template updated', 'success');
        editModal.hide();
        await loadTemplates(true);

        // If currently selected in Generate, refresh its details too
        if (Store.state.selectedTemplate && Store.state.selectedTemplate.id === editTplCurrent.id) {
          const detail = await loadTemplateDetail(editTplCurrent.id);
          Store.set({ selectedTemplate: detail });
        }
      } catch (e) {
        toast('Update failed: ' + e.message, 'danger');
      }
    };
  } catch (e) {
    toast('Failed to open editor: ' + e.message, 'danger');
  }
}

function editVariableRow(v, index) {
  const row = h('div', { class: 'variable-row mb-2', 'data-index': index },
    h('div', { class: 'row g-3 align-items-center' },
      h('div', { class: 'col-md-4' },
        h('label', { class: 'form-label fw-bold' }, 'Variable Name'),
        h('input', { class: 'form-control cosmic-input evar-name', value: v.variable_name || '', placeholder: 'e.g., recipient' })
      ),
      h('div', { class: 'col-md-4' },
        h('label', { class: 'form-label fw-bold' }, 'Field Label'),
        h('input', { class: 'form-control cosmic-input evar-label', value: v.field_label || '', placeholder: 'Readable label' })
      ),
      h('div', { class: 'col-md-3' },
        h('label', { class: 'form-label fw-bold' }, 'Input Type'),
        (() => {
          const select = h('select', { class: 'form-select cosmic-input evar-type' });
          ['text', 'textarea', 'number', 'date', 'email', 'url'].forEach(t => select.append(h('option', { value: t, selected: (v.field_type === t ? true : null) }, t)));
          return select;
        })()
      ),
      h('div', { class: 'col-md-1 d-flex gap-1 justify-content-end' },
        h('button', { type: 'button', class: 'btn btn-sm btn-outline-light cosmic-btn', 'data-ripple': '', title: 'Move up', onclick: () => moveRow(row, -1) }, h('i', { class: 'bi bi-arrow-up' })),
        h('button', { type: 'button', class: 'btn btn-sm btn-outline-light cosmic-btn', 'data-ripple': '', title: 'Move down', onclick: () => moveRow(row, 1) }, h('i', { class: 'bi bi-arrow-down' })),
        h('button', { type: 'button', class: 'btn btn-sm btn-outline-danger cosmic-btn', 'data-ripple': '', title: 'Remove', onclick: () => row.remove() }, h('i', { class: 'bi bi-x-lg' }))
      )
    )
  );
  return row;
}

function moveRow(row, dir) {
  const container = row.parentElement;
  const siblings = [...container.children];
  const idx = siblings.indexOf(row);
  const newIdx = idx + dir;
  if (newIdx < 0 || newIdx >= siblings.length) return;
  if (dir < 0) {
    container.insertBefore(row, siblings[newIdx]);
  } else {
    container.insertBefore(row, siblings[newIdx].nextSibling);
  }
}

// --- Users Management (Admin Only) ---

let _usersData = [];
let _usersSortKey = 'username';
let _usersSortDir = 1; // 1 = asc, -1 = desc

async function renderUsers() {
  const root = $('#view-root');
  root.innerHTML = '';

  // Admin check
  if (!window._currentUser || window._currentUser.role !== 'admin') {
    root.append(
      h('div', { class: 'alert alert-warning' },
        h('i', { class: 'bi bi-shield-exclamation me-2' }),
        'Admin access required to manage users.'
      )
    );
    return;
  }

  // Header
  const header = h('div', { class: 'd-flex justify-content-between align-items-center flex-wrap gap-2 mb-4' },
    h('div', {},
      h('h3', { class: 'text-gradient mb-1' }, h('i', { class: 'bi bi-people-fill me-2' }), 'User Management'),
      h('p', { class: 'text-muted mb-0' }, 'Manage authorized users. Click any cell to edit inline.')
    ),
    h('button', { class: 'btn btn-success cosmic-btn', id: 'createUserBtn', 'data-ripple': '' },
      h('i', { class: 'bi bi-person-plus me-1' }), 'Create New User'
    )
  );

  const tableWrap = h('div', { class: 'users-table-wrap card-surface', id: 'usersTableWrap' });
  const loadingDiv = h('div', { class: 'text-center p-4' },
    h('div', { class: 'spinner-border text-primary', role: 'status' }),
    h('p', { class: 'text-muted mt-2 mb-0' }, 'Loading users...')
  );

  root.append(header, tableWrap);
  tableWrap.append(loadingDiv);

  // Load users
  try {
    const data = await api.get('users.php');
    if (data && Array.isArray(data)) {
      _usersData = data;
    } else {
      _usersData = [];
    }
  } catch (e) {
    tableWrap.innerHTML = `<div class="alert alert-danger m-3">${e.message}</div>`;
    return;
  }

  renderUsersTable();

  // Create User modal handler
  $('#createUserBtn').addEventListener('click', showCreateUserModal);
}

function renderUsersTable() {
  const tableWrap = $('#usersTableWrap');
  if (!tableWrap) return;
  tableWrap.innerHTML = '';

  const columns = [
    { key: 'username', label: 'Username', editable: true, required: true },
    { key: 'first_name', label: 'First Name', editable: true },
    { key: 'last_name', label: 'Last Name', editable: true },
    { key: 'email', label: 'Email', editable: true },
    { key: 'password', label: 'Password', editable: true, isPassword: true },
    { key: 'role', label: 'Role', editable: false },
    { key: 'created_at', label: 'Date Created', editable: false },
    { key: '_action', label: 'Actions', editable: false, noSort: true }
  ];

  // Sort data
  const sorted = [..._usersData].sort((a, b) => {
    const valA = (a[_usersSortKey] || '').toString().toLowerCase();
    const valB = (b[_usersSortKey] || '').toString().toLowerCase();
    if (valA < valB) return -1 * _usersSortDir;
    if (valA > valB) return 1 * _usersSortDir;
    return 0;
  });

  // Build table
  const table = document.createElement('table');
  table.className = 'users-table';

  // Header
  const thead = document.createElement('thead');
  const headRow = document.createElement('tr');
  columns.forEach(col => {
    const th = document.createElement('th');
    th.textContent = col.label;
    if (col.key === _usersSortKey) th.classList.add('sorted');

    if (!col.noSort) {
      const arrow = document.createElement('span');
      arrow.className = 'sort-arrow';
      arrow.textContent = (col.key === _usersSortKey)
        ? (_usersSortDir === 1 ? '▲' : '▼')
        : '▲';
      th.append(arrow);

      th.addEventListener('click', () => {
        if (_usersSortKey === col.key) {
          _usersSortDir *= -1;
        } else {
          _usersSortKey = col.key;
          _usersSortDir = 1;
        }
        renderUsersTable();
      });
    }

    headRow.append(th);
  });
  thead.append(headRow);
  table.append(thead);

  // Body
  const tbody = document.createElement('tbody');

  if (sorted.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = columns.length;
    td.className = 'text-center text-muted py-4';
    td.textContent = 'No users found.';
    tr.append(td);
    tbody.append(tr);
  }

  sorted.forEach(user => {
    const tr = document.createElement('tr');
    tr.dataset.userId = user.id;

    // Track original values for cancel
    const originals = {};
    columns.forEach(col => {
      if (col.editable) originals[col.key] = col.isPassword ? '' : (user[col.key] || '');
    });

    columns.forEach(col => {
      const td = document.createElement('td');

      if (col.key === '_action') {
        td.innerHTML = `
          <div class="action-btns">
            <button class="btn btn-sm btn-success save-row-btn" style="display:none;" title="Save changes">
              <i class="bi bi-check-lg"></i> Save
            </button>
            <button class="btn btn-sm btn-outline-secondary cancel-row-btn" style="display:none;" title="Cancel">
              <i class="bi bi-x-lg"></i>
            </button>
            <button class="btn btn-sm btn-outline-danger delete-row-btn" title="Delete user">
              <i class="bi bi-trash"></i>
            </button>
          </div>`;

        // Save handler
        td.querySelector('.save-row-btn').addEventListener('click', async () => {
          const row = tr;
          const cells = row.querySelectorAll('[data-field]');
          const payload = { id: user.id };

          let valid = true;
          cells.forEach(cell => {
            const field = cell.dataset.field;
            const val = cell.textContent.trim();
            if (field === 'username' && !val) { valid = false; cell.style.borderColor = '#dc2626'; }
            payload[field] = val;
          });

          if (!valid) { toast('Username is required', 'warning'); return; }

          // Validate password length if provided
          if (payload.password && payload.password.length > 0 && payload.password.length < 6) {
            toast('Password must be at least 6 characters', 'warning');
            return;
          }

          try {
            const res = await fetch(API_BASE + 'users.php', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
              body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Update failed');

            // Update local data
            const idx = _usersData.findIndex(u => u.id === user.id);
            if (idx !== -1) _usersData[idx] = data.user;

            tr.classList.remove('editing');
            td.querySelector('.save-row-btn').style.display = 'none';
            td.querySelector('.cancel-row-btn').style.display = 'none';

            // Clear password cell after save
            const pwCell = tr.querySelector('[data-field="password"]');
            if (pwCell) pwCell.textContent = '';

            toast('User updated successfully', 'success');
          } catch (e) {
            toast('Save failed: ' + e.message, 'danger');
          }
        });

        // Cancel handler
        td.querySelector('.cancel-row-btn').addEventListener('click', () => {
          const cells = tr.querySelectorAll('[data-field]');
          cells.forEach(cell => {
            const field = cell.dataset.field;
            cell.textContent = originals[field] || '';
            cell.style.borderColor = '';
          });
          tr.classList.remove('editing');
          td.querySelector('.save-row-btn').style.display = 'none';
          td.querySelector('.cancel-row-btn').style.display = 'none';
        });

        // Delete handler
        td.querySelector('.delete-row-btn').addEventListener('click', async () => {
          if (!confirm(`Delete user "${user.username}"? This cannot be undone.`)) return;
          try {
            const res = await fetch(API_BASE + `users.php?id=${user.id}`, {
              method: 'DELETE',
              headers: { 'Accept': 'application/json' }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Delete failed');
            _usersData = _usersData.filter(u => u.id !== user.id);
            renderUsersTable();
            toast('User deleted', 'success');
          } catch (e) {
            toast('Delete failed: ' + e.message, 'danger');
          }
        });

      } else if (col.editable) {
        const span = document.createElement('span');
        span.className = 'editable-cell';
        span.contentEditable = 'true';
        span.dataset.field = col.key;
        span.textContent = col.isPassword ? '' : (user[col.key] || '');
        if (col.isPassword) span.setAttribute('placeholder', '••• (type to change)');
        span.style.minWidth = col.isPassword ? '120px' : '';

        span.addEventListener('focus', () => {
          tr.classList.add('editing');
          const actionTd = tr.querySelector('.action-btns');
          if (actionTd) {
            actionTd.querySelector('.save-row-btn').style.display = '';
            actionTd.querySelector('.cancel-row-btn').style.display = '';
          }
        });

        td.append(span);
      } else if (col.key === 'role') {
        const badge = document.createElement('span');
        badge.className = `role-badge ${user.role || 'user'}`;
        badge.textContent = user.role || 'user';
        td.append(badge);
      } else if (col.key === 'created_at') {
        td.textContent = formatDateTime(user.created_at);
      } else {
        td.textContent = user[col.key] || '';
      }

      tr.append(td);
    });

    tbody.append(tr);
  });

  table.append(tbody);
  tableWrap.append(table);

  // User count footer
  const footer = document.createElement('div');
  footer.className = 'p-2 px-3 text-muted small d-flex justify-content-between';
  footer.innerHTML = `<span>${sorted.length} user${sorted.length !== 1 ? 's' : ''}</span><span>Sorted by ${_usersSortKey} (${_usersSortDir === 1 ? 'asc' : 'desc'})</span>`;
  tableWrap.append(footer);
}

function formatDateTime(isoStr) {
  if (!isoStr) return '—';
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return isoStr;
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) +
      ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  } catch { return isoStr; }
}

function showCreateUserModal() {
  // Remove existing modal if any
  const existing = document.getElementById('createUserModal');
  if (existing) existing.remove();

  const backdrop = document.createElement('div');
  backdrop.id = 'createUserModal';
  backdrop.style.cssText = 'position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;padding:1rem;';

  const card = document.createElement('div');
  card.className = 'glass';
  card.style.cssText = 'width:100%;max-width:520px;border-radius:1.25rem;padding:2rem;animation:loginFadeIn .3s ease-out;';

  card.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h4 class="mb-0 text-gradient"><i class="bi bi-person-plus me-2"></i>Create New User</h4>
      <button class="btn btn-sm btn-outline-secondary" id="closeCreateModal" aria-label="Close"><i class="bi bi-x-lg"></i></button>
    </div>
    <form id="createUserForm">
      <div class="mb-3">
        <label class="form-label fw-bold">Username <span class="text-danger">*</span></label>
        <input type="text" class="form-control cosmic-input" id="newUsername" required placeholder="e.g. jdoe" minlength="1">
      </div>
      <div class="row g-3 mb-3">
        <div class="col-6">
          <label class="form-label fw-bold">First Name</label>
          <input type="text" class="form-control cosmic-input" id="newFirstName" placeholder="John">
        </div>
        <div class="col-6">
          <label class="form-label fw-bold">Last Name</label>
          <input type="text" class="form-control cosmic-input" id="newLastName" placeholder="Doe">
        </div>
      </div>
      <div class="mb-3">
        <label class="form-label fw-bold">Email</label>
        <input type="email" class="form-control cosmic-input" id="newEmail" placeholder="john@example.com">
      </div>
      <div class="mb-3">
        <label class="form-label fw-bold">Password <span class="text-danger">*</span></label>
        <input type="password" class="form-control cosmic-input" id="newPassword" required minlength="6" placeholder="Minimum 6 characters">
      </div>
      <div class="mb-3">
        <label class="form-label fw-bold">Role</label>
        <select class="form-select cosmic-input" id="newRole">
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
      </div>
      <div id="createUserError" class="alert alert-danger d-none mb-3"></div>
      <div class="d-flex justify-content-end gap-2">
        <button type="button" class="btn btn-outline-secondary cosmic-btn" id="cancelCreateUser">Cancel</button>
        <button type="submit" class="btn btn-success cosmic-btn" id="submitCreateUser">
          <i class="bi bi-person-plus me-1"></i> Create User
        </button>
      </div>
    </form>
  `;

  backdrop.append(card);
  document.body.append(backdrop);

  // Close handlers
  const closeModal = () => backdrop.remove();
  backdrop.addEventListener('click', (e) => { if (e.target === backdrop) closeModal(); });
  card.querySelector('#closeCreateModal').addEventListener('click', closeModal);
  card.querySelector('#cancelCreateUser').addEventListener('click', closeModal);

  // Submit handler
  card.querySelector('#createUserForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const errEl = card.querySelector('#createUserError');
    const btn = card.querySelector('#submitCreateUser');
    errEl.classList.add('d-none');

    const username = card.querySelector('#newUsername').value.trim();
    const password = card.querySelector('#newPassword').value;
    const firstName = card.querySelector('#newFirstName').value.trim();
    const lastName = card.querySelector('#newLastName').value.trim();
    const email = card.querySelector('#newEmail').value.trim();
    const role = card.querySelector('#newRole').value;

    if (!username) { errEl.textContent = 'Username is required'; errEl.classList.remove('d-none'); return; }
    if (password.length < 6) { errEl.textContent = 'Password must be at least 6 characters'; errEl.classList.remove('d-none'); return; }

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Creating...';

    try {
      const res = await fetch(API_BASE + 'users.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ username, password, first_name: firstName, last_name: lastName, email, role })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Create failed');

      _usersData.push(data.user);
      renderUsersTable();
      closeModal();
      toast(`User "${username}" created successfully`, 'success');
    } catch (err) {
      errEl.textContent = err.message;
      errEl.classList.remove('d-none');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i class="bi bi-person-plus me-1"></i> Create User';
    }
  });

  // Focus first field
  setTimeout(() => card.querySelector('#newUsername')?.focus(), 100);
}

// --- helpers ---
function escapeRegExp(str) { return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
function formatLabel(varName) {
  return varName.replace(/[-_]+/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// --- Falling stars & ripple interactions ---
function initFallingStars() {
  const field = $('.falling-stars');
  if (!field) return;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  const spawn = () => {
    const star = document.createElement('div');
    star.className = 'star';
    const x = Math.random() * 100;
    const delay = Math.random() * 0.8;
    const dur = 2.0 + Math.random() * 2.0;
    star.style.left = x + '%';
    star.style.animationDelay = delay + 's';
    star.style.setProperty('--dur', dur + 's');
    field.appendChild(star);
    star.addEventListener('animationend', () => star.remove(), { once: true });
  };
  // trickle
  setInterval(spawn, 500);
}

function initRipple() {
  document.addEventListener('click', (e) => {
    const target = e.target.closest('[data-ripple]');
    if (!target) return;
    const rect = target.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100 + '%';
    const y = ((e.clientY - rect.top) / rect.height) * 100 + '%';
    target.style.setProperty('--ripple-x', x);
    target.style.setProperty('--ripple-y', y);
    target.classList.remove('rippling');
    void target.offsetWidth; // restart animation
    target.classList.add('rippling');
    setTimeout(() => target.classList.remove('rippling'), 650);
  });
}

// --- Theme Switcher ---
function initThemeSwitcher() {
  // Load saved theme and style from localStorage on page load
  const savedTheme = localStorage.getItem('prompt-db-theme') || 'lavender';
  const savedStyle = localStorage.getItem('prompt-db-style') || 'glass';
  document.documentElement.setAttribute('data-theme', savedTheme);
  document.documentElement.setAttribute('data-style', savedStyle);
}

// --- Auth Flow ---
async function checkAuth() {
  try {
    const res = await fetch(API_BASE + 'auth.php?action=check', { headers: { 'Accept': 'application/json' } });
    if (!res.ok) return null;
    const data = await res.json();
    return data.authenticated ? data.user : null;
  } catch (e) {
    console.warn('Auth check failed:', e);
    return null;
  }
}

function showLogin() {
  $('#loginOverlay').style.display = '';
  $('#appLayout').style.display = 'none';
}

function showApp(user) {
  $('#loginOverlay').style.display = 'none';
  $('#appLayout').style.display = '';
  const userEl = $('#loggedInUser');
  if (userEl) userEl.textContent = user.username || '';
  const roleEl = $('#loggedInRole');
  if (roleEl) roleEl.textContent = user.role || '';
  // Show admin-only nav items
  const usersNav = $('#navUsers');
  if (usersNav) usersNav.style.display = (user.role === 'admin') ? '' : 'none';
  // Store current user info globally
  window._currentUser = user;
}

function initAuthHandlers() {
  // Login form
  const loginForm = $('#loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = $('#loginUser').value.trim();
      const password = $('#loginPass').value;
      const errEl = $('#loginError');
      const btn = $('#loginBtn');

      if (!username || !password) {
        errEl.textContent = 'Please enter username and password.';
        errEl.classList.remove('d-none');
        return;
      }

      btn.disabled = true;
      btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status"></span> Signing in...';
      errEl.classList.add('d-none');

      try {
        const res = await fetch(API_BASE + 'auth.php?action=login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Login failed');
        }
        // Login succeeded — load app
        showApp(data.user);
        await loadTemplates(true);
        setActiveNav();
        router();
        toast(`Welcome back, ${data.user.username}!`, 'success');
      } catch (err) {
        errEl.textContent = err.message;
        errEl.classList.remove('d-none');
      } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-box-arrow-in-right me-1"></i> Sign In';
      }
    });
  }

  // Logout button
  const logoutBtn = $('#logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        await fetch(API_BASE + 'auth.php?action=logout', { method: 'POST' });
      } catch (e) { /* ignore */ }
      Store.set({ templates: [], selectedTemplate: null, history: [], searchQuery: '' });
      showLogin();
      toast('Signed out', 'info');
    });
  }
}

// --- Boot ---
(async function boot() {
  initThemeSwitcher();
  initFallingStars();
  initRipple();
  initAuthHandlers();

  // Check if already authenticated
  const user = await checkAuth();
  if (user) {
    showApp(user);
    try { await loadTemplates(); } catch (e) { console.warn('Initial template load failed:', e); }
    setActiveNav();
    router();
  } else {
    showLogin();
  }
})();
