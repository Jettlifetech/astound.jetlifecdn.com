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
  // Ensure a bottom-right toast container exists (separate from any existing BS container)
  let container = document.getElementById('toastContainerBR');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainerBR';
    container.style.cssText = [
      'position:fixed', 'bottom:1.25rem', 'right:1.25rem',
      'z-index:1090', 'display:flex', 'flex-direction:column',
      'gap:0.5rem', 'align-items:flex-end', 'pointer-events:none'
    ].join(';');
    document.body.appendChild(container);
  }

  const icons = { success: '✅', danger: '❌', warning: '⚠️', info: 'ℹ️' };
  const icon = icons[type] || 'ℹ️';
  const bgMap = { success: '#16a34a', danger: '#dc2626', warning: '#d97706', info: '#2563eb' };
  const bg = bgMap[type] || bgMap.info;

  const wrapper = document.createElement('div');
  wrapper.style.cssText = [
    'pointer-events:auto', 'display:flex', 'align-items:center', 'gap:0.6rem',
    'padding:0.75rem 1rem', 'border-radius:0.75rem',
    `background:${bg}`, 'color:#fff', 'font-size:0.875rem',
    'box-shadow:0 4px 20px rgba(0,0,0,0.35)', 'max-width:22rem',
    'transform:translateX(120%)', 'transition:transform 0.3s cubic-bezier(.22,.61,.36,1)',
    'line-height:1.4'
  ].join(';');
  wrapper.innerHTML = `
    <span style="font-size:1.1rem;flex-shrink:0">${icon}</span>
    <span style="flex:1">${message}</span>
    <button onclick="this.closest('.prompt-toast').remove()" style="background:none;border:none;color:#fff;font-size:1.1rem;cursor:pointer;padding:0;line-height:1;opacity:0.8;flex-shrink:0" aria-label="Close">✕</button>
  `;
  wrapper.classList.add('prompt-toast');

  container.appendChild(wrapper);
  // Slide in
  requestAnimationFrame(() => {
    requestAnimationFrame(() => { wrapper.style.transform = 'translateX(0)'; });
  });

  // Auto-close after 15 seconds
  const timer = setTimeout(() => {
    wrapper.style.transform = 'translateX(120%)';
    wrapper.style.opacity = '0';
    setTimeout(() => wrapper.remove(), 350);
  }, 15000);

  // Manual close button cancels timer
  wrapper.querySelector('button').addEventListener('click', () => {
    clearTimeout(timer);
    wrapper.remove();
  }, { once: true });
}


function confirmDialog({ title = 'Confirm', body = 'Are you sure?', okText = 'OK', okClass = 'btn-danger' }) {
  return new Promise(resolve => {
    $('#confirmTitle').textContent = title;
    const bodyEl = $('#confirmBody');
    // Accept a DOM node, an HTML string, or plain text
    if (body instanceof Node) {
      bodyEl.innerHTML = '';
      bodyEl.appendChild(body);
    } else {
      bodyEl.innerHTML = body; // render HTML strings properly
    }
    const okBtn = $('#confirmOkBtn');
    okBtn.textContent = okText;
    okBtn.className = 'btn ' + okClass;
    const modal = bootstrap.Modal.getOrCreateInstance($('#confirmModal'));
    const handler = () => { cleanup(); modal.hide(); resolve(true); };
    // Safety: remove any stale backdrops left by previous modal instances
    document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
    const cleanup = () => {
      okBtn.removeEventListener('click', handler);
      $('#confirmModal').removeEventListener('hidden.bs.modal', cancelHandler);
    };
    const cancelHandler = () => {
      cleanup();
      document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
      document.body.classList.remove('modal-open');
      document.body.style.removeProperty('overflow');
      document.body.style.removeProperty('padding-right');
      resolve(false);
    };
    okBtn.addEventListener('click', handler, { once: true });
    $('#confirmModal').addEventListener('hidden.bs.modal', cancelHandler, { once: true });
    modal.show();
  });
}

// --- API helpers (AJAX) ---
const api = {
  async get(path) {
    const res = await fetch(API_BASE + path, { credentials: 'same-origin', headers: { 'Accept': 'application/json' } });
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
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(`POST ${path} failed: ${res.status}`);
    try { return await res.json(); } catch { return { success: true }; }
  },
  async put(path, data) {
    const res = await fetch(API_BASE + path, {
      method: 'PUT',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(`PUT ${path} failed: ${res.status}`);
    return res.json();
  },
  async del(path, formEncodedBody) {
    const res = await fetch(API_BASE + path, {
      method: 'DELETE',
      credentials: 'same-origin',
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
  },
  // Generic template action (increment_use, bulk_category, export, import, etc.)
  async templateAction(actionData) {
    const res = await fetch(API_BASE + 'templates.php', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(actionData)
    });
    if (res.status === 401) throw new Error('Session expired — please refresh the page and sign in again.');
    if (!res.ok) throw new Error(`Action failed: ${res.status}`);
    return res.json();
  }
};

/**
 * renderPromptOutput(text, containerEl)
 * Parses a generated prompt string and renders it into containerEl.
 * Text outside {{...}} is rendered as plain text.
 * Text inside {{command}} is rendered as a click-to-copy terminal block.
 */
function renderPromptOutput(text, containerEl) {
  // Split on {{...}} blocks (non-greedy, allows newlines inside)
  const parts = text.split(/({{[\s\S]+?}})/g);
  parts.forEach(part => {
    if (part.startsWith('{{') && part.endsWith('}}')) {
      const cmd = part.slice(2, -2); // strip {{ }}

      // ── Terminal chip wrapper ──
      const chip = document.createElement('div');
      chip.className = 'cmd-chip';
      chip.dataset.cmd = cmd;
      chip.title = 'Click anywhere on this block to copy to clipboard';
      chip.style.cssText = [
        'display:flex', 'align-items:flex-start', 'gap:0.6rem',
        'margin:0.5rem 0', 'padding:0.6rem 0.9rem',
        'border-radius:0.6rem', 'cursor:pointer',
        'border:1px solid rgba(6,182,212,0.35)',
        'background:rgba(6,182,212,0.08)',
        'transition:background 0.15s, border-color 0.15s',
        'font-family:\'JetBrains Mono\',\'Fira Code\',monospace',
        'font-size:0.85rem', 'line-height:1.5', 'color:#e0f7fa',
        'word-break:break-all', 'position:relative'
      ].join(';');

      // Terminal icon bullet
      const icon = document.createElement('span');
      icon.textContent = '⌨';
      icon.style.cssText = 'flex-shrink:0;font-size:1rem;margin-top:0.05rem;opacity:0.7;user-select:none;';

      // Command text
      const codeText = document.createElement('span');
      codeText.style.cssText = 'flex:1;white-space:pre-wrap;';
      codeText.textContent = cmd;

      // Copy badge (top-right)
      const badge = document.createElement('span');
      badge.style.cssText = [
        'flex-shrink:0', 'font-size:0.7rem', 'font-weight:600',
        'background:rgba(6,182,212,0.2)', 'color:#38bdf8',
        'border:1px solid rgba(6,182,212,0.3)', 'border-radius:0.3rem',
        'padding:1px 6px', 'align-self:flex-start', 'white-space:nowrap',
        'font-family:sans-serif', 'user-select:none'
      ].join(';');
      badge.textContent = '📋 Click to copy';

      chip.append(icon, codeText, badge);

      // Hover effect
      chip.addEventListener('mouseenter', () => {
        chip.style.background = 'rgba(6,182,212,0.16)';
        chip.style.borderColor = 'rgba(6,182,212,0.6)';
      });
      chip.addEventListener('mouseleave', () => {
        chip.style.background = 'rgba(6,182,212,0.08)';
        chip.style.borderColor = 'rgba(6,182,212,0.35)';
      });

      // Click: copy just this command
      chip.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(cmd);
          badge.textContent = '✅ Copied!';
          badge.style.background = 'rgba(16,185,129,0.25)';
          badge.style.color = '#10b981';
          badge.style.borderColor = 'rgba(16,185,129,0.4)';
          chip.style.borderColor = 'rgba(16,185,129,0.6)';
          setTimeout(() => {
            badge.textContent = '📋 Click to copy';
            badge.style.background = 'rgba(6,182,212,0.2)';
            badge.style.color = '#38bdf8';
            badge.style.borderColor = 'rgba(6,182,212,0.3)';
            chip.style.borderColor = 'rgba(6,182,212,0.35)';
          }, 2200);
          toast('Command copied to clipboard!', 'success');
        } catch (e) {
          toast('Copy failed: ' + e.message, 'danger');
        }
      });

      containerEl.appendChild(chip);
    } else {
      // Plain text — preserve whitespace/newlines
      if (part) containerEl.appendChild(document.createTextNode(part));
    }
  });
}

// --- Router ---
const Routes = {
  '/generate': renderGenerate,
  '/templates': renderTemplates,
  '/history': renderHistory,
  '/profiles': renderProfiles,
  '/schema': renderSchemaGen,
  '/settings': renderSettings,
  '/users': renderUsers
};


function setActiveNav() {
  const hash = location.hash || '#/generate';
  $$('.app-sidebar .nav-link').forEach(a => a.classList.toggle('active', a.getAttribute('href') === hash));
  // Auto-expand the dropdown if any child link is active
  const dropdownItems = $('#sidebarMoreItems');
  const toggle = $('#moreToggle');
  if (dropdownItems && toggle) {
    const hasActiveChild = !!dropdownItems.querySelector('.nav-link.active');
    if (hasActiveChild) {
      dropdownItems.style.display = '';
      toggle.classList.add('open');
    }
  }
}
async function router() {
  setActiveNav();
  const route = (location.hash || '#/generate').replace(/^#/, '');
  const view = Routes[route] || renderGenerate;
  await view();
}
window.addEventListener('hashchange', router);

// --- Sidebar dropdown toggle ---
(function () {
  const toggle = $('#moreToggle');
  const items = $('#sidebarMoreItems');
  if (toggle && items) {
    toggle.addEventListener('click', () => {
      const open = items.style.display === 'none';
      items.style.display = open ? '' : 'none';
      toggle.classList.toggle('open', open);
    });
  }
})();

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
  let profiles = [];
  try { profiles = await api.get('profiles.php'); } catch { }
  let activeProfileData = {};

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

  const card = h('div', { class: 'card card-surface', 'data-name': 'generate-main-card' });
  const body = h('div', { class: 'card-body' });

  // 1. Profile Selector
  if (profiles && profiles.length > 0) {
    const pGroup = h('div', { class: 'mb-4 p-3 rounded glass-brd bg-white bg-opacity-10' });
    const pLabel = h('label', { class: 'form-label fw-bold small text-muted text-uppercase mb-2' },
      h('i', { class: 'bi bi-person-lines-fill me-1 jlt-step1' }), '1. Autofill from Profile (Optional)');
    const pSelect = h('select', { class: 'form-select cosmic-input form-select-sm' });
    pSelect.innerHTML = '<option value="">-- No Profile Selected --</option>';
    profiles.forEach(p => pSelect.innerHTML += `<option value="${p.id}">${p.profile_name}</option>`);

    pSelect.onchange = () => {
      const pid = pSelect.value;
      activeProfileData = pid ? (profiles.find(x => x.id == pid)?.profile_data || {}) : {};
      if (Store.state.selectedTemplate) {
        renderVars(Store.state.selectedTemplate);
        if (pid) toast('Profile data applied', 'success');
      }
    };

    pGroup.append(pLabel, pSelect);
    body.append(pGroup);
  }

  // 2. Template Selector
  const selectGroup = h('div', { class: 'mb-3' },
    h('label', { for: 'genTemplate', class: 'form-label fw-bold' }, '2. Prompt Template'),
    h('select', { class: 'form-select cosmic-input', id: 'genTemplate', 'data-name': 'generate-template-select' },
      h('option', { value: '' }, 'Select a template…'),
      state.templates
        .filter(t => t.template_name?.toLowerCase().includes(Store.state.searchQuery))
        .map(t => h('option', { value: t.id }, t.template_name))
    )
  );

  const variablesContainer = h('div', { id: 'genVars', class: 'row g-3' });
  const actionsRow = h('div', { class: 'd-flex gap-2' });
  const genBtn = h('button', { class: 'btn btn-primary cosmic-btn', id: 'genBtn', 'data-ripple': '', 'data-name': 'generate-btn' }, h('i', { class: 'bi bi-magic me-1' }), 'Generate');
  const resetBtn = h('button', { class: 'btn btn-outline-light cosmic-btn', 'data-ripple': '', 'data-name': 'generate-reset-btn' }, h('i', { class: 'bi bi-arrow-counterclockwise me-1' }), 'Reset');

  actionsRow.append(genBtn, resetBtn);

  body.append(selectGroup, variablesContainer, actionsRow);
  card.append(body);

  const outCard = h('div', { class: 'card card-surface mt-3', id: 'outputCard', style: 'display:none;', 'data-name': 'generate-output-card' });
  const outBody = h('div', { class: 'card-body' },
    h('div', { class: 'd-flex justify-content-between align-items-center mb-2 flex-wrap gap-2' },
      h('h5', { class: 'mb-0 text-white' }, 'Generated Prompt'),
      h('div', { class: 'd-flex gap-2 align-items-center flex-wrap' },
        h('button', { class: 'btn btn-outline-light btn-sm cosmic-btn', id: 'copyBtn', 'data-ripple': '' }, h('i', { class: 'bi bi-clipboard me-1' }), 'Copy'),
        h('select', { class: 'form-select form-select-sm cosmic-input', id: 'aiProviderSelect', style: 'width:auto;min-width:130px;', 'data-name': 'generate-ai-provider-select' },
          h('option', { value: 'claude' }, 'Claude'),
          h('option', { value: 'openai' }, 'OpenAI'),
          h('option', { value: 'gemini' }, 'Gemini')
        ),
        h('button', { class: 'btn btn-success btn-sm cosmic-btn', id: 'sendToAiBtn', 'data-ripple': '', 'data-name': 'generate-send-ai-btn' },
          h('i', { class: 'bi bi-send me-1' }), 'Send to AI Tool'
        )
      )
    ),
    h('div', { class: 'generated-out', id: 'generatedOut', role: 'region', 'aria-live': 'polite', style: 'white-space:pre-wrap;font-family:\'JetBrains Mono\',monospace;font-size:0.88rem;line-height:1.7;' })
  );
  outCard.append(outBody);

  // AI Response card
  const aiCard = h('div', { class: 'card card-surface mt-3', id: 'aiResponseCard', style: 'display:none;', 'data-name': 'generate-ai-response-card' });
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
    // Pre-fill from active profile if available
    if (activeProfileData[variable.variable_name]) {
      input.value = activeProfileData[variable.variable_name];
    }
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

    // Render output: parse {{terminal blocks}} into click-to-copy chips
    const outEl = $('#generatedOut');
    outEl.innerHTML = '';
    renderPromptOutput(prompt, outEl);

    $('#outputCard').style.display = '';
    try {
      await api.post('history.php', {
        template_id: t.id, template_name: t.template_name,
        generated_prompt: prompt, variable_data: variableData
      });
      const now = new Date().toISOString();
      const optimistic = { type: 'prompt', template_id: t.id, template_name: t.template_name, generated_prompt: prompt, variable_data: variableData, created_at: now };
      Store.set({ history: [optimistic, ...Store.state.history] });
      api.templateAction({ action: 'increment_use', id: t.id }).catch(() => { });
    } catch (e) { console.warn('Failed to save to history:', e); }
    toast('Prompt generated!', 'success');
  });

  $('#copyBtn').addEventListener('click', async () => {
    // Copy only the plain-text content (strip click-to-copy UI chrome)
    const text = Array.from($('#generatedOut').childNodes)
      .map(n => n.nodeType === 3 ? n.textContent : (n.dataset && n.dataset.cmd ? n.dataset.cmd : n.textContent))
      .join('');
    try { await navigator.clipboard.writeText(text); toast('Copied to clipboard', 'success'); }
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
        credentials: 'same-origin',
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

  // ── State ────────────────────────────────────────────────────────────────
  let sortKey = 'created_at';
  let sortDir = -1; // -1 = newest first
  let filterText = '';
  let filterCategory = 'all';
  let selectedIds = new Set();

  // ── Category color palette ────────────────────────────────────────────────
  const CATEGORY_COLORS = {
    'Content': { bg: '#7c3aed', text: '#fff', emoji: '\uD83D\uDCDD' }, // violet
    'Schema': { bg: '#0891b2', text: '#fff', emoji: '\uD83D\uDCCA' }, // teal
    'QA': { bg: '#059669', text: '#fff', emoji: '\u2714' }, // emerald
    'Coding': { bg: '#ea580c', text: '#fff', emoji: '\uD83D\uDCBB' }, // orange
    'Rich Media': { bg: '#db2777', text: '#fff', emoji: '\uD83C\uDF9E' }, // pink
    'Ungrouped': { bg: '#475569', text: '#fff', emoji: '\uD83D\uDCCE' }, // slate
    'all': { bg: '#2563eb', text: '#fff', emoji: '\uD83D\uDCCB' }, // blue
  };
  const getCatStyle = (cat) => CATEGORY_COLORS[cat] || { bg: '#6c757d', text: '#fff', emoji: '' };

  // ── Header ────────────────────────────────────────────────────────────────
  root.appendChild(h('div', { class: 'd-flex align-items-center justify-content-between mb-3 flex-wrap gap-2' },
    h('h2', { class: 'mb-0 text-gradient' }, h('i', { class: 'bi bi-file-earmark-text me-2' }), 'Templates'),
    h('div', { class: 'd-flex gap-2 flex-wrap' },
      h('button', { class: 'btn btn-outline-info cosmic-btn btn-sm', id: 'importTplBtn' },
        h('i', { class: 'bi bi-upload me-1' }), 'Import'
      ),
      h('button', { class: 'btn btn-outline-info cosmic-btn btn-sm', id: 'exportTplBtn' },
        h('i', { class: 'bi bi-download me-1' }), 'Export'
      ),
      h('a', { href: '#/generate', class: 'btn btn-outline-light cosmic-btn btn-sm' },
        h('i', { class: 'bi bi-magic me-1' }), 'Go to Generate'
      )
    )
  ));

  // ── Creator Card ────────────────────────────────────────────────────────
  const card = h('div', { class: 'card card-surface mb-3' });
  const body = h('div', { class: 'card-body' });
  body.appendChild(h('h5', { class: 'mb-3' }, h('i', { class: 'bi bi-plus-circle me-2' }), 'Create New Template'));

  const form = h('form', { id: 'tplForm' });
  const nameRow = h('div', { class: 'row g-3 mb-3' },
    h('div', { class: 'col-md-8' },
      h('label', { for: 'tplName', class: 'form-label fw-bold' }, 'Template Name'),
      h('input', { class: 'form-control cosmic-input', id: 'tplName', required: true, placeholder: 'e.g. Email Writer, Story Idea Generator' })
    ),
    h('div', { class: 'col-md-4' },
      h('label', { class: 'form-label fw-bold' }, 'Category'),
      (() => {
        const sel = h('select', { class: 'form-select cosmic-input', id: 'tplCategory' });
        sel.appendChild(h('option', { value: '' }, '— No category —'));
        ['Content', 'Schema', 'QA', 'Coding', 'Rich Media'].forEach(c =>
          sel.appendChild(h('option', { value: c }, c))
        );
        return sel;
      })()
    )
  );

  // Group row
  const groupColors = [
    { name: 'Rose', value: '#e11d48' }, { name: 'Orange', value: '#ea580c' },
    { name: 'Amber', value: '#d97706' }, { name: 'Lime', value: '#65a30d' },
    { name: 'Emerald', value: '#059669' }, { name: 'Teal', value: '#0891b2' },
    { name: 'Blue', value: '#2563eb' }, { name: 'Violet', value: '#7c3aed' },
    { name: 'Pink', value: '#db2777' }, { name: 'Slate', value: '#475569' }
  ];
  const groupSwatches = h('div', { class: 'd-flex flex-wrap gap-1 align-items-center' });
  groupColors.forEach((c, i) => {
    const radio = h('input', { type: 'radio', name: 'tplGroupColor', value: c.value, class: 'visually-hidden', id: 'tplGc_' + i });
    if (i === 6) radio.defaultChecked = true; // default: Blue
    const swatch = h('span', {
      title: c.name,
      style: `display:inline-block;width:24px;height:24px;border-radius:50%;background:${c.value};` +
        `border:${i === 6 ? '3px solid var(--accent)' : '2px solid transparent'};cursor:pointer;transition:border .15s`
    });
    swatch.addEventListener('click', () => {
      radio.checked = true;
      groupSwatches.querySelectorAll('span[title]').forEach(s => { s.style.border = '2px solid transparent'; });
      swatch.style.border = '3px solid var(--accent)';
    });
    groupSwatches.appendChild(h('label', { for: 'tplGc_' + i, style: 'cursor:pointer;margin:0' }, radio, swatch));
  });

  const groupRow = h('div', { class: 'row g-3 mb-3' },
    h('div', { class: 'col-md-6' },
      h('label', { class: 'form-label fw-bold' }, 'Group Name ', h('span', { class: 'text-muted fw-normal' }, '(optional)')),
      h('input', { class: 'form-control cosmic-input', id: 'tplGroupName', placeholder: 'e.g. Marketing Templates' })
    ),
    h('div', { class: 'col-md-6' },
      h('label', { class: 'form-label fw-bold' }, 'Group Color'),
      groupSwatches
    )
  );

  // ── Prompt Text Group with toolbar ───────────────────────────────────────
  const tplTextarea = h('textarea', {
    id: 'tplText', class: 'form-control cosmic-input font-monospace', rows: '10', required: true,
    placeholder: 'Write your prompt using [variable-names] for dynamic fields…\n\nFor click-to-copy terminal commands, wrap them like:\n{{CREATE DATABASE [databaseName];}}'
  });

  // "Wrap as Terminal Command" toolbar button
  const wrapCmdBtn = h('button', {
    type: 'button',
    class: 'btn btn-sm cosmic-btn',
    style: 'background:rgba(6,182,212,0.5); border:1px solid rgba(255,255,255,0.9); color:#fff !important; margin-left:5px;',
    title: 'Select text in the prompt, then click to wrap it as a click-to-copy terminal command block'
  },
    h('i', { class: 'bi bi-terminal me-1' }), 'Wrap as Terminal Command'
  );

  wrapCmdBtn.addEventListener('click', () => {
    const ta = tplTextarea;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const sel = ta.value.substring(start, end).trim();
    if (!sel) {
      toast('Select text in the prompt first, then click "Wrap as Terminal Command"', 'warning');
      return;
    }
    // If already wrapped, unwrap
    if (sel.startsWith('{{') && sel.endsWith('}}')) {
      const inner = sel.slice(2, -2);
      ta.setRangeText(inner, start, end, 'select');
      toast('Removed terminal command wrapper', 'info');
    } else {
      ta.setRangeText('{{' + sel + '}}', start, end, 'select');
      toast('Text wrapped as terminal command — variables inside still work!', 'success');
    }
    ta.focus();
    ta.dispatchEvent(new Event('input'));
  });

  const textGroup = h('div', { class: 'mb-3' },
    h('label', { for: 'tplText', class: 'form-label fw-bold' }, 'Prompt Text'),
    // Toolbar above textarea
    h('div', {
      class: 'd-flex align-items-center gap-2 mb-0 p-2',
      style: 'background:#000 !important; color:#fff !important; border:1px solid rgba(255,255,255,0.15); border-top-left-radius: 15px; border-top-right-radius: 15px;'
    },
      // "Toolbar:" Label
      h('span', { class: 'small me-1 fw-bold', style: 'color:#fff !important;' },
        h('i', { class: 'bi bi-tools me-1' }),
        'Toolbar:'
      ),
      // Wrap as Terminal Command Button (reuse the already-wired element)
      wrapCmdBtn,
      // Help Text and Variable Button
      h('span', { class: 'small ms-2', style: 'color:#fff !important;' },
        'Select text → click to wrap in ',
        h('button', {
          id: 'toolbarWrapVarBtn',
          type: 'button',
          class: 'btn btn-sm cosmic-btn',
          style: 'background:rgba(6,182,212,0.5); border:1px solid rgba(255,255,255,0.9); color:#fff !important; margin-left:5px;',
          title: 'Select text in the prompt, then click to wrap it as a variable input for the prompt'
        },
          '{{…}}'
        )
      )
    ),
    tplTextarea,
    // Syntax guide
    h('div', { class: 'content-box-hover floating d-flex flex-column justify-content-center', style: 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 1.25rem; box-shadow: 0 15px 35px rgba(0,0,0,0.2), 0 5px 15px rgba(0,0,0,0.1); transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); border: 1px solid rgba(255, 255, 255, 0.2); backdrop-filter: blur(10px); padding: 2.5rem; max-width: 600px; width: 100%; color: white; ' },
      h('h4', { class: 'fw-bold mb-4 border-bottom pb-3 border-opacity-25 border-light' },
        h('i', { class: 'fas fa-terminal me-2' }),
        ' Syntax Guide'
      ),
      h('div', { class: 'mb-1' },
        h('p', { class: 'mb-0 fw-medium ms-1', style: 'font-size: 20px;' },
          h('strong', {}, '#1 '),
          ' Dynamic field (replaced when user clicks Generate)'
        ),
        h('span', { class: 'badge bg-dark text-light fs-6 mb-2 rounded-pill px-3 py-2 shadow-sm border border-secondary border-opacity-50' }, '[variable]')
      ),
      h('hr', {}),
      h('div', { class: 'mb-1' },
        h('p', { class: 'mb-0 fw-medium', style: 'font-size: 20px;' },
          h('strong', {}, '#2 '),
          ' Click-to-copy terminal block in the output'
        ),
        h('div', { class: 'terminal-hover click-to-copy mb-2', 'data-clipboard': '{{terminal command here}}', style: 'background: #1e1e1e; color: #00ff00; font-family: \'Courier New\', Courier, monospace; padding: 12px 18px; border-radius: 0.5rem; cursor: pointer; transition: all 0.3s ease; position: relative; overflow: hidden; border: 1px solid rgba(0,255,0,0.2); box-shadow: inset 0 2px 10px rgba(0,0,0,0.5); word-wrap: break-word;' },
          '{{terminal command here}}',
          h('i', { class: 'fas fa-copy float-end mt-1 text-muted' })
        )
      ),
      h('hr', {}),
      h('div', {},
        h('p', { class: 'mb-0 fw-medium ms-1', style: 'font-size: 20px;' },
          h('strong', {}, '#3 '),
          'Variables work inside terminal blocks too'
        ),
        h('div', { class: 'terminal-hover click-to-copy mb-2', 'data-clipboard': '{{CREATE DATABASE [databaseName];}}', style: 'background: #1e1e1e; color: #00ff00; font-family: \'Courier New\', Courier, monospace; padding: 12px 18px; border-radius: 0.5rem; cursor: pointer; transition: all 0.3s ease; position: relative; overflow: hidden; border: 1px solid rgba(0,255,0,0.2); box-shadow: inset 0 2px 10px rgba(0,0,0,0.5); word-wrap: break-word;' },
          '{{CREATE DATABASE ',
          h('span', { style: 'color: #ff9d00;' }, '[databaseName]'),
          ';}}',
          h('i', { class: 'fas fa-copy float-end mt-1 text-muted' })
        )
      )
    )
  );

  // Wire up the {{…}} variable-wrap button in the toolbar
  textGroup.querySelector('#toolbarWrapVarBtn').addEventListener('click', () => {
    const ta = tplTextarea;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const sel = ta.value.substring(start, end).trim();
    if (!sel) {
      toast('Select text in the prompt first, then click "{{…}}" to wrap it as a variable', 'warning');
      return;
    }
    if (sel.startsWith('[') && sel.endsWith(']')) {
      const inner = sel.slice(1, -1);
      ta.setRangeText(inner, start, end, 'select');
      toast('Removed variable wrapper', 'info');
    } else {
      ta.setRangeText('[' + sel + ']', start, end, 'select');
      toast('Text wrapped as variable — will be replaced when prompt is generated!', 'success');
    }
    ta.focus();
    ta.dispatchEvent(new Event('input'));
  });

  // Privacy toggle row
  const privacyRow = h('div', { class: 'mb-3' },
    h('label', { class: 'form-label fw-bold mb-2' }, h('i', { class: 'bi bi-shield-lock me-1' }), 'Visibility'),
    h('div', { class: 'd-flex align-items-center gap-3 p-3 rounded glass-brd' },
      h('div', { class: 'form-check form-switch mb-0' },
        h('input', { class: 'form-check-input', type: 'checkbox', role: 'switch', id: 'tplIsPublic', style: 'width:2.5em;height:1.3em;' }),
        h('label', { class: 'form-check-label fw-semibold ms-2', for: 'tplIsPublic' }, 'Public Prompt')
      ),
      h('span', { class: 'text-muted small', id: 'tplVisibilityHint' }, '🔒 Private — only visible to you')
    )
  );
  // Update hint text when toggle changes
  (() => {
    const toggle = privacyRow.querySelector('#tplIsPublic');
    const hint = privacyRow.querySelector('#tplVisibilityHint');
    toggle.addEventListener('change', () => {
      hint.textContent = toggle.checked
        ? '🌐 Public — visible and usable by all users'
        : '🔒 Private — only visible to you';
    });
  })();

  const parseBtn = h('button', { type: 'button', class: 'btn btn-info cosmic-btn', id: 'parseBtn', 'data-ripple': '' },
    h('i', { class: 'bi bi-search me-1' }), 'Parse variables'
  );

  const configSection = h('div', { id: 'varConfig', style: 'display:none;' },
    h('hr'),
    h('h5', {}, 'Configure Variables'),
    h('p', { class: 'text-secondary' }, 'Define labels and input types for each detected variable.'),
    h('div', { id: 'varConfigContainer' }),
    h('div', { class: 'd-flex gap-2 mt-3 justify-content-end' },
      h('button', { type: 'button', class: 'btn btn-secondary cosmic-btn', id: 'cancelCfg', 'data-ripple': '' },
        h('i', { class: 'bi bi-x-circle me-1' }), 'Cancel'
      ),
      h('button', { type: 'button', class: 'btn btn-success cosmic-btn', id: 'saveTpl', 'data-ripple': '' },
        h('i', { class: 'bi bi-save me-1' }), 'Save Template'
      )
    )
  );

  form.append(nameRow, groupRow, textGroup, privacyRow, parseBtn, configSection);
  body.append(form);
  card.append(body);
  root.appendChild(card);

  // ── Existing Templates Card ──────────────────────────────────────────────
  const listCard = h('div', { class: 'card card-surface' });
  const listBody = h('div', { class: 'card-body' });

  // Header row
  const listHeaderRow = h('div', { class: 'd-flex justify-content-between align-items-center mb-3 flex-wrap gap-2' },
    h('h5', { class: 'mb-0' },
      h('i', { class: 'bi bi-table me-2' }), 'Existing Templates ',
      h('span', { class: 'badge text-bg-secondary', id: 'tplCountBadge' }, '0 total')
    ),
    h('div', { class: 'd-flex gap-2 flex-wrap align-items-center', id: 'bulkActionsBar', style: 'display:none!important' },
      h('span', { class: 'badge bg-primary', id: 'selectedCountBadge' }, '0 selected'),
      h('div', { class: 'btn-group' },
        h('button', { class: 'btn btn-sm btn-outline-warning cosmic-btn', id: 'bulkCategoryBtn' },
          h('i', { class: 'bi bi-tag me-1' }), 'Set Category'
        ),
        h('button', { class: 'btn btn-sm btn-outline-info cosmic-btn', id: 'bulkGroupBtn' },
          h('i', { class: 'bi bi-collection me-1' }), 'Create Group'
        ),
        h('button', { class: 'btn btn-sm btn-outline-info cosmic-btn', id: 'bulkExportBtn' },
          h('i', { class: 'bi bi-download me-1' }), 'Export Selected'
        ),
        h('button', { class: 'btn btn-sm btn-outline-danger cosmic-btn', id: 'bulkDeleteBtn' },
          h('i', { class: 'bi bi-trash me-1' }), 'Delete Selected'
        ),
        h('button', { class: 'btn btn-sm btn-outline-secondary cosmic-btn', id: 'clearSelBtn' }, 'Clear')
      )
    )
  );

  // Filter row
  const filterRow = h('div', { class: 'd-flex gap-2 mb-3 flex-wrap align-items-center' });
  const filterInput = h('input', {
    type: 'search', class: 'form-control cosmic-input', id: 'tplFilter',
    placeholder: '\uD83D\uDD0D Filter by name, variable, category…', style: 'max-width:340px;'
  });
  filterRow.appendChild(filterInput);

  // Category pill buttons
  const catPills = h('div', { class: 'd-flex gap-1 flex-wrap' });
  ['all', 'Content', 'Schema', 'QA', 'Coding', 'Rich Media', 'Ungrouped'].forEach(cat => {
    const cs = getCatStyle(cat);
    const isActive = cat === 'all'; // default active
    const btn = h('button', {
      class: 'btn btn-sm cosmic-btn cat-pill',
      'data-cat': cat,
      style: isActive
        ? `background:${cs.bg};color:${cs.text};border-color:${cs.bg}`
        : `background:transparent;color:${cs.bg};border:1px solid ${cs.bg}`
    }, cs.emoji + '\u00A0' + (cat === 'all' ? 'All' : cat));
    catPills.appendChild(btn);
  });
  filterRow.appendChild(catPills);

  // Track active pill for re-styling on click (stored on the container)
  catPills._activeCat = 'all';

  // Table
  const tableWrap = h('div', { class: 'table-responsive' });
  const table = h('table', { class: 'table table-hover align-middle', id: 'tplTable' });

  // Build thead with sort headers
  const sortCols = [
    { key: 'select', label: h('input', { type: 'checkbox', class: 'form-check-input', id: 'selectAll' }), nosort: true, width: '30px' },
    { key: 'template_name', label: 'Name' },
    { key: 'category', label: 'Category' },
    { key: 'group_name', label: 'Group' },
    { key: 'use_count', label: 'Uses' },
    { key: 'is_public', label: 'Visibility', nosort: true },
    { key: 'created_at', label: 'Created' },
    { key: 'actions', label: '', nosort: true, width: '120px' },
  ];
  const thead = h('thead');
  const headRow = h('tr');
  sortCols.forEach(col => {
    const th = h('th', {});
    if (col.width) th.style.width = col.width;
    if (col.nosort) {
      if (typeof col.label === 'string') th.textContent = col.label;
      else th.appendChild(col.label);
    } else {
      const btn = h('button', { class: 'btn btn-link text-white p-0 fw-bold text-decoration-none sort-header', 'data-key': col.key },
        col.label, h('i', { class: 'bi bi-arrow-down-up ms-1 opacity-50', id: 'sort-icon-' + col.key })
      );
      btn.addEventListener('click', () => {
        if (sortKey === col.key) { sortDir *= -1; } else { sortKey = col.key; sortDir = 1; }
        renderTemplateList();
      });
      th.appendChild(btn);
    }
    headRow.appendChild(th);
  });
  thead.appendChild(headRow);

  const tbody = h('tbody', { id: 'tplTbody' });
  table.append(thead, tbody);
  tableWrap.appendChild(table);

  listBody.append(listHeaderRow, filterRow, tableWrap);
  listCard.appendChild(listBody);
  root.appendChild(listCard);

  // ── Render Template List ─────────────────────────────────────────────────
  function renderTemplateList() {
    const q = filterText.toLowerCase();
    let items = Store.state.templates.filter(t => {
      if (filterCategory === 'Ungrouped') return !t.category;
      if (filterCategory !== 'all') return t.category === filterCategory;
      return true;
    }).filter(t => {
      if (!q) return true;
      return (t.template_name || '').toLowerCase().includes(q)
        || (t.category || '').toLowerCase().includes(q)
        || (t.group_name || '').toLowerCase().includes(q);
    });

    // Sort
    items = items.slice().sort((a, b) => {
      let va = a[sortKey] ?? '', vb = b[sortKey] ?? '';
      if (sortKey === 'created_at') { va = new Date(va); vb = new Date(vb); }
      if (sortKey === 'use_count') { va = Number(va); vb = Number(vb); }
      if (va < vb) return -1 * sortDir;
      if (va > vb) return 1 * sortDir;
      return 0;
    });

    // Update sort icons
    sortCols.filter(c => !c.nosort).forEach(col => {
      const icon = document.getElementById('sort-icon-' + col.key);
      if (!icon) return;
      if (sortKey === col.key) {
        icon.className = 'bi ms-1 ' + (sortDir > 0 ? 'bi-arrow-up' : 'bi-arrow-down');
        icon.classList.remove('opacity-50');
      } else {
        icon.className = 'bi bi-arrow-down-up ms-1 opacity-50';
      }
    });

    // Count badge
    const badge = document.getElementById('tplCountBadge');
    if (badge) badge.textContent = items.length + ' of ' + Store.state.templates.length;

    tbody.innerHTML = '';
    if (!items.length) {
      tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted py-4">No templates found.</td></tr>';
      return;
    }

    items.forEach(t => {
      const isSelected = selectedIds.has(t.id);
      const tr = h('tr', { class: isSelected ? 'table-active' : '' });

      // Checkbox
      const cb = h('input', { type: 'checkbox', class: 'form-check-input tpl-checkbox', 'data-id': String(t.id) });
      cb.checked = isSelected;
      cb.addEventListener('change', () => {
        if (cb.checked) { selectedIds.add(t.id); } else { selectedIds.delete(t.id); }
        updateBulkBar();
        tr.classList.toggle('table-active', cb.checked);
      });
      tr.appendChild(h('td', {}, cb));

      // Name + group dot
      const nameCell = h('td', {});
      if (t.group_name && t.group_color) {
        nameCell.appendChild(h('span', { class: 'me-1', style: `color:${t.group_color};font-size:0.9em;` }, '●'));
      }
      nameCell.appendChild(document.createTextNode(t.template_name));
      tr.appendChild(nameCell);

      // ── Category cell — click to change / clear ─────────────────────────
      const cs = getCatStyle(t.category);
      const catBadge = t.category
        ? h('span', { class: 'badge', style: `background:${cs.bg};color:${cs.text};cursor:pointer;` }, cs.emoji + '\u00A0' + t.category)
        : h('span', { class: 'text-muted small', style: 'cursor:pointer;text-decoration:underline dotted;' }, '＋ set category');
      const catCell = h('td', { title: 'Click to change category', style: 'position:relative;' }, catBadge);
      catCell.addEventListener('click', (e) => {
        e.stopPropagation();
        // Remove any open pickers
        document.querySelectorAll('.inline-cat-picker, .inline-grp-picker').forEach(el => el.remove());
        const picker = document.createElement('div');
        picker.className = 'inline-cat-picker';
        picker.style.cssText = 'position:absolute;z-index:9999;left:0;top:100%;min-width:170px;' +
          'background:#1e2235;border:1px solid rgba(255,255,255,0.15);border-radius:.5rem;padding:.4rem;box-shadow:0 8px 32px rgba(0,0,0,.5);';
        const allCats = [
          { v: '', l: '✕ Clear category' },
          { v: 'Content', l: '📝 Content' },
          { v: 'Schema', l: '📊 Schema' },
          { v: 'QA', l: '✔ QA' },
          { v: 'Coding', l: '💻 Coding' },
          { v: 'Rich Media', l: '🎞 Rich Media' },
          // Add custom categories
          ...[...new Set(Store.state.templates.map(x => x.category).filter(c => c && !['Content', 'Schema', 'QA', 'Coding', 'Rich Media'].includes(c)))]
            .sort().map(c => ({ v: c, l: c }))
        ];
        allCats.forEach(({ v, l }) => {
          const item = document.createElement('div');
          item.textContent = l;
          item.style.cssText = 'padding:.35rem .65rem;cursor:pointer;border-radius:.3rem;font-size:.84rem;' +
            (t.category === v ? 'font-weight:bold;background:rgba(255,255,255,0.08);' : '');
          item.addEventListener('mouseenter', () => item.style.background = 'rgba(255,255,255,0.1)');
          item.addEventListener('mouseleave', () => item.style.background = t.category === v ? 'rgba(255,255,255,0.08)' : '');
          item.addEventListener('click', async (ev) => {
            ev.stopPropagation();
            picker.remove();
            if (v === (t.category || '')) return; // No change
            try {
              await api.templateAction({
                action: 'bulk_category',
                ids: [t.id],
                category: v || null
              });
              t.category = v || null; // update local state
              const tpl = Store.state.templates.find(x => x.id === t.id);
              if (tpl) tpl.category = v || null;
              toast(v ? `Category set to "${v}"` : 'Category cleared', 'success');
              renderTemplateList();
            } catch (err) { toast('Update failed: ' + err.message, 'danger'); }
          });
          picker.appendChild(item);
        });
        catCell.appendChild(picker);
        const closePicker = (ev) => { if (!catCell.contains(ev.target)) { picker.remove(); document.removeEventListener('click', closePicker); } };
        setTimeout(() => document.addEventListener('click', closePicker), 0);
      });
      tr.appendChild(catCell);

      // ── Group cell — click to change / clear ────────────────────────────
      const grpEl = t.group_name
        ? h('span', { class: 'badge', style: `background:${t.group_color || '#6c757d'};color:#fff;cursor:pointer;`, title: 'Click to change group' }, t.group_name)
        : h('span', { class: 'text-muted small', style: 'cursor:pointer;text-decoration:underline dotted;' }, '＋ set group');
      const grpCell = h('td', { title: 'Click to change group', style: 'position:relative;' }, grpEl);
      grpCell.addEventListener('click', (e) => {
        e.stopPropagation();
        document.querySelectorAll('.inline-cat-picker, .inline-grp-picker').forEach(el => el.remove());

        const existingGroups = [...new Set(Store.state.templates.map(x => x.group_name).filter(Boolean))].sort();
        const colorList = [
          '#e11d48', '#ea580c', '#d97706', '#65a30d', '#059669', '#0891b2', '#2563eb', '#7c3aed', '#db2777', '#475569'
        ];
        let pendingColor = t.group_color || '#2563eb';

        const picker = document.createElement('div');
        picker.className = 'inline-grp-picker';
        picker.style.cssText = 'position:absolute;z-index:9999;left:0;top:100%;min-width:230px;' +
          'background:#1e2235;border:1px solid rgba(255,255,255,0.15);border-radius:.5rem;padding:.6rem;box-shadow:0 8px 32px rgba(0,0,0,.5);';

        // Clear option
        const clearItem = document.createElement('div');
        clearItem.textContent = '✕ Clear group';
        clearItem.style.cssText = 'padding:.35rem .65rem;cursor:pointer;border-radius:.3rem;font-size:.84rem;color:#f87171;margin-bottom:.3rem;';
        clearItem.addEventListener('mouseenter', () => clearItem.style.background = 'rgba(255,100,100,0.1)');
        clearItem.addEventListener('mouseleave', () => clearItem.style.background = '');
        clearItem.addEventListener('click', async (ev) => {
          ev.stopPropagation();
          picker.remove();
          try {
            await api.templateAction({ action: 'bulk_group', ids: [t.id], group_name: null, group_color: null });
            t.group_name = null; t.group_color = null;
            const tpl = Store.state.templates.find(x => x.id === t.id);
            if (tpl) { tpl.group_name = null; tpl.group_color = null; }
            toast('Group cleared', 'success');
            renderTemplateList();
          } catch (err) { toast('Update failed: ' + err.message, 'danger'); }
        });
        picker.appendChild(clearItem);

        // Name input with datalist
        const dlId = 'grpDl_' + t.id;
        const nameInp = document.createElement('input');
        nameInp.className = 'form-control form-control-sm cosmic-input mt-1';
        nameInp.placeholder = 'Group name…';
        nameInp.value = t.group_name || '';
        nameInp.setAttribute('list', dlId);
        nameInp.style.cssText = 'font-size:.82rem;margin-bottom:.4rem;';
        const dl = document.createElement('datalist');
        dl.id = dlId;
        existingGroups.forEach(g => { const o = document.createElement('option'); o.value = g; dl.appendChild(o); });
        picker.appendChild(nameInp);
        picker.appendChild(dl);

        // Color swatches
        const swRow = document.createElement('div');
        swRow.style.cssText = 'display:flex;flex-wrap:wrap;gap:4px;margin-bottom:.4rem;';
        colorList.forEach(clr => {
          const sw = document.createElement('span');
          sw.style.cssText = `display:inline-block;width:20px;height:20px;border-radius:50%;background:${clr};` +
            `border:${clr === pendingColor ? '2px solid #fff' : '2px solid transparent'};cursor:pointer;transition:border .12s;`;
          sw.addEventListener('click', (ev) => {
            ev.stopPropagation();
            pendingColor = clr;
            swRow.querySelectorAll('span').forEach(s => s.style.border = '2px solid transparent');
            sw.style.border = '2px solid #fff';
          });
          swRow.appendChild(sw);
        });
        picker.appendChild(swRow);

        // Apply button
        const applyBtn = document.createElement('button');
        applyBtn.className = 'btn btn-sm btn-primary w-100 cosmic-btn';
        applyBtn.textContent = 'Apply';
        applyBtn.style.fontSize = '.82rem';
        applyBtn.addEventListener('click', async (ev) => {
          ev.stopPropagation();
          const gName = nameInp.value.trim();
          if (!gName) { toast('Enter a group name', 'warning'); return; }
          picker.remove();
          try {
            await api.templateAction({ action: 'bulk_group', ids: [t.id], group_name: gName, group_color: pendingColor });
            t.group_name = gName; t.group_color = pendingColor;
            const tpl = Store.state.templates.find(x => x.id === t.id);
            if (tpl) { tpl.group_name = gName; tpl.group_color = pendingColor; }
            toast(`Group set to "${gName}"`, 'success');
            renderTemplateList();
          } catch (err) { toast('Update failed: ' + err.message, 'danger'); }
        });
        picker.appendChild(applyBtn);

        grpCell.appendChild(picker);
        nameInp.focus();
        const closeGrp = (ev) => { if (!grpCell.contains(ev.target)) { picker.remove(); document.removeEventListener('click', closeGrp); } };
        setTimeout(() => document.addEventListener('click', closeGrp), 0);
      });
      tr.appendChild(grpCell);


      // Use count
      const useEl = h('td', { class: 'text-center' },
        h('span', { class: 'badge ' + (t.use_count > 10 ? 'bg-success' : t.use_count > 0 ? 'bg-info text-dark' : 'text-bg-secondary') },
          t.use_count || 0
        )
      );
      tr.appendChild(useEl);

      // Visibility badge
      const isOwner = parseInt(t.is_owner) === 1;
      const isPublic = parseInt(t.is_public) === 1;
      const visBadge = isPublic
        ? h('span', { class: 'badge bg-success', title: 'Public — visible to all users' }, '🌐 Public')
        : h('span', { class: 'badge text-bg-secondary', title: 'Private — only visible to you' }, '🔒 Private');
      const ownerHint = !isOwner
        ? h('div', { class: 'small text-muted mt-1', style: 'font-size:0.7rem' }, '👤 ' + (t.owner_username || 'Other user'))
        : null;
      const visCell = h('td', { class: 'text-center' }, visBadge);
      if (ownerHint) visCell.appendChild(ownerHint);
      tr.appendChild(visCell);

      // Date
      const dateStr = t.created_at ? new Date(t.created_at).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' }) : '—';
      tr.appendChild(h('td', { class: 'text-muted small', style: 'white-space:nowrap' }, dateStr));

      // Actions — restrict edit/delete to owner only
      const actCell = h('td', {});
      const actDiv = h('div', { class: 'd-flex gap-1' });
      if (isOwner) {
        actDiv.appendChild(h('button', {
          class: 'btn btn-sm btn-outline-light cosmic-btn', title: 'Edit', 'data-ripple': '',
          onclick: () => openEditTemplateModal(t.id)
        }, h('i', { class: 'bi bi-pencil' })));
      }
      actDiv.appendChild(h('a', {
        href: '#/generate', class: 'btn btn-sm btn-outline-info cosmic-btn', title: 'Use in Generate',
        onclick: () => {
          setTimeout(() => {
            const sel = $('#genTemplate');
            if (sel) { sel.value = t.id; sel.dispatchEvent(new Event('change')); }
          }, 0);
        }
      }, h('i', { class: 'bi bi-play' })));
      if (isOwner) {
        actDiv.appendChild(h('button', {
          class: 'btn btn-sm btn-outline-danger cosmic-btn', title: 'Delete', 'data-ripple': '',
          onclick: async () => {
            const ok = await confirmDialog({ title: 'Delete template?', body: `Delete "${t.template_name}"? This cannot be undone.`, okText: 'Delete' });
            if (!ok) return;
            try {
              const result = await api.del('templates.php', `id=${encodeURIComponent(t.id)}`);
              if (result && result.success === false) throw new Error(result.error || 'Failed to delete');
              toast('Template deleted', 'success');
              await loadTemplates(true);
              selectedIds.delete(t.id);
              renderTemplateList();
            } catch (e) { toast('Delete failed: ' + e.message, 'danger'); }
          }
        }, h('i', { class: 'bi bi-trash' })));
      }
      actCell.appendChild(actDiv);
      tr.appendChild(actCell);

      tbody.appendChild(tr);
    });

    updateSelectAll();
  }

  function updateBulkBar() {
    const bar = document.getElementById('bulkActionsBar');
    const badge = document.getElementById('selectedCountBadge');
    if (!bar) return;
    if (selectedIds.size > 0) {
      bar.style.removeProperty('display');
      bar.style.display = 'flex';
    } else {
      bar.style.display = 'none';
    }
    if (badge) badge.textContent = selectedIds.size + ' selected';
  }

  function updateSelectAll() {
    const sa = document.getElementById('selectAll');
    if (!sa) return;
    const allVisible = [...tbody.querySelectorAll('.tpl-checkbox')];
    sa.checked = allVisible.length > 0 && allVisible.every(cb => cb.checked);
    sa.indeterminate = !sa.checked && allVisible.some(cb => cb.checked);
  }

  // Select all
  document.getElementById('selectAll')?.addEventListener('change', function () {
    tbody.querySelectorAll('.tpl-checkbox').forEach(cb => {
      cb.checked = this.checked;
      const id = parseInt(cb.dataset.id);
      if (this.checked) { selectedIds.add(id); } else { selectedIds.delete(id); }
      cb.closest('tr')?.classList.toggle('table-active', this.checked);
    });
    updateBulkBar();
  });

  // Filter input
  filterInput.addEventListener('input', () => { filterText = filterInput.value.trim(); renderTemplateList(); });

  // Category pills — colored active/inactive states
  document.querySelectorAll('.cat-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      filterCategory = btn.dataset.cat;
      // Re-style all pills
      document.querySelectorAll('.cat-pill').forEach(b => {
        const bcs = getCatStyle(b.dataset.cat);
        b.style.background = 'transparent';
        b.style.color = bcs.bg;
        b.style.borderColor = bcs.bg;
      });
      // Highlight active pill as filled
      const acs = getCatStyle(filterCategory);
      btn.style.background = acs.bg;
      btn.style.color = acs.text;
      btn.style.borderColor = acs.bg;
      renderTemplateList();
    });
  });

  // ── Bulk Actions ─────────────────────────────────────────────────────────
  document.getElementById('clearSelBtn')?.addEventListener('click', () => {
    selectedIds.clear();
    tbody.querySelectorAll('.tpl-checkbox').forEach(cb => { cb.checked = false; cb.closest('tr')?.classList.remove('table-active'); });
    updateBulkBar(); updateSelectAll();
  });

  document.getElementById('bulkCategoryBtn')?.addEventListener('click', async () => {
    if (!selectedIds.size) return;

    // Collect existing categories from the store for the dropdown
    const existingCats = [...new Set(
      Store.state.templates.map(t => t.category).filter(Boolean)
    )].sort();

    const bodyNode = h('div', {},
      h('label', { class: 'form-label fw-bold mb-2' },
        `Set category for ${selectedIds.size} template${selectedIds.size !== 1 ? 's' : ''}:`
      ),
      (() => {
        const sel = h('select', { class: 'form-select cosmic-input mt-1', id: 'bulkCatSel' });
        const opts = [
          ['', '— Remove / Clear category —'],
          ['Content', '📝 Content'],
          ['Schema', '📊 Schema'],
          ['QA', '✔ QA'],
          ['Coding', '💻 Coding'],
          ['Rich Media', '🎞 Rich Media'],
        ];
        // Add any custom categories already in the data
        existingCats.forEach(c => {
          if (!opts.some(([v]) => v === c)) opts.push([c, c]);
        });
        opts.forEach(([val, label]) => sel.appendChild(h('option', { value: val }, label)));
        return sel;
      })()
    );

    const ok = await confirmDialog({
      title: 'Set Category',
      body: bodyNode,
      okText: 'Apply',
      okClass: 'btn-primary'
    });
    if (!ok) return;
    // Read value from the node directly (it's still in DOM inside the dialog)
    const sel = bodyNode.querySelector('#bulkCatSel');
    const cat = sel ? sel.value : null;
    try {
      await api.templateAction({ action: 'bulk_category', ids: [...selectedIds], category: cat || null });
      toast(cat ? `Category set to "${cat}"` : 'Category cleared', 'success');
      await loadTemplates(true);
      renderTemplateList();
    } catch (e) { toast('Error: ' + e.message, 'danger'); }
  });

  document.getElementById('bulkGroupBtn')?.addEventListener('click', async () => {
    if (selectedIds.size < 1) { toast('Select at least 1 template', 'warning'); return; }
    const colorSwatches = [
      { name: 'Rose', value: '#e11d48' }, { name: 'Orange', value: '#ea580c' },
      { name: 'Amber', value: '#d97706' }, { name: 'Lime', value: '#65a30d' },
      { name: 'Emerald', value: '#059669' }, { name: 'Teal', value: '#0891b2' },
      { name: 'Blue', value: '#2563eb' }, { name: 'Violet', value: '#7c3aed' },
      { name: 'Pink', value: '#db2777' }, { name: 'Slate', value: '#475569' }
    ];

    // Collect existing group names for a datalist
    const existingGroups = [...new Set(
      Store.state.templates.map(t => t.group_name).filter(Boolean)
    )].sort();

    // ──  Track selected color in closure (fixes the global querySelector bug) ──
    let selectedColor = '#2563eb'; // default Blue

    const swatchRow = h('div', { class: 'd-flex flex-wrap gap-1 mt-1' });
    colorSwatches.forEach((c, idx) => {
      const swatch = h('span', {
        class: 'grp-swatch', title: c.name,
        style: `display:inline-block;width:28px;height:28px;border-radius:50%;background:${c.value};` +
          `border:${c.value === selectedColor ? '3px solid #fff' : '2px solid transparent'};cursor:pointer;transition:border .15s`
      });
      swatch.addEventListener('click', () => {
        selectedColor = c.value; // ← closure variable, no DOM query needed
        swatchRow.querySelectorAll('.grp-swatch').forEach(s => { s.style.border = '2px solid transparent'; });
        swatch.style.border = '3px solid #fff';
      });
      swatchRow.appendChild(swatch);
    });

    const datalistId = 'grpNameList_' + Date.now();
    const bodyNode = h('div', {},
      h('div', { class: 'mb-3' },
        h('label', { class: 'form-label fw-bold mb-1' },
          `Group name for ${selectedIds.size} template${selectedIds.size !== 1 ? 's' : ''}:`
        ),
        (() => {
          const inp = h('input', {
            class: 'form-control cosmic-input mt-1', id: 'bulkGroupName',
            placeholder: 'e.g. Marketing Templates', list: datalistId
          });
          const dl = h('datalist', { id: datalistId });
          existingGroups.forEach(g => dl.appendChild(h('option', { value: g })));
          return h('div', {}, inp, dl);
        })()
      ),
      h('div', {},
        h('label', { class: 'form-label fw-bold mb-1' }, 'Group Color:'),
        swatchRow
      )
    );

    const ok = await confirmDialog({
      title: 'Assign / Create Group',
      body: bodyNode,
      okText: 'Assign Group',
      okClass: 'btn-primary'
    });
    if (!ok) return;
    const nameInput = bodyNode.querySelector('#bulkGroupName');
    const groupName = nameInput ? nameInput.value.trim() : '';
    if (!groupName) { toast('Please enter a group name', 'warning'); return; }
    try {
      await api.templateAction({ action: 'bulk_group', ids: [...selectedIds], group_name: groupName, group_color: selectedColor });
      toast(`Group "${groupName}" assigned to ${selectedIds.size} template(s)`, 'success');
      await loadTemplates(true);
      renderTemplateList();
    } catch (e) { toast('Error: ' + e.message, 'danger'); }
  });


  document.getElementById('bulkExportBtn')?.addEventListener('click', async () => {
    if (!selectedIds.size) return;
    await doExport([...selectedIds]);
  });

  document.getElementById('bulkDeleteBtn')?.addEventListener('click', async () => {
    if (!selectedIds.size) return;
    const ok = await confirmDialog({
      title: 'Delete ' + selectedIds.size + ' templates?',
      body: 'This cannot be undone.',
      okText: 'Delete All'
    });
    if (!ok) return;
    try {
      await api.templateAction({ action: 'bulk_delete', ids: [...selectedIds] });
      toast('Deleted ' + selectedIds.size + ' templates', 'success');
      selectedIds.clear();
      await loadTemplates(true);
      renderTemplateList();
    } catch (e) { toast('Error: ' + e.message, 'danger'); }
  });

  // ── Export ────────────────────────────────────────────────────────────────
  async function doExport(ids) {
    try {
      const payload = ids ? { action: 'export', ids } : { action: 'export' };
      const res = await api.templateAction(payload);
      const blob = new Blob([JSON.stringify(res, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = h('a', { href: url, download: 'templates-export-' + new Date().toISOString().slice(0, 10) + '.json' });
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
      toast('Exported ' + res.templates.length + ' templates', 'success');
    } catch (e) { toast('Export failed: ' + e.message, 'danger'); }
  }

  document.getElementById('exportTplBtn')?.addEventListener('click', () => {
    if (selectedIds.size) doExport([...selectedIds]);
    else doExport(null);
  });

  // ── Import ────────────────────────────────────────────────────────────────
  document.getElementById('importTplBtn')?.addEventListener('click', () => {
    const inp = h('input', { type: 'file', accept: '.json', style: 'display:none' });
    document.body.appendChild(inp);
    inp.addEventListener('change', async () => {
      const file = inp.files[0];
      if (!file) { inp.remove(); return; }
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        const templates = data.templates || (Array.isArray(data) ? data : null);
        if (!templates) throw new Error('Invalid format — expected { templates: [...] }');
        const res = await api.templateAction({ action: 'import', templates });
        toast(`Imported ${res.imported} templates (${res.skipped} skipped as duplicates)`, 'success');
        await loadTemplates(true);
        renderTemplateList();
      } catch (e) { toast('Import failed: ' + e.message, 'danger'); }
      finally { inp.remove(); }
    });
    inp.click();
  });

  // ── Standard Marketing Templates (GitHub) ────────────────────────────────
  // Visible "Get Standard Templates" link
  root.appendChild(h('div', { class: 'text-center mt-3 mb-2' },
    h('a', {
      href: 'https://github.com/search?q=marketing+prompt+templates+json&type=repositories',
      target: '_blank', class: 'btn btn-sm btn-outline-secondary cosmic-btn'
    }, h('i', { class: 'bi bi-github me-1' }), 'Browse Standard Marketing Templates on GitHub')
  ));

  // ── Parse variables ──────────────────────────────────────────────────────
  let extractedVariables = [];

  $('#parseBtn').addEventListener('click', () => {
    const name = $('#tplName').value.trim();
    const text = $('#tplText').value.trim();
    if (!name) return toast('Please enter a template name', 'warning');
    if (!text) return toast('Please enter prompt text', 'warning');
    const regex = /\[([^\]]+)\]/g;
    extractedVariables = [...new Set(Array.from(text.matchAll(regex)).map(m => m[1]))];
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
    const category = $('#tplCategory')?.value || null;
    const groupName = $('#tplGroupName')?.value.trim() || null;
    const checkedColor = document.querySelector('input[name="tplGroupColor"]:checked');
    const groupColor = groupName ? (checkedColor?.value || '#2563eb') : null;
    const isPublic = document.getElementById('tplIsPublic')?.checked ? 1 : 0;
    if (!name || !text) return toast('Please fill in all required fields', 'warning');
    try {
      const variables = extractedVariables.map((varName, i) => {
        const label = $(`#label_${i}`).value.trim();
        const type = $(`#type_${i}`).value;
        if (!label) throw new Error(`Please provide a label for "${varName}"`);
        return { variable_name: varName, field_label: label, field_type: type };
      });
      const result = await api.post('templates.php', { template_name: name, prompt_text: text, category, group_name: groupName, group_color: groupColor, is_public: isPublic, variables });
      if (result && result.success === false) throw new Error(result.error || 'Failed to save template');
      toast('Template created!', 'success');
      $('#tplForm').reset();
      // Reset privacy toggle hint
      const tplHint = document.getElementById('tplVisibilityHint');
      if (tplHint) tplHint.textContent = '🔒 Private — only visible to you';
      $('#varConfig').style.display = 'none'; extractedVariables = [];
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

  // Re-render list on search update
  const unsub = Store.subscribe(() => renderTemplateList());
  const onHash = () => { window.removeEventListener('hashchange', onHash); unsub(); };
  window.addEventListener('hashchange', onHash);

  // Initial render
  renderTemplateList();
}

// History view

// --- Data Profiles ---
async function renderProfiles() {
  const root = $('#view-root');
  if (!root) return;
  root.innerHTML = '';

  // 1. Initial layout
  const header = h('div', { class: 'd-flex justify-content-between align-items-center mb-4 flex-wrap gap-2' },
    h('div', {},
      h('h3', { class: 'text-gradient mb-0' }, h('i', { class: 'bi bi-person-lines-fill me-2' }), 'Data Profiles'),
      h('p', { class: 'text-muted mb-0 small' }, 'Manage prepopulated data for your prompts')
    ),
    h('button', { class: 'btn btn-primary cosmic-btn', id: 'newProfileBtn' }, h('i', { class: 'bi bi-plus-lg me-1' }), 'New Profile')
  );

  const container = h('div', { class: 'row g-4' });
  const listCol = h('div', { class: 'col-md-4' });
  const listCard = h('div', { class: 'card h-100 glass' });
  const listHeader = h('div', { class: 'card-header bg-transparent border-bottom glass-brd fw-bold' }, 'Your Profiles');
  const listBody = h('div', { class: 'list-group list-group-flush', id: 'profilesList' });

  listCard.append(listHeader, listBody);
  listCol.append(listCard);

  const formCol = h('div', { class: 'col-md-8' });
  const formCard = h('div', { class: 'card h-100 glass' });

  // Form container: initially show placeholder or form
  const formBody = h('div', { class: 'card-body', id: 'profileFormContainer' });
  formBody.innerHTML = '<div class="text-center text-muted py-5"><i class="bi bi-arrow-left me-2"></i>Select a profile to edit</div>';

  formCard.append(formBody);
  formCol.append(formCard);

  container.append(listCol, formCol);
  root.append(header, container);

  // 2. State & Data Loading
  let profiles = [];
  let masterVariables = [];
  let currentProfileId = null;

  try {
    const [pRes, vRes] = await Promise.all([
      api.get('profiles.php'),
      api.get('profiles.php?action=variables')
    ]);
    profiles = pRes || [];
    masterVariables = vRes || [];
    renderProfileList();
  } catch (e) {
    toast('Error loading profile data: ' + e.message, 'danger');
  }

  // 3. Render List
  function renderProfileList() {
    listBody.innerHTML = '';
    if (!profiles.length) {
      listBody.innerHTML = '<div class="text-center p-3 text-muted small">No profiles yet.</div>';
      return;
    }
    profiles.forEach(p => {
      const item = h('button', {
        class: `list-group-item list-group-item-action ${p.id === currentProfileId ? 'active' : ''}`,
        type: 'button'
      }, p.profile_name);
      item.onclick = () => loadProfileForm(p.id);
      listBody.append(item);
    });
  }

  // 4. Load Form
  function loadProfileForm(id) {
    currentProfileId = id;
    renderProfileList(); // update active state

    const isNew = (id === 'new');
    const data = isNew ? {} : (profiles.find(p => p.id === id)?.profile_data || {});
    const name = isNew ? '' : (profiles.find(p => p.id === id)?.profile_name || '');

    formBody.innerHTML = '';

    // Header
    const title = h('h5', { class: 'card-title mb-4 border-bottom pb-2' }, isNew ? 'Create New Profile' : `Edit: ${name}`);
    formBody.append(title);

    // Form
    const form = h('form', { id: 'profileForm' });

    // Name field
    const nameGroup = h('div', { class: 'mb-4' });
    nameGroup.append(
      h('label', { class: 'form-label fw-bold' }, 'Profile Name'),
      h('input', {
        type: 'text',
        class: 'form-control cosmic-input',
        id: 'profileName',
        value: name,
        required: true,
        placeholder: 'e.g. My Website, Client A, Marketing Campaign...'
      })
    );
    form.append(nameGroup);

    // Variables fields
    if (masterVariables.length > 0) {
      const varsContainer = h('div', { class: 'row g-3' });
      const varsLabel = h('h6', { class: 'mb-2 text-muted uppercase small fw-bold' }, 'Default Values for Prompt Variables');
      form.append(varsLabel, varsContainer);

      masterVariables.forEach(v => {
        const fieldVal = data[v.variable_name] || '';
        const col = h('div', { class: 'col-md-6' });
        col.append(
          h('label', { class: 'form-label small mb-1' }, v.field_label || formatLabel(v.variable_name)),
          h(v.field_type === 'textarea' ? 'textarea' : 'input', {
            class: 'form-control cosmic-input form-control-sm',
            name: v.variable_name,
            rows: v.field_type === 'textarea' ? 2 : 1,
            value: fieldVal,
            placeholder: `Default for [${v.variable_name}]`
          })
        );
        varsContainer.append(col);
      });
    } else {
      form.append(h('div', { class: 'alert alert-info small' }, 'No variables found in any templates yet. Create templates first to populate this form.'));
    }

    // Actions
    const actions = h('div', { class: 'd-flex justify-content-end gap-2 mt-4 pt-3 border-top' });

    if (!isNew) {
      const delBtn = h('button', { type: 'button', class: 'btn btn-outline-danger', id: 'delProfileBtn' },
        h('i', { class: 'bi bi-trash me-1' }), 'Delete Profile'
      );
      delBtn.onclick = async () => {
        if (!confirm('Are you sure you want to delete this profile?')) return;
        try {
          await api.del(`profiles.php?id=${id}`);
          toast('Profile deleted', 'success');
          profiles = profiles.filter(p => p.id !== id);
          currentProfileId = null;
          renderProfileList();
          formBody.innerHTML = '<div class="text-center text-muted py-5"><i class="bi bi-arrow-left me-2"></i>Select a profile to edit</div>';
        } catch (e) {
          toast(e.message, 'danger');
        }
      };
      actions.append(delBtn);
    }

    const saveBtn = h('button', { type: 'submit', class: 'btn btn-success cosmic-btn' },
      h('i', { class: 'bi bi-save me-1' }), 'Save Profile'
    );
    actions.append(saveBtn);
    form.append(actions);

    form.onsubmit = async (e) => {
      e.preventDefault();
      const newName = $('#profileName').value.trim();
      if (!newName) return toast('Profile name required', 'warning');

      const formData = new FormData(form);
      const profileData = {};
      masterVariables.forEach(v => {
        const val = form.elements[v.variable_name]?.value.trim();
        if (val) profileData[v.variable_name] = val;
      });

      try {
        const payload = { profile_name: newName, profile_data: profileData };
        if (!isNew) payload.id = id;

        const res = await api[isNew ? 'post' : 'put']('profiles.php', payload);
        toast('Profile saved successfully', 'success');

        // Reload profiles to get ID / updated data
        const freshProfiles = await api.get('profiles.php');
        profiles = freshProfiles || [];
        // If new, switch to it or try to find by name
        const savedId = res.id || (!isNew ? id : profiles.find(p => p.profile_name === newName)?.id);
        if (savedId) currentProfileId = savedId;

        renderProfileList();
        loadProfileForm(currentProfileId);
      } catch (err) {
        toast('Save failed: ' + err.message, 'danger');
      }
    };

    formBody.append(form);
  }

  // 5. Handlers
  $('#newProfileBtn').onclick = () => loadProfileForm('new');
}

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
// ─── Schema Generator ──────────────────────────────────────────────────────
async function renderSchemaGen() {
  const root = $('#view-root');
  if (!root) return;
  root.innerHTML = '';

  // ── Load saved prompt templates ──────────────────────────────────────────
  const defaultMarkdownTpl = 'Analyze the following webpage content and generate comprehensive, advanced JSON-LD structured data (Schema.org markup). Include all relevant schema types, properties, and nested entities. Output ONLY valid JSON-LD wrapped in <script type="application/ld+json"> tags.\n\nWebpage Content:\n[PAGE_MARKDOWN]';
  const defaultUrlTpl = 'Analyze the following webpage URL and generate comprehensive, advanced JSON-LD structured data (Schema.org markup) for it. Include all relevant schema types, properties, and nested entities. Output ONLY valid JSON-LD wrapped in <script type="application/ld+json"> tags.\n\nPage URL: [PAGE_URL]';
  const defaultIdentifyTpl = 'You will be given a URL. Crawl the page and identify ALL applicable Schema.org types and Google Rich Results types that should be implemented on this page. Do NOT write any schema markup code.\n\nFor each applicable type, provide:\n1. The Schema.org type name (e.g. Article, FAQPage, LocalBusiness, Product, BreadcrumbList, etc.)\n2. A brief one-line reason why it applies to this page content\n\nFormat your response as a simple numbered list. Be thorough and include every relevant type.\n\nPage URL: [PAGE_URL]';

  let markdownTpl = defaultMarkdownTpl;
  let urlTpl = defaultUrlTpl;
  let identifyTpl = defaultIdentifyTpl;
  try {
    const sg = await api.get('schema-settings.php');
    if (sg && sg.prompt_template) markdownTpl = sg.prompt_template;
    if (sg && sg.url_prompt_template) urlTpl = sg.url_prompt_template;
    if (sg && sg.identify_prompt_template) identifyTpl = sg.identify_prompt_template;
  } catch { }

  // ── Header ────────────────────────────────────────────────────────────────
  root.appendChild(h('div', { class: 'd-flex align-items-center justify-content-between mb-4 flex-wrap gap-2' },
    h('div', {},
      h('h2', { class: 'text-gradient mb-0' }, h('i', { class: 'bi bi-braces me-2' }), 'Schema Generator'),
      h('p', { class: 'text-muted mb-0 small' }, 'Import a webpage, paste Markdown, or batch-process a list of URLs \u2192 generate JSON-LD structured data via AI')
    ),
    h('a', { href: '#/settings', class: 'btn btn-outline-secondary btn-sm', id: 'sgSettingsLink' },
      h('i', { class: 'bi bi-gear me-1' }), 'Prompt Settings'
    )
  ));

  // ── Main card with 3-tab input nav ───────────────────────────────────────
  const mainCard = h('div', { class: 'card card-surface mb-4' });
  const mainBody = h('div', { class: 'card-body' });

  mainBody.appendChild(h('div', { class: 'fw-bold mb-3 small text-uppercase text-muted' },
    h('span', { class: 'badge bg-primary me-2' }, '1'), 'Choose Input Mode'
  ));

  // Tab nav
  const tabNav = h('ul', { class: 'nav nav-tabs mb-3', role: 'tablist' },
    h('li', { class: 'nav-item', role: 'presentation' },
      h('button', {
        class: 'nav-link active', id: 'sg-import-tab', type: 'button', role: 'tab',
        'data-bs-toggle': 'tab', 'data-bs-target': '#sg-import-panel'
      },
        h('i', { class: 'bi bi-globe me-1' }), 'Import Webpage'
      )
    ),
    h('li', { class: 'nav-item', role: 'presentation' },
      h('button', {
        class: 'nav-link', id: 'sg-paste-tab', type: 'button', role: 'tab',
        'data-bs-toggle': 'tab', 'data-bs-target': '#sg-paste-panel'
      },
        h('i', { class: 'bi bi-clipboard-fill me-1' }), 'Paste Markdown'
      )
    ),
    h('li', { class: 'nav-item', role: 'presentation' },
      h('button', {
        class: 'nav-link', id: 'sg-urls-tab', type: 'button', role: 'tab',
        'data-bs-toggle': 'tab', 'data-bs-target': '#sg-urls-panel'
      },
        h('i', { class: 'bi bi-list-ul me-1' }), 'List of URLs'
      )
    ),
    h('li', { class: 'nav-item', role: 'presentation' },
      h('button', {
        class: 'nav-link', id: 'sg-faq-tab', type: 'button', role: 'tab',
        'data-bs-toggle': 'tab', 'data-bs-target': '#sg-faq-panel'
      },
        h('i', { class: 'bi bi-question-circle me-1' }), 'Add FAQ Schema To Content Brief'
      )
    )
  );
  mainBody.appendChild(tabNav);

  // ── Tab: Import Webpage ──────────────────────────────────────────────────
  const importPanel = h('div', { class: 'tab-pane fade show active', id: 'sg-import-panel', role: 'tabpanel' });
  const urlInputGroup = h('div', { class: 'input-group mb-2' });
  const urlInput = h('input', {
    type: 'url', class: 'form-control cosmic-input', id: 'schemaUrl',
    placeholder: 'https://example.com/your-page', autocomplete: 'url'
  });
  const crawlBtn = h('button', { class: 'btn btn-primary cosmic-btn', id: 'crawlBtn' },
    h('i', { class: 'bi bi-cloud-download me-1' }), 'Import Page'
  );
  urlInputGroup.append(urlInput, crawlBtn);
  importPanel.appendChild(urlInputGroup);
  const crawlStatus = h('div', { id: 'crawlStatus', style: 'display:none' });
  importPanel.appendChild(crawlStatus);
  const mdBlock = h('div', { id: 'mdBlock', class: 'mt-3', style: 'display:none' });
  mdBlock.appendChild(h('label', { class: 'form-label fw-semibold small' },
    h('i', { class: 'bi bi-file-text me-1' }), 'Imported Markdown (editable)'
  ));
  const mdOutputArea = h('textarea', {
    class: 'form-control cosmic-input font-monospace', id: 'mdOutput',
    rows: '10', style: 'font-size:0.8rem;'
  });
  mdBlock.appendChild(mdOutputArea);
  importPanel.appendChild(mdBlock);

  // ── Tab: Paste Markdown ──────────────────────────────────────────────────
  const pastePanel = h('div', { class: 'tab-pane fade', id: 'sg-paste-panel', role: 'tabpanel' });
  pastePanel.appendChild(h('label', { class: 'form-label fw-semibold small mt-1' },
    h('i', { class: 'bi bi-clipboard me-1' }), 'Paste Markdown Content'
  ));
  const pasteArea = h('textarea', {
    class: 'form-control cosmic-input font-monospace', id: 'pasteMarkdown',
    rows: '12', style: 'font-size:0.8rem;', placeholder: 'Paste webpage markdown content here\u2026'
  });
  pastePanel.appendChild(pasteArea);

  // ── Tab: List of URLs ────────────────────────────────────────────────────
  const urlsPanel = h('div', { class: 'tab-pane fade', id: 'sg-urls-panel', role: 'tabpanel' });
  urlsPanel.appendChild(h('div', { class: 'alert alert-info d-flex align-items-start gap-2 mb-3 py-2 mt-1' },
    h('i', { class: 'bi bi-info-circle mt-1 flex-shrink-0' }),
    h('div', { class: 'small' },
      'Paste one URL per line. Click ', h('strong', {}, 'Generate Advanced Schema'),
      ' and each URL will be sent to the AI sequentially \u2014 results stream in below as they arrive.'
    )
  ));
  urlsPanel.appendChild(h('label', { class: 'form-label fw-semibold small' },
    h('i', { class: 'bi bi-list-ul me-1' }), 'URLs to Process ', h('span', { class: 'text-muted' }, '(one per line)')
  ));
  const urlListArea = h('textarea', {
    class: 'form-control cosmic-input font-monospace', id: 'urlListInput',
    rows: '10', style: 'font-size:0.85rem;',
    placeholder: 'https://example.com/page-1\nhttps://example.com/page-2\nhttps://example.com/page-3'
  });
  urlsPanel.appendChild(urlListArea);

  // ── Optional: Upload file of URLs ──────────────────────────────────────
  const fileUploadWrap = h('div', { class: 'mt-3' });
  fileUploadWrap.appendChild(h('label', { class: 'form-label fw-semibold small' },
    h('i', { class: 'bi bi-upload me-1' }), 'Or Upload a File ',
    h('span', { class: 'text-muted' }, '(optional — .txt, .csv)')
  ));
  const fileInput = h('input', {
    type: 'file', class: 'form-control cosmic-input form-control-sm',
    id: 'urlFileUpload', accept: '.txt,.csv,.tsv'
  });
  fileUploadWrap.appendChild(fileInput);
  urlsPanel.appendChild(fileUploadWrap);

  // ── Output Log Box ─────────────────────────────────────────────────────
  const logBox = h('div', {
    id: 'sgLogBox',
    class: 'font-monospace mt-3',
    style: 'display:none;background:#1a1a2e;color:#c8c8d4;border:1px solid #333;border-radius:6px;padding:10px 12px;max-height:200px;overflow-y:auto;font-size:0.78rem;line-height:1.6;white-space:pre-wrap;'
  });
  urlsPanel.appendChild(logBox);

  // Helper: append a line to the log box with optional type colouring
  function logMsg(text, type) {
    logBox.style.display = '';
    const line = document.createElement('div');
    if (type === 'error') line.style.color = '#ff6b6b';
    if (type === 'success') line.style.color = '#51cf66';
    if (type === 'warn') line.style.color = '#fcc419';
    if (type === 'info') line.style.color = '#74c0fc';
    const ts = new Date().toLocaleTimeString();
    line.textContent = '[' + ts + '] ' + text;
    logBox.appendChild(line);
    logBox.scrollTop = logBox.scrollHeight;
  }
  function clearLog() { logBox.innerHTML = ''; logBox.style.display = 'none'; }

  // Wire file upload → parse URLs and populate textarea
  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (!file) return;
    clearLog();
    logMsg('Reading file: ' + file.name + ' (' + (file.size / 1024).toFixed(1) + ' KB)', 'info');
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result || '';
      // Extract URLs: split by newlines/commas, filter valid http(s) URLs
      const urls = text.split(/[\r\n,]+/)
        .map(u => u.trim().replace(/^["']|["']$/g, ''))
        .filter(u => /^https?:\/\/.+/.test(u));
      if (!urls.length) {
        logMsg('No valid URLs found in file. Expected http:// or https:// URLs, one per line or comma-separated.', 'error');
        return;
      }
      // Append to existing textarea content (don't overwrite)
      const existing = urlListArea.value.trim();
      urlListArea.value = existing ? existing + '\n' + urls.join('\n') : urls.join('\n');
      logMsg('Loaded ' + urls.length + ' URL' + (urls.length !== 1 ? 's' : '') + ' from ' + file.name, 'success');
      // List first few
      const preview = urls.slice(0, 5);
      preview.forEach((u, i) => logMsg('  ' + (i + 1) + '. ' + u, 'info'));
      if (urls.length > 5) logMsg('  \u2026and ' + (urls.length - 5) + ' more', 'info');
    };
    reader.onerror = () => logMsg('Failed to read file: ' + (reader.error?.message || 'unknown error'), 'error');
    reader.readAsText(file);
  });

  // ── Tab: Add FAQ Schema To Content Brief ────────────────────────────────
  const faqPanel = h('div', { class: 'tab-pane fade', id: 'sg-faq-panel', role: 'tabpanel' });

  faqPanel.appendChild(h('div', { class: 'alert alert-info d-flex align-items-start gap-2 mb-3 py-2 mt-1' },
    h('i', { class: 'bi bi-info-circle mt-1 flex-shrink-0' }),
    h('div', { class: 'small' },
      'Upload a ', h('strong', {}, '.docx'), ' content brief that contains a FAQ section. ',
      'The tool will automatically detect the FAQ questions and answers, generate valid ',
      h('strong', {}, 'FAQPage JSON-LD schema'), ', and produce a new Word document with the ',
      'schema code pasted at the end of the FAQ section. ',
      h('br', {}),
      h('span', { class: 'text-muted' }, 'Tip: Your FAQ section heading should contain the words "FAQ" or "Frequently Asked Questions".')
    )
  ));

  // File upload field
  const faqFileLabel = h('label', { for: 'faqDocxUpload', class: 'form-label fw-semibold small' },
    h('i', { class: 'bi bi-file-earmark-word me-1' }), 'Upload Content Brief (.docx)'
  );
  const faqFileInput = h('input', {
    type: 'file',
    class: 'form-control cosmic-input mb-3',
    id: 'faqDocxUpload',
    accept: '.docx'
  });
  faqPanel.append(faqFileLabel, faqFileInput);

  // Submit button
  const faqSubmitBtn = h('button', {
    type: 'button',
    class: 'btn btn-success cosmic-btn',
    id: 'faqSubmitBtn'
  },
    h('i', { class: 'bi bi-magic me-2' }), 'Generate & Add FAQ Schema'
  );
  faqPanel.appendChild(faqSubmitBtn);

  // Progress / status area
  const faqStatus = h('div', { id: 'faqStatus', class: 'mt-3', style: 'display:none;' });
  faqPanel.appendChild(faqStatus);

  // Result area
  const faqResult = h('div', { id: 'faqResult', class: 'mt-3', style: 'display:none;' });
  faqPanel.appendChild(faqResult);

  // Wire up FAQ submit
  faqSubmitBtn.addEventListener('click', async () => {
    const file = faqFileInput.files[0];
    if (!file) {
      toast('Please select a .docx file first.', 'warning');
      return;
    }
    if (!file.name.toLowerCase().endsWith('.docx')) {
      toast('Only .docx files are supported.', 'warning');
      return;
    }

    const provider = providerSel.value;
    const apiKey = localStorage.getItem('prompt-db-' + provider + '-key') || '';
    if (!apiKey) {
      toast('No API key set for ' + provider + '. Go to Settings → API Keys.', 'warning');
      return;
    }

    // UI: loading state
    faqSubmitBtn.disabled = true;
    faqSubmitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Processing…';
    faqStatus.style.display = '';
    faqStatus.className = 'mt-3 alert alert-info d-flex align-items-center gap-2';
    faqStatus.innerHTML = '<span class="spinner-border spinner-border-sm"></span> '
      + '<span>Uploading document and generating FAQ schema via AI…<br>'
      + '<small class="text-muted">This may take 15–40 seconds depending on document length.</small></span>';
    faqResult.style.display = 'none';
    faqResult.innerHTML = '';

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('provider', provider);
      formData.append('api_key', apiKey);

      const res = await fetch(API_BASE + 'faq-schema.php', {
        method: 'POST',
        credentials: 'same-origin',
        body: formData
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'HTTP ' + res.status);
      }

      // Success UI
      faqStatus.className = 'mt-3 alert alert-success';
      faqStatus.innerHTML = '<i class="bi bi-check-circle me-2"></i>'
        + '<strong>' + data.faq_count + ' FAQ pair' + (data.faq_count !== 1 ? 's' : '') + ' detected</strong> — '
        + 'Schema generated and injected into your document!';

      // Schema preview
      const previewHtml = data.schema_preview
        ? '<div class="mb-2"><label class="form-label fw-semibold small"><i class="bi bi-code-slash me-1"></i>Schema Preview</label>'
        + '<pre style="background:#111;color:#51cf66;padding:12px;border-radius:8px;font-size:0.75rem;max-height:200px;overflow-y:auto;white-space:pre-wrap;">'
        + data.schema_preview.replace(/</g, '&lt;').replace(/>/g, '&gt;')
        + (data.schema_preview.length >= 600 ? '\n…' : '') + '</pre></div>'
        : '';

      faqResult.style.display = '';
      faqResult.innerHTML = previewHtml
        + '<a href="' + data.download_url + '" class="btn btn-primary cosmic-btn" download="' + data.filename + '">'
        + '<i class="bi bi-download me-2"></i>Download: ' + data.filename + '</a>';

      toast('FAQ Schema added! Your document is ready to download.', 'success');
    } catch (err) {
      faqStatus.className = 'mt-3 alert alert-danger';
      faqStatus.innerHTML = '<i class="bi bi-exclamation-triangle me-2"></i><strong>Error:</strong> ' + err.message;
      toast('Failed: ' + err.message, 'danger');
    } finally {
      faqSubmitBtn.disabled = false;
      faqSubmitBtn.innerHTML = '<i class="bi bi-magic me-2"></i>Generate & Add FAQ Schema';
    }
  });

  // Tab content wrapper
  const tabContent = h('div', { class: 'tab-content' });
  tabContent.append(importPanel, pastePanel, urlsPanel, faqPanel);
  mainBody.appendChild(tabContent);

  mainBody.appendChild(h('hr', { class: 'my-4' }));

  // ── Step 2: AI Provider + Generate ───────────────────────────────────────
  mainBody.appendChild(h('div', { class: 'fw-bold mb-3 small text-uppercase text-muted' },
    h('span', { class: 'badge bg-success me-2' }, '2'), 'Select AI & Generate'
  ));

  const providerRow = h('div', { class: 'd-flex align-items-center gap-3 flex-wrap mb-3' });
  const providerSel = h('select', {
    class: 'form-select cosmic-input', id: 'sgAiProvider',
    style: 'width:auto;min-width:210px;'
  },
    h('option', { value: 'claude' }, '\uD83E\uDD16 Claude (Anthropic)'),
    h('option', { value: 'openai' }, '\uD83E\uDDE0 OpenAI (GPT-4o)'),
    h('option', { value: 'gemini' }, '\u2728 Gemini (Google)')
  );
  const keyBadge = h('span', { id: 'sgKeyBadge' });
  providerRow.append(
    h('div', {}, h('label', { class: 'form-label small fw-bold mb-1' }, 'AI Provider'), h('div', {}, providerSel)),
    h('div', { class: 'pt-3' }, keyBadge)
  );
  mainBody.appendChild(providerRow);

  const genSchemaBtn = h('button', { class: 'btn btn-success cosmic-btn btn-lg', id: 'genSchemaBtn' },
    h('i', { class: 'bi bi-stars me-2' }), 'Generate Advanced Schema'
  );
  const identifyBtn = h('button', {
    class: 'btn btn-lg', id: 'identifySchemaBtn',
    style: 'background:#444;color:#fff;border:1px solid #555;display:none;'
  },
    h('i', { class: 'bi bi-search me-2' }), 'Identify applicable Schema Types'
  );
  const btnRow = h('div', { class: 'd-flex gap-3 flex-wrap align-items-center' });
  btnRow.append(genSchemaBtn, identifyBtn);
  mainBody.appendChild(btnRow);
  // ── Identify Progress Section (inside main card) ──────────────────────
  const idProgressWrap = h('div', { id: 'identifyProgressWrap', style: 'display:none', class: 'mt-4' });
  const idProgressBar = h('div', {
    class: 'progress-bar progress-bar-striped progress-bar-animated',
    role: 'progressbar', style: 'width:0%;background:#444'
  });
  const idProgressBarOuter = h('div', { class: 'progress mb-2', style: 'height:10px' });
  idProgressBarOuter.appendChild(idProgressBar);
  const idProgressMsg = h('div', { class: 'text-muted small', id: 'identifyProgressMsg' });
  const idDownloadWrap = h('div', { id: 'identifyDownloadWrap', style: 'display:none', class: 'mt-3' });
  idProgressWrap.append(idProgressBarOuter, idProgressMsg, idDownloadWrap);
  mainBody.appendChild(idProgressWrap);

  mainCard.appendChild(mainBody);
  root.appendChild(mainCard);

  // ── Output Section ────────────────────────────────────────────────────────
  const outputSection = h('div', { id: 'schemaOutputSection', style: 'display:none' });
  const outputCard = h('div', { class: 'card card-surface' });
  const outputBody = h('div', { class: 'card-body' });

  const outputBtns = h('div', { class: 'd-flex gap-2 flex-wrap' },
    h('button', { class: 'btn btn-outline-light btn-sm cosmic-btn', id: 'copySchemaBtn' },
      h('i', { class: 'bi bi-clipboard me-1' }), 'Copy'
    ),
    h('button', { class: 'btn btn-warning btn-sm cosmic-btn', id: 'validateBtn' },
      h('i', { class: 'bi bi-google me-1' }), 'Validate (G-Rich Results)'
    )
  );
  outputBody.appendChild(h('div', { class: 'd-flex justify-content-between align-items-center mb-3 flex-wrap gap-2' },
    h('h5', { class: 'mb-0' }, h('i', { class: 'bi bi-code-slash me-2' }), 'Generated Schema Output'),
    outputBtns
  ));

  // Progress bar (URL list mode)
  const batchProgress = h('div', { id: 'batchProgress', style: 'display:none', class: 'mb-3' });
  const batchProgressBar = h('div', {
    class: 'progress-bar progress-bar-striped progress-bar-animated bg-success',
    role: 'progressbar', style: 'width:0%'
  });
  const batchProgressWrap = h('div', { class: 'progress mb-1', style: 'height:8px' });
  batchProgressWrap.appendChild(batchProgressBar);
  const batchProgressLabel = h('div', { class: 'text-muted small text-end', id: 'batchProgressLabel' });
  batchProgress.append(batchProgressWrap, batchProgressLabel);

  const schemaOutput = h('div', { id: 'schemaStreamOut', class: 'ai-response-content schema-output-box p-3' });
  outputBody.append(batchProgress, schemaOutput);
  outputCard.appendChild(outputBody);
  outputSection.appendChild(outputCard);
  root.appendChild(outputSection);

  // ════════════════════════════════════════════════════════════════════════════
  //  HELPERS
  // ════════════════════════════════════════════════════════════════════════════

  function getActiveTab() {
    if (document.getElementById('sg-paste-tab')?.classList.contains('active')) return 'paste';
    if (document.getElementById('sg-urls-tab')?.classList.contains('active')) return 'urls';
    if (document.getElementById('sg-faq-tab')?.classList.contains('active')) return 'faq';
    return 'import';
  }

  function updateKeyBadge() {
    const prov = providerSel.value;
    const key = localStorage.getItem('prompt-db-' + prov + '-key') || '';
    if (key) {
      keyBadge.textContent = '\u2713 API Key Set';
      keyBadge.className = 'badge bg-success fs-6';
      genSchemaBtn.disabled = false;
      identifyBtn.disabled = false;
      faqSubmitBtn.disabled = false;
    } else {
      keyBadge.innerHTML = '\u26A0 No API key \u2014 <a href="#/settings" class="text-white text-decoration-underline">add in Settings \u2192 API Keys</a>';
      keyBadge.className = 'badge bg-warning text-dark fs-6';
      genSchemaBtn.disabled = true;
      identifyBtn.disabled = true;
      faqSubmitBtn.disabled = true;
    }
  }
  updateKeyBadge();
  providerSel.addEventListener('change', updateKeyBadge);

  // ── Show / hide Identify + Generate buttons based on active tab ────────────
  function updateIdentifyBtnVisibility() {
    const tab = getActiveTab();
    identifyBtn.style.display = tab === 'urls' ? '' : 'none';
    // Hide the main Generate + output section controls on the faq tab
    // (the FAQ tab has its own submit/result UI)
    genSchemaBtn.style.display = tab === 'faq' ? 'none' : '';
  }
  updateIdentifyBtnVisibility();
  tabNav.querySelectorAll('button[data-bs-toggle="tab"]').forEach(tab => {
    tab.addEventListener('shown.bs.tab', updateIdentifyBtnVisibility);
  });

  // ── SSE streaming helper ──────────────────────────────────────────────────
  // Streams SSE response into targetEl.textContent, returns full text string.
  // Throws on API error events.
  async function streamToElement(response, targetEl) {
    targetEl.textContent = '';
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullText = '';
    let streamError = null;

    loop: while (true) {
      let chunk;
      try { chunk = await reader.read(); } catch { break; }
      if (chunk.done) break;
      buffer += decoder.decode(chunk.value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop(); // keep partial last line

      for (const line of lines) {
        const t = line.trim();
        if (!t.startsWith('data:')) continue;
        const payload = t.slice(5).trim();
        if (payload === '[DONE]') break loop;
        let obj;
        try { obj = JSON.parse(payload); } catch { continue; }
        if (obj.error) { streamError = obj.error; break loop; }
        if (typeof obj.text === 'string' && obj.text) {
          fullText += obj.text;
          targetEl.textContent = fullText;
        }
      }
    }

    if (streamError) throw new Error(streamError);
    return fullText;
  }

  // ── Crawl ─────────────────────────────────────────────────────────────────
  crawlBtn.addEventListener('click', async () => {
    const url = urlInput.value.trim();
    if (!url) { toast('Please enter a URL', 'warning'); return; }
    crawlBtn.disabled = true;
    crawlBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Importing\u2026';
    crawlStatus.style.display = '';
    crawlStatus.className = 'alert alert-info mt-2';
    crawlStatus.textContent = 'Fetching and converting webpage\u2026';
    mdBlock.style.display = 'none';
    try {
      const res = await api.post('crawl.php', { url });
      if (res.error) throw new Error(res.error);
      const md = res.markdown || '';
      if (!md) throw new Error('No content extracted from that URL');
      // Normalize whitespace: collapse 3+ blank lines to one
      const mdClean = md.replace(/\n{3,}/g, '\n\n').trim();
      mdOutputArea.value = mdClean;
      mdBlock.style.display = '';
      crawlStatus.className = 'alert alert-success mt-2';
      crawlStatus.textContent = '\u2713 Imported "' + (res.title || url) + '" \u2014 ' + md.length.toLocaleString() + ' characters';
      toast('Page imported successfully', 'success');
    } catch (err) {
      crawlStatus.className = 'alert alert-danger mt-2';
      crawlStatus.textContent = '\u2717 ' + err.message;
      toast(err.message, 'danger');
    } finally {
      crawlBtn.disabled = false;
      crawlBtn.innerHTML = '<i class="bi bi-cloud-download me-1"></i>Import Page';
    }
  });
  urlInput.addEventListener('keydown', e => { if (e.key === 'Enter') crawlBtn.click(); });

  // ── Generate Schema ───────────────────────────────────────────────────────
  genSchemaBtn.addEventListener('click', async () => {
    const provider = providerSel.value;
    const apiKey = localStorage.getItem('prompt-db-' + provider + '-key') || '';
    if (!apiKey) {
      toast('No API key set for ' + provider + '. Go to Settings \u2192 API Keys.', 'warning');
      return;
    }

    const mode = getActiveTab();

    // ── URL List batch mode ──────────────────────────────────────────────
    if (mode === 'urls') {
      const rawUrls = urlListArea.value.trim();
      if (!rawUrls) { toast('Paste at least one URL to process.', 'warning'); return; }
      const urls = rawUrls.split('\n').map(u => u.trim()).filter(u => u.startsWith('http'));
      if (!urls.length) { toast('No valid URLs found. Each URL must start with http.', 'warning'); return; }

      outputSection.style.display = '';
      batchProgress.style.display = '';
      batchProgressBar.style.width = '0%';
      batchProgressBar.classList.add('progress-bar-animated');
      schemaOutput.innerHTML = '';
      schemaOutput.dataset.schemaText = '';
      outputSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      genSchemaBtn.disabled = true;
      genSchemaBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Processing\u2026';
      clearLog();
      logMsg('Starting batch schema generation for ' + urls.length + ' URL' + (urls.length !== 1 ? 's' : ''), 'info');

      let allText = '';

      for (let i = 0; i < urls.length; i++) {
        const url = urls[i];
        const pct = Math.round((i / urls.length) * 100);
        batchProgressBar.style.width = pct + '%';
        batchProgressLabel.textContent = 'Processing ' + (i + 1) + ' of ' + urls.length + ': ' + url;
        logMsg('(' + (i + 1) + '/' + urls.length + ') Generating schema for: ' + url, 'info');

        const urlHeader = h('div', { class: (i > 0 ? 'border-top pt-3 mt-3' : 'pt-1') });
        const badge = h('span', { class: 'badge bg-primary me-2' }, (i + 1) + '/' + urls.length);
        urlHeader.appendChild(h('div', { class: 'd-flex align-items-center mb-2' },
          badge,
          h('code', { class: 'small text-muted', style: 'word-break:break-all' }, url)
        ));
        const pre = h('pre', { class: 'schema-pre mb-0' });
        urlHeader.appendChild(pre);
        schemaOutput.appendChild(urlHeader);
        pre.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        const prompt = urlTpl.replace('[PAGE_URL]', url);
        try {
          const response = await fetch(API_BASE + 'ai-chat.php', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, provider, api_key: apiKey })
          });
          if (!response.ok) {
            const errJson = await response.json().catch(() => ({}));
            throw new Error(errJson.error || 'HTTP ' + response.status);
          }
          const text = await streamToElement(response, pre);
          allText += '\n\n/* === ' + url + ' === */\n' + text;
          badge.className = 'badge bg-success me-2';
          logMsg('\u2713 Schema generated for: ' + url, 'success');
        } catch (err) {
          pre.textContent = '\u26A0 Error: ' + err.message;
          pre.className = 'schema-pre text-danger mb-0';
          badge.className = 'badge bg-danger me-2';
          toast('Error on ' + url + ': ' + err.message, 'danger');
          logMsg('\u2717 Error on ' + url + ': ' + err.message, 'error');
        }
      }

      batchProgressBar.style.width = '100%';
      batchProgressBar.classList.remove('progress-bar-animated');
      batchProgressLabel.textContent = '\u2713 All ' + urls.length + ' URL' + (urls.length !== 1 ? 's' : '') + ' processed';
      logMsg('\u2713 Batch complete \u2014 ' + urls.length + ' URL' + (urls.length !== 1 ? 's' : '') + ' processed', 'success');
      schemaOutput.dataset.schemaText = allText;
      genSchemaBtn.disabled = false;
      updateKeyBadge();
      genSchemaBtn.innerHTML = '<i class="bi bi-stars me-2"></i>Generate Advanced Schema';
      toast('Done! ' + urls.length + ' URL' + (urls.length !== 1 ? 's' : '') + ' processed', 'success');
      return;
    }

    // ── Single page mode (import or paste) ────────────────────────────────
    const markdown = mode === 'import' ? mdOutputArea.value.trim() : pasteArea.value.trim();
    if (!markdown) {
      toast(mode === 'import'
        ? 'Import a webpage first \u2014 click "Import Page".'
        : 'Paste some markdown content first.',
        'warning');
      return;
    }

    const prompt = markdownTpl.replace('[PAGE_MARKDOWN]', markdown);

    outputSection.style.display = '';
    batchProgress.style.display = 'none';
    schemaOutput.innerHTML = '';
    schemaOutput.dataset.schemaText = '';

    const pre = h('pre', { class: 'schema-pre mb-0', id: 'schemaText' });
    schemaOutput.appendChild(pre);
    outputSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

    genSchemaBtn.disabled = true;
    genSchemaBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Generating\u2026';

    try {
      const response = await fetch(API_BASE + 'ai-chat.php', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, provider, api_key: apiKey })
      });
      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || 'HTTP ' + response.status);
      }
      const fullText = await streamToElement(response, pre);
      pre.dataset.schemaText = fullText;
      schemaOutput.dataset.schemaText = fullText;
      toast('Schema generated!', 'success');
    } catch (err) {
      schemaOutput.innerHTML = '<div class="alert alert-danger d-flex align-items-start gap-2"><i class="bi bi-exclamation-triangle mt-1"></i><div><strong>Error:</strong> ' + err.message + '</div></div>';
      toast('Generation failed: ' + err.message, 'danger');
    } finally {
      genSchemaBtn.disabled = false;
      updateKeyBadge();
      genSchemaBtn.innerHTML = '<i class="bi bi-stars me-2"></i>Generate Advanced Schema';
    }
  });

  // ── Copy ──────────────────────────────────────────────────────────────────
  document.getElementById('copySchemaBtn').addEventListener('click', async () => {
    const text = schemaOutput.dataset.schemaText
      || document.getElementById('schemaText')?.dataset.schemaText
      || document.getElementById('schemaText')?.textContent || '';
    if (!text) { toast('Nothing to copy yet', 'warning'); return; }
    try { await navigator.clipboard.writeText(text); toast('Schema copied to clipboard!', 'success'); }
    catch { toast('Copy failed \u2014 try selecting text manually', 'danger'); }
  });

  // ── Identify applicable Schema Types ────────────────────────────────────
  identifyBtn.addEventListener('click', async () => {
    const provider = providerSel.value;
    const apiKey = localStorage.getItem('prompt-db-' + provider + '-key') || '';
    if (!apiKey) { toast('No API key set for ' + provider + '. Go to Settings \u2192 API Keys.', 'warning'); return; }

    // Gather URLs from the active tab — support both urls tab and import/paste single URL
    let urls = [];
    const mode = getActiveTab();
    if (mode === 'urls') {
      const rawUrls = urlListArea.value.trim();
      if (!rawUrls) { toast('Paste at least one URL to process.', 'warning'); return; }
      urls = rawUrls.split('\n').map(u => u.trim()).filter(u => u.startsWith('http'));
    } else if (mode === 'import') {
      const u = urlInput.value.trim();
      if (!u) { toast('Enter a URL first.', 'warning'); return; }
      urls = [u];
    }
    if (!urls.length) { toast('No valid URLs found.', 'warning'); return; }

    // UI — disable buttons, show progress
    identifyBtn.disabled = true;
    genSchemaBtn.disabled = true;
    identifyBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Identifying\u2026';
    idProgressWrap.style.display = '';
    idDownloadWrap.style.display = 'none';
    idDownloadWrap.innerHTML = '';
    idProgressBar.style.width = '0%';
    idProgressBar.classList.add('progress-bar-animated');
    idProgressMsg.textContent = 'Starting\u2026';
    clearLog();
    logMsg('Starting schema type identification for ' + urls.length + ' URL' + (urls.length !== 1 ? 's' : ''), 'info');

    const csvRows = [['URL', 'Applicable Schema Types', 'Details']];

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      const pct = Math.round(((i) / urls.length) * 100);
      idProgressBar.style.width = pct + '%';

      // Step 1: Crawl
      idProgressMsg.textContent = '(' + (i + 1) + '/' + urls.length + ') Crawling: ' + url + '\u2026';
      logMsg('(' + (i + 1) + '/' + urls.length + ') Crawling: ' + url, 'info');
      let crawlOk = false;
      try {
        const crawlRes = await api.post('crawl.php', { url });
        if (crawlRes.error) throw new Error(crawlRes.error);
        crawlOk = true;
        logMsg('\u2713 Crawl OK: ' + url, 'success');
      } catch (err) {
        // Crawl failed — note it, continue
        csvRows.push([url, 'CRAWL ERROR', err.message]);
        logMsg('\u2717 Crawl failed: ' + url + ' — ' + err.message, 'error');
        continue;
      }

      // Step 2: Send to AI to identify schema types
      idProgressMsg.textContent = '(' + (i + 1) + '/' + urls.length + ') Identifying schema types for: ' + url + '\u2026';
      logMsg('(' + (i + 1) + '/' + urls.length + ') Identifying schema types for: ' + url, 'info');
      const prompt = identifyTpl.replace('[PAGE_URL]', url);
      try {
        const response = await fetch(API_BASE + 'ai-chat.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, provider, api_key: apiKey })
        });
        if (!response.ok) {
          const errJson = await response.json().catch(() => ({}));
          throw new Error(errJson.error || 'HTTP ' + response.status);
        }
        // Stream full response
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buf = '', fullText = '';
        readLoop: while (true) {
          let chunk;
          try { chunk = await reader.read(); } catch { break; }
          if (chunk.done) break;
          buf += decoder.decode(chunk.value, { stream: true });
          const lines = buf.split('\n');
          buf = lines.pop();
          for (const line of lines) {
            const t = line.trim();
            if (!t.startsWith('data:')) continue;
            const payload = t.slice(5).trim();
            if (payload === '[DONE]') break readLoop;
            let obj;
            try { obj = JSON.parse(payload); } catch { continue; }
            if (obj.error) throw new Error(obj.error);
            if (typeof obj.text === 'string' && obj.text) fullText += obj.text;
          }
        }
        // Parse AI response — extract schema type names
        const typeNames = [];
        const details = [];
        for (const line of fullText.split('\n')) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          // Match lines like "1. Article — ..." or "- FAQPage: ..."
          const m = trimmed.match(/^(?:\d+[.)\s]+|[-*]\s+)\**([A-Z][A-Za-z]+(?:\/[A-Za-z]+)*)\**[:\s\u2014\u2013-]*(.*)/i);
          if (m) {
            typeNames.push(m[1].trim());
            details.push(m[2] ? m[2].trim().replace(/^\*+|\*+$/g, '') : '');
          }
        }
        const typesStr = typeNames.length ? typeNames.join(', ') : fullText.substring(0, 300);
        const detailsStr = details.length ? details.join(' | ') : '';
        csvRows.push([url, typesStr, detailsStr]);
        logMsg('\u2713 Found ' + typeNames.length + ' schema type' + (typeNames.length !== 1 ? 's' : '') + ': ' + typesStr, 'success');
      } catch (err) {
        csvRows.push([url, 'AI ERROR', err.message]);
        toast('Error on ' + url + ': ' + err.message, 'danger');
        logMsg('\u2717 AI error on ' + url + ': ' + err.message, 'error');
      }
    }

    // Step 3: Generate CSV
    idProgressBar.style.width = '95%';
    idProgressMsg.textContent = 'Writing CSV report\u2026';
    logMsg('Writing CSV report\u2026', 'info');

    const csvContent = csvRows.map(row =>
      row.map(cell => '"' + String(cell).replace(/"/g, '""') + '"').join(',')
    ).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const csvUrl = URL.createObjectURL(blob);
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = 'schema-types-report-' + timestamp + '.csv';

    // Auto-download
    const autoLink = document.createElement('a');
    autoLink.href = csvUrl;
    autoLink.download = filename;
    autoLink.style.display = 'none';
    document.body.appendChild(autoLink);
    autoLink.click();
    document.body.removeChild(autoLink);

    // Show Download Report button
    idProgressBar.style.width = '100%';
    idProgressBar.classList.remove('progress-bar-animated');
    idProgressMsg.textContent = '\u2713 Report complete \u2014 ' + (csvRows.length - 1) + ' URL' + (csvRows.length - 1 !== 1 ? 's' : '') + ' analyzed';
    idDownloadWrap.style.display = '';
    const dlBtn = h('a', {
      href: csvUrl, download: filename,
      class: 'btn btn-success cosmic-btn'
    }, h('i', { class: 'bi bi-download me-2' }), 'Download Report');
    idDownloadWrap.innerHTML = '';
    idDownloadWrap.appendChild(dlBtn);

    // Restore buttons
    identifyBtn.disabled = false;
    genSchemaBtn.disabled = false;
    updateKeyBadge();
    identifyBtn.innerHTML = '<i class="bi bi-search me-2"></i>Identify applicable Schema Types';
    logMsg('\u2713 Report complete \u2014 ' + (csvRows.length - 1) + ' URL' + (csvRows.length - 1 !== 1 ? 's' : '') + ' analyzed. CSV auto-downloaded.', 'success');
    toast('Done! CSV report downloaded with ' + (csvRows.length - 1) + ' URL' + (csvRows.length - 1 !== 1 ? 's' : ''), 'success');
  });

  // ── Validate with Google Rich Results ────────────────────────────────────
  document.getElementById('validateBtn').addEventListener('click', async () => {
    const pre = document.getElementById('schemaText');
    const text = schemaOutput.dataset.schemaText || pre?.dataset.schemaText || pre?.textContent || '';
    if (!text) { toast('Generate a schema first', 'warning'); return; }
    try { await navigator.clipboard.writeText(text); } catch { }
    toast('Schema copied! In Google Rich Results: click "Code" tab \u2192 paste \u2192 "Test Code"', 'info');
    const win = window.open('https://search.google.com/test/rich-results', '_blank');
    if (win) {
      setTimeout(() => {
        try {
          for (const tab of win.document.querySelectorAll('[role="tab"]')) {
            if (tab.textContent?.toLowerCase().includes('code')) { tab.click(); break; }
          }
          const ta = win.document.querySelector('textarea, [contenteditable="true"]');
          if (ta) { ta.value = text; ta.dispatchEvent(new Event('input', { bubbles: true })); }
          for (const btn of win.document.querySelectorAll('button')) {
            if (btn.textContent?.toLowerCase().includes('test code')) { btn.click(); break; }
          }
        } catch { }
      }, 3000);
    }
  });
}

// ─── Settings ───────────────────────────────────────────────────────────────
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
  const tabNav = h('ul', { class: 'nav nav-tabs mb-4', role: 'tablist', 'data-name': 'settings-tabs' },
    h('li', { class: 'nav-item', role: 'presentation' },
      h('button', { class: 'nav-link active', id: 'look-tab', 'data-bs-toggle': 'tab', 'data-bs-target': '#look-panel', type: 'button', role: 'tab', 'data-name': 'settings-tab-look' },
        h('i', { class: 'bi bi-palette me-2' }), 'Look and Feel'
      )
    ),
    h('li', { class: 'nav-item', role: 'presentation' },
      h('button', { class: 'nav-link', id: 'apikeys-tab', 'data-bs-toggle': 'tab', 'data-bs-target': '#apikeys-panel', type: 'button', role: 'tab', 'data-name': 'settings-tab-apikeys' },
        h('i', { class: 'bi bi-key me-2' }), 'API Keys'
      )
    ),
    h('li', { class: 'nav-item', role: 'presentation' },
      h('button', { class: 'nav-link', id: 'schemagen-tab', 'data-bs-toggle': 'tab', 'data-bs-target': '#schemagen-panel', type: 'button', role: 'tab', 'data-name': 'settings-tab-schema' },
        h('i', { class: 'bi bi-braces me-2' }), 'Schema Gen Settings'
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
      autocomplete: 'off',
      'data-name': `apikey-field-${storageKey}`
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
          h('div', { class: 'row g-3', id: 'themeGrid', 'data-name': 'settings-theme-grid' })
        )
      ),
      // Style Filter Section
      h('div', { class: 'card card-surface' },
        h('div', { class: 'card-body' },
          h('h5', { class: 'mb-3' }, h('i', { class: 'bi bi-brush me-2' }), 'UI Style'),
          h('p', { class: 'text-muted mb-4' }, 'Apply a design style filter over your chosen colors.'),
          h('div', { class: 'row g-3', id: 'styleGrid', 'data-name': 'settings-style-grid' })
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
            h('button', { class: 'btn btn-success cosmic-btn', id: 'saveApiKeys', 'data-ripple': '', 'data-name': 'settings-save-api-keys-btn' },
              h('i', { class: 'bi bi-save me-1' }), 'Save API Keys'
            )
          )
        )
      )
    ),
    // Schema Gen Settings Tab
    h('div', { class: 'tab-pane fade', id: 'schemagen-panel', role: 'tabpanel' },
      h('div', { class: 'card card-surface' },
        h('div', { class: 'card-body' },
          h('h5', { class: 'mb-1' }, h('i', { class: 'bi bi-braces me-2' }), 'Schema Generator — Prompt Templates'),
          h('p', { class: 'text-muted mb-3' }, 'Customise the AI prompts used by the Schema Generator. Provider is selected on the Generator page; API keys are in the API Keys tab.'),
          // Info banner
          h('div', { class: 'alert alert-info d-flex align-items-start gap-2 mb-4 py-2' },
            h('i', { class: 'bi bi-info-circle-fill mt-1 flex-shrink-0' }),
            h('div', { class: 'small' },
              h('strong', {}, 'AI Provider & Keys'), ': choose on the ',
              h('a', { href: '#/schema', class: 'alert-link' }, 'Schema Generator page'),
              '. Keys are set in the ',
              h('a', { href: '#', id: 'sgGoApiKeys', class: 'alert-link' }, 'API Keys tab'), '.'
            )
          ),
          // Template 1: Markdown
          h('div', { class: 'mb-4' },
            h('label', { class: 'form-label fw-bold' },
              h('i', { class: 'bi bi-file-earmark-text me-1' }),
              ' Template 1 — Import Webpage / Paste Markdown'
            ),
            h('div', { class: 'alert alert-secondary py-2 px-3 mb-2 small' },
              h('i', { class: 'bi bi-info-circle me-1' }),
              'Used when you import a URL or paste Markdown. Must include ',
              h('code', {}, '[PAGE_MARKDOWN]'), ' where the content is injected.'
            ),
            h('textarea', {
              class: 'form-control cosmic-input font-monospace',
              id: 'sgPromptTemplate',
              rows: '10',
              placeholder: 'Analyze the following webpage content and generate JSON-LD...\n\n[PAGE_MARKDOWN]'
            })
          ),
          // Template 2: URL List
          h('div', { class: 'mb-4' },
            h('label', { class: 'form-label fw-bold' },
              h('i', { class: 'bi bi-list-ul me-1' }),
              ' Template 2 — List of URLs'
            ),
            h('div', { class: 'alert alert-secondary py-2 px-3 mb-2 small' },
              h('i', { class: 'bi bi-info-circle me-1' }),
              'Used for the “List of URLs” tab. Must include ',
              h('code', {}, '[PAGE_URL]'), ' where the URL is injected.'
            ),
            h('textarea', {
              class: 'form-control cosmic-input font-monospace',
              id: 'sgUrlPromptTemplate',
              rows: '10',
              placeholder: 'Analyze the following webpage URL and generate JSON-LD...\n\nPage URL: [PAGE_URL]'
            })
          ),
          // Template 3: Identify applicable schema types
          h('div', { class: 'mb-4' },
            h('label', { class: 'form-label fw-bold' },
              h('i', { class: 'bi bi-search me-1' }),
              ' Template 3 — Identify applicable Schema Types'
            ),
            h('div', { class: 'alert alert-secondary py-2 px-3 mb-2 small' },
              h('i', { class: 'bi bi-info-circle me-1' }),
              'Used when clicking "Identify applicable Schema Types" on the List of URLs tab. Must include ',
              h('code', {}, '[PAGE_URL]'), ' where the URL is injected. The AI will identify applicable schema types without writing markup.'
            ),
            h('textarea', {
              class: 'form-control cosmic-input font-monospace',
              id: 'sgIdentifyPromptTemplate',
              rows: '10',
              placeholder: 'Identify ALL applicable Schema.org types...\n\nPage URL: [PAGE_URL]'
            })
          ),
          h('div', { class: 'd-flex justify-content-end' },
            h('button', { class: 'btn btn-success cosmic-btn', id: 'sgSaveBtn' },
              h('i', { class: 'bi bi-save me-1' }), 'Save All Templates'
            )
          )
        )
      )
    )
  );

  root.append(header, tabNav, tabContent);

  // ── Schema Gen Settings handlers ──────────────────────────────────────────
  (async () => {
    // Load both saved templates
    try {
      const sg = await api.get('schema-settings.php');
      if (sg) {
        if (sg.prompt_template) {
          const el = $('#sgPromptTemplate');
          if (el) el.value = sg.prompt_template;
        }
        if (sg.url_prompt_template) {
          const el = $('#sgUrlPromptTemplate');
          if (el) el.value = sg.url_prompt_template;
        }
        if (sg.identify_prompt_template) {
          const el = $('#sgIdentifyPromptTemplate');
          if (el) el.value = sg.identify_prompt_template;
        }
      }
    } catch { }

    // "Go to API Keys" shortcut
    $('#sgGoApiKeys')?.addEventListener('click', (e) => {
      e.preventDefault();
      document.getElementById('apikeys-tab')?.click();
    });

    // Save both templates
    $('#sgSaveBtn')?.addEventListener('click', async () => {
      const promptTemplate = $('#sgPromptTemplate')?.value?.trim() || '';
      const urlPromptTemplate = $('#sgUrlPromptTemplate')?.value?.trim() || '';

      if (!promptTemplate) { toast('Template 1 (Markdown) cannot be empty', 'warning'); return; }
      if (!promptTemplate.includes('[PAGE_MARKDOWN]')) {
        toast('Template 1 must include [PAGE_MARKDOWN]', 'warning'); return;
      }
      if (!urlPromptTemplate) { toast('Template 2 (URL List) cannot be empty', 'warning'); return; }
      if (!urlPromptTemplate.includes('[PAGE_URL]')) {
        toast('Template 2 must include [PAGE_URL]', 'warning'); return;
      }
      const identifyPromptTemplate = $('#sgIdentifyPromptTemplate')?.value?.trim() || '';
      if (!identifyPromptTemplate) { toast('Template 3 (Identify) cannot be empty', 'warning'); return; }
      if (!identifyPromptTemplate.includes('[PAGE_URL]')) {
        toast('Template 3 must include [PAGE_URL]', 'warning'); return;
      }

      try {
        const res = await api.post('schema-settings.php', {
          provider: 'global',
          prompt_template: promptTemplate,
          url_prompt_template: urlPromptTemplate,
          identify_prompt_template: identifyPromptTemplate
        });
        if (res.success) {
          toast('All prompt templates saved!', 'success');
        } else {
          throw new Error(res.error || 'Save failed');
        }
      } catch (err) {
        toast('Error saving: ' + err.message, 'danger');
      }
    });
  })();

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
    const catSel = $('#editTplCategory');
    if (catSel) catSel.value = detail.category || '';

    // Populate is_public toggle
    const pubToggle = $('#editTplIsPublic');
    const pubHint = $('#editTplVisibilityHint');
    if (pubToggle) {
      pubToggle.checked = !!parseInt(detail.is_public);
      if (pubHint) {
        pubHint.textContent = pubToggle.checked
          ? '🌐 Public — visible and usable by all users'
          : '🔒 Private — only visible to you';
      }
      // Wire hint on change
      pubToggle.onchange = () => {
        if (pubHint) {
          pubHint.textContent = pubToggle.checked
            ? '🌐 Public — visible and usable by all users'
            : '🔒 Private — only visible to you';
        }
      };
    }

    const cont = $('#editVarContainer');
    cont.innerHTML = '';
    (detail.variables || []).forEach((v, i) => cont.append(editVariableRow(v, i)));
    updateRowNumbers(cont);

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

    // Variable search
    const varSearchInp = $('#editVarSearch');
    if (varSearchInp) {
      varSearchInp.addEventListener('input', () => {
        const q = varSearchInp.value.toLowerCase();
        cont.querySelectorAll('.variable-row').forEach(row => {
          const name = (row.querySelector('.evar-name')?.value || '').toLowerCase();
          const label = (row.querySelector('.evar-label')?.value || '').toLowerCase();
          row.style.display = (!q || name.includes(q) || label.includes(q)) ? '' : 'none';
        });
      });
    }

    // Add variable button
    $('#addVarBtn').onclick = () => {
      const newRow = editVariableRow({ variable_name: 'new-variable', field_label: 'New Variable', field_type: 'text' }, cont.children.length);
      cont.append(newRow);
      updateRowNumbers(cont);
      flashRow(newRow);
    };

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

        const category = $('#editTplCategory')?.value || null;
        const isPublic = $('#editTplIsPublic')?.checked ? 1 : 0;
        const payload = { id: editTplCurrent.id, template_name: name, prompt_text: text, category, is_public: isPublic, variables: vars };
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


function updateRowNumbers(container) {
  [...container.children].forEach((row, i) => {
    const numEl = row.querySelector('.evar-rownum');
    if (numEl) numEl.value = i + 1;
  });
}

function editVariableRow(v, index) {
  const row = h('div', { class: 'variable-row mb-2 border rounded p-2', 'data-index': index });

  // Row header: number + search label + move controls
  const rowHeader = h('div', { class: 'd-flex align-items-center gap-2 mb-2' });

  // Row number input (editable for direct jump)
  const rowNumInput = h('input', {
    type: 'number', class: 'form-control form-control-sm cosmic-input evar-rownum',
    value: index + 1, min: '1', style: 'width:60px;text-align:center;',
    title: 'Row number — type to jump'
  });
  rowNumInput.addEventListener('change', async () => {
    const container = row.parentElement;
    const siblings = [...container.children];
    const currentIdx = siblings.indexOf(row);
    const targetIdx = Math.max(0, Math.min(parseInt(rowNumInput.value) - 1, siblings.length - 1));
    if (targetIdx === currentIdx) { rowNumInput.value = currentIdx + 1; return; }

    // Prompt for move mode
    const swapOk = await confirmDialog({
      title: 'Move Field',
      body: `Move "<strong>${v.variable_name}</strong>" from position ${currentIdx + 1} to ${targetIdx + 1}.<br><br>
             <div class="d-grid gap-2 mt-2">
               <button class="btn btn-outline-light" id="moveModeSh">Scoot all fields down 1 row</button>
               <button class="btn btn-primary" id="moveModeSwap">Swap with field at position ${targetIdx + 1}</button>
             </div>`,
      okText: null, // no default ok
      noFooter: true
    }).catch(() => null);

    // confirmDialog resolves after user clicks one of the custom buttons
    const modeEl = document.getElementById('__moveMode');
    const mode = modeEl ? modeEl.value : 'scoot';

    if (mode === 'swap') {
      const target = siblings[targetIdx];
      if (target) {
        const tempHolder = document.createElement('div');
        container.insertBefore(tempHolder, target);
        container.insertBefore(target, row);
        container.insertBefore(row, tempHolder);
        tempHolder.remove();
      }
    } else {
      // Scoot: remove and re-insert at target
      container.removeChild(row);
      const newSiblings = [...container.children];
      if (targetIdx >= newSiblings.length) container.appendChild(row);
      else container.insertBefore(row, newSiblings[targetIdx]);
    }
    updateRowNumbers(container);
    flashRow(row);
  });

  rowHeader.append(
    h('span', { class: 'text-muted small fw-bold', style: 'white-space:nowrap' }, 'Row'),
    rowNumInput,
    h('span', { class: 'fw-semibold flex-grow-1 ms-1 text-truncate', title: v.variable_name || '' }, v.variable_name || '(new)'),
    h('button', {
      type: 'button', class: 'btn btn-sm btn-outline-light cosmic-btn ms-auto', title: 'Move up',
      onclick: () => { moveRow(row, -1); flashRow(row); }
    }, h('i', { class: 'bi bi-arrow-up' })),
    h('button', {
      type: 'button', class: 'btn btn-sm btn-outline-light cosmic-btn', title: 'Move down',
      onclick: () => { moveRow(row, 1); flashRow(row); }
    }, h('i', { class: 'bi bi-arrow-down' })),
    h('button', {
      type: 'button', class: 'btn btn-sm btn-outline-danger cosmic-btn', title: 'Remove',
      onclick: () => { row.remove(); updateRowNumbers(row.parentElement); }
    }, h('i', { class: 'bi bi-x-lg' }))
  );

  row.appendChild(rowHeader);

  // Field inputs
  row.appendChild(h('div', { class: 'row g-2' },
    h('div', { class: 'col-md-4' },
      h('label', { class: 'form-label small fw-bold mb-1' }, 'Variable Name'),
      h('input', { class: 'form-control form-control-sm cosmic-input evar-name', value: v.variable_name || '', placeholder: 'e.g., recipient' })
    ),
    h('div', { class: 'col-md-5' },
      h('label', { class: 'form-label small fw-bold mb-1' }, 'Field Label'),
      h('input', { class: 'form-control form-control-sm cosmic-input evar-label', value: v.field_label || '', placeholder: 'Readable label' })
    ),
    h('div', { class: 'col-md-3' },
      h('label', { class: 'form-label small fw-bold mb-1' }, 'Input Type'),
      (() => {
        const select = h('select', { class: 'form-select form-select-sm cosmic-input evar-type' });
        ['text', 'textarea', 'number', 'date', 'email', 'url'].forEach(t =>
          select.append(h('option', { value: t, ...(v.field_type === t ? { selected: true } : {}) }, t))
        );
        return select;
      })()
    )
  ));

  return row;
}

function flashRow(row) {
  row.style.transition = 'background 0.1s';
  row.style.background = 'rgba(99,102,241,0.35)';
  setTimeout(() => { row.style.background = ''; }, 700);
}

function moveRow(row, dir) {
  const container = row.parentElement;
  const siblings = [...container.children];
  const idx = siblings.indexOf(row);
  const newIdx = idx + dir;
  if (newIdx < 0 || newIdx >= siblings.length) return;
  if (dir < 0) { container.insertBefore(row, siblings[newIdx]); }
  else { container.insertBefore(row, siblings[newIdx].nextSibling); }
  updateRowNumbers(container);
}

// --- Users Management (Admin Only) ---

let _usersData = [];
let _usersSortKey = 'username';
let _usersSortDir = 1; // 1 = asc, -1 = desc

async function renderUsers() {
  const root = $('#view-root');
  root.innerHTML = '';

  // Admin check (admin or super_admin)
  if (!window._currentUser || (window._currentUser.role !== 'admin' && window._currentUser.role !== 'super_admin')) {
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
  renderSsoManager();  // SSO section below the users table

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
              credentials: 'same-origin',
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
              credentials: 'same-origin',
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
        // Inline role select (admins can change roles)
        const roleSelect = document.createElement('select');
        roleSelect.className = `role-badge ${user.role || 'user'} form-select-sm`;
        roleSelect.style.cssText = 'background:transparent;border:none;padding:0.15rem .4rem;border-radius:.3rem;font-size:.8rem;font-weight:600;cursor:pointer;outline:none;';
        [['user', 'User'], ['admin', 'Admin'], ['super_admin', 'Super Admin']].forEach(([v, l]) => {
          const opt = document.createElement('option');
          opt.value = v;
          opt.textContent = l;
          if (v === (user.role || 'user')) opt.selected = true;
          roleSelect.appendChild(opt);
        });
        roleSelect.addEventListener('change', async () => {
          const newRole = roleSelect.value;
          if (newRole === user.role) return;
          try {
            const res = await fetch(API_BASE + 'users.php', {
              method: 'PUT',
              credentials: 'same-origin',
              headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
              body: JSON.stringify({ id: user.id, username: user.username, role: newRole })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Update failed');
            user.role = newRole;
            const idx = _usersData.findIndex(u => u.id === user.id);
            if (idx !== -1) _usersData[idx].role = newRole;
            roleSelect.className = `role-badge ${newRole} form-select-sm`;
            toast(`Role updated to ${newRole}`, 'success');
          } catch (e) { toast('Role update failed: ' + e.message, 'danger'); roleSelect.value = user.role; }
        });
        td.append(roleSelect);
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

// ── SSO Link Manager ─────────────────────────────────────────────────────────
async function renderSsoManager() {
  const root = $('#view-root');
  if (!root) return;

  // Section container
  const section = h('div', { id: 'ssoManagerSection', class: 'mt-4' });
  root.appendChild(section);

  section.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:.75rem;margin-bottom:1rem;">
      <div>
        <h4 style="margin:0;" class="text-gradient"><i class="bi bi-link-45deg me-2"></i>SSO Login Links</h4>
        <p class="text-muted small mb-0">Generate single-use, time-limited links that log a user in without a password.</p>
      </div>
      <button class="btn btn-primary cosmic-btn" id="ssoCreateBtn" data-ripple>
        <i class="bi bi-plus-circle me-1"></i> Generate New SSO Link
      </button>
    </div>

    <!-- Generate form (collapsed by default) -->
    <div id="ssoForm" style="display:none;" class="card card-surface mb-3 p-3">
      <h6 class="mb-3"><i class="bi bi-magic me-1"></i>Create SSO Link</h6>
      <div class="row g-3">
        <div class="col-md-4">
          <label class="form-label fw-bold small">User <span class="text-danger">*</span></label>
          <select class="form-select cosmic-input" id="ssoUserId">
            <option value="">Loading users…</option>
          </select>
        </div>
        <div class="col-md-4">
          <label class="form-label fw-bold small">Label / Purpose</label>
          <input type="text" class="form-control cosmic-input" id="ssoLabel" placeholder="e.g. Client demo, Client onboarding" maxlength="100">
        </div>
        <div class="col-md-4">
          <label class="form-label fw-bold small">Expires In</label>
          <select class="form-select cosmic-input" id="ssoTtl">
            <option value="24">24 hours</option>
            <option value="72">3 days</option>
            <option value="168" selected>7 days (default)</option>
            <option value="336">14 days</option>
            <option value="720">30 days</option>
          </select>
        </div>
      </div>
      <div class="d-flex gap-2 mt-3">
        <button class="btn btn-success cosmic-btn" id="ssoDoCreate"><i class="bi bi-check-circle me-1"></i>Generate Link</button>
        <button class="btn btn-outline-secondary cosmic-btn" id="ssoCancelCreate"><i class="bi bi-x me-1"></i>Cancel</button>
      </div>
      <!-- Result area -->
      <div id="ssoResult" style="display:none;" class="mt-3 p-3 rounded" style="background:rgba(6,182,212,0.06);border:1px solid rgba(6,182,212,0.3);">
        <div class="fw-bold small mb-1" style="color:#38bdf8;"><i class="bi bi-check-circle me-1"></i>SSO Link Generated!</div>
        <div class="input-group mt-1">
          <input type="text" class="form-control cosmic-input font-monospace" id="ssoLinkOutput" readonly style="font-size:.78rem;">
          <button class="btn btn-outline-info cosmic-btn" id="ssoCopyLink" title="Copy link"><i class="bi bi-clipboard"></i></button>
        </div>
        <div class="text-muted small mt-1" id="ssoResultMeta"></div>
      </div>
    </div>

    <!-- Tokens table -->
    <div class="card card-surface" id="ssoTableWrap">
      <div class="text-center p-4">
        <div class="spinner-border text-primary" role="status"></div>
        <p class="text-muted mt-2 mb-0 small">Loading SSO tokens…</p>
      </div>
    </div>
  `;

  // Populate user dropdown
  try {
    const users = await fetch(API_BASE + 'sso.php?action=list_users', { credentials: 'same-origin' }).then(r => r.json());
    const sel = document.getElementById('ssoUserId');
    sel.innerHTML = '<option value="">— Select user —</option>';
    (users || []).forEach(u => {
      const opt = document.createElement('option');
      opt.value = u.id;
      opt.textContent = `${u.username} (${u.role})`;
      sel.appendChild(opt);
    });
  } catch (e) { /* ignore */ }

  // Toggle form
  document.getElementById('ssoCreateBtn').addEventListener('click', () => {
    const f = document.getElementById('ssoForm');
    f.style.display = f.style.display === 'none' ? '' : 'none';
    document.getElementById('ssoResult').style.display = 'none';
  });
  document.getElementById('ssoCancelCreate').addEventListener('click', () => {
    document.getElementById('ssoForm').style.display = 'none';
  });

  // Copy generated link
  document.getElementById('ssoCopyLink').addEventListener('click', async () => {
    const link = document.getElementById('ssoLinkOutput').value;
    try {
      await navigator.clipboard.writeText(link);
      toast('SSO link copied to clipboard!', 'success');
    } catch { toast('Copy failed', 'danger'); }
  });

  // Generate link
  document.getElementById('ssoDoCreate').addEventListener('click', async () => {
    const userId = document.getElementById('ssoUserId').value;
    const label = document.getElementById('ssoLabel').value.trim();
    const ttlHours = parseInt(document.getElementById('ssoTtl').value, 10);
    if (!userId) { toast('Please select a user', 'warning'); return; }

    const btn = document.getElementById('ssoDoCreate');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Generating…';
    try {
      const res = await fetch(API_BASE + 'sso.php?action=create', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: parseInt(userId), label, ttl_hours: ttlHours })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');

      document.getElementById('ssoLinkOutput').value = data.sso_url;
      document.getElementById('ssoResultMeta').textContent =
        `For: ${data.for_user} · Expires in: ${data.expires_in} · Single-use · Invalidated after first click`;
      document.getElementById('ssoResult').style.display = '';
      toast('SSO link generated!', 'success');
      loadSsoTokens(); // refresh table
    } catch (e) {
      toast('Failed: ' + e.message, 'danger');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i class="bi bi-check-circle me-1"></i>Generate Link';
    }
  });

  loadSsoTokens();
}

async function loadSsoTokens() {
  const wrap = document.getElementById('ssoTableWrap');
  if (!wrap) return;

  let tokens = [];
  try {
    const res = await fetch(API_BASE + 'sso.php?action=list', { credentials: 'same-origin' });
    tokens = await res.json();
    if (!Array.isArray(tokens)) tokens = [];
  } catch (e) {
    wrap.innerHTML = `<div class="alert alert-danger m-3">Failed to load SSO tokens: ${e.message}</div>`;
    return;
  }

  if (tokens.length === 0) {
    wrap.innerHTML = `
      <div class="text-center text-muted p-4">
        <i class="bi bi-link-45deg fs-1 mb-2 d-block" style="opacity:.3;"></i>
        No SSO links generated yet. Click "Generate New SSO Link" above to create one.
      </div>`;
    return;
  }

  // Status badge helper
  const statusBadge = (status) => {
    const map = {
      active: ['bg-success', '✅ Active'],
      used: ['bg-secondary', '✔ Used'],
      expired: ['bg-danger', '⏰ Expired'],
    };
    const [cls, label] = map[status] || ['bg-secondary', status];
    return `<span class="badge ${cls}" style="font-size:.72rem;">${label}</span>`;
  };

  wrap.innerHTML = `
    <table class="users-table" style="font-size:.83rem;">
      <thead><tr>
        <th>For User</th>
        <th>Label</th>
        <th>Status</th>
        <th>Created</th>
        <th>Expires</th>
        <th>Used At</th>
        <th>Created By</th>
        <th style="min-width:5rem;">Actions</th>
      </tr></thead>
      <tbody>
        ${tokens.map(t => `
          <tr data-sso-id="${t.id}">
            <td><strong>${t.for_user}</strong></td>
            <td class="text-muted">${t.label || '<em>—</em>'}</td>
            <td>${statusBadge(t.status)}</td>
            <td>${formatRelativeTime(t.created_at)}</td>
            <td>${formatRelativeTime(t.expires_at)}</td>
            <td>${t.used_at ? formatRelativeTime(t.used_at) : '<span class="text-muted">—</span>'}</td>
            <td class="text-muted small">${t.created_by}</td>
            <td>
              <button class="btn btn-sm btn-outline-danger sso-revoke-btn" data-id="${t.id}" title="Revoke & delete this token">
                <i class="bi bi-trash"></i>
              </button>
            </td>
          </tr>`).join('')}
      </tbody>
    </table>
    <div class="p-2 px-3 text-muted small">${tokens.length} SSO link${tokens.length !== 1 ? 's' : ''} total</div>
  `;

  // Revoke button handlers
  wrap.querySelectorAll('.sso-revoke-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      if (!confirm('Permanently delete this SSO token? It can no longer be used.')) return;
      btn.disabled = true;
      try {
        const res = await fetch(API_BASE + 'sso.php?action=revoke', {
          method: 'DELETE',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: parseInt(id) })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Revoke failed');
        toast('SSO token revoked', 'success');
        loadSsoTokens();
      } catch (e) {
        toast('Revoke failed: ' + e.message, 'danger');
        btn.disabled = false;
      }
    });
  });
}

function formatRelativeTime(isoStr) {
  if (!isoStr) return '—';
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return isoStr;
    const diff = Date.now() - d.getTime();
    const abs = Math.abs(diff);
    const mins = Math.floor(abs / 60000);
    const hours = Math.floor(abs / 3600000);
    const days = Math.floor(abs / 86400000);
    const future = diff < 0;
    let rel;
    if (mins < 2) rel = 'just now';
    else if (mins < 60) rel = `${mins}m`;
    else if (hours < 48) rel = `${hours}h`;
    else rel = `${days}d`;
    if (mins >= 2) rel = future ? `in ${rel}` : `${rel} ago`;
    const full = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      + ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    return `<span title="${full}" style="cursor:default;">${rel}</span>`;
  } catch { return isoStr; }
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
        <label class="form-label fw-bold">Role Type</label>
        <select class="form-select cosmic-input" id="newRole">
          <option value="user">User — Can generate &amp; manage own templates</option>
          <option value="admin">Admin — Full access except user management</option>
          <option value="super_admin">Super Admin — Full access including all users &amp; templates</option>
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
  // Show admin-only nav items (admin and super_admin both see Users)
  const usersNav = $('#navUsers');
  if (usersNav) usersNav.style.display = (user.role === 'admin' || user.role === 'super_admin') ? '' : 'none';
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
  try { initThemeSwitcher(); } catch (e) { console.warn('Theme init error:', e); }
  try { initFallingStars(); initRipple(); } catch (e) { console.warn('UI effects init error:', e); }
  try { initAuthHandlers(); } catch (e) { console.warn('Auth handlers init error:', e); }

  // ── SSO token auto-login ─────────────────────────────────────────────────
  const urlParams = new URLSearchParams(location.search);
  const ssoToken = urlParams.get('sso_token');

  if (ssoToken) {
    // Show a "signing in" spinner instead of the login form
    const overlay = $('#loginOverlay');
    if (overlay) {
      overlay.style.display = '';
      const form = overlay.querySelector('#loginForm');
      if (form) form.style.display = 'none';
      const spinDiv = document.createElement('div');
      spinDiv.style.cssText = 'text-align:center;padding:2rem;';
      spinDiv.innerHTML = `
        <div class="spinner-border text-primary mb-3" role="status" style="width:3rem;height:3rem;"></div>
        <div class="fw-bold" style="font-size:1.1rem;">Signing you in…</div>
        <div class="text-muted small mt-1">Validating your secure link</div>
      `;
      overlay.querySelector('.login-card')?.appendChild(spinDiv);
    }

    try {
      const res = await fetch(API_BASE + 'sso.php?action=redeem&token=' + encodeURIComponent(ssoToken), {
        credentials: 'same-origin',
        headers: { 'Accept': 'application/json' }
      });
      const data = await res.json().catch(() => null);

      if (res.ok && data && data.success) {
        // Token redeemed — clean the URL then check session
        history.replaceState({}, '', location.pathname);
        const user = await checkAuth();
        if (user) {
          showApp(user);
          await loadTemplates();
          setActiveNav();
          router();
          toast(`Welcome, ${user.username}! Signed in via secure link.`, 'success');
          return;
        }
      }
      // Redeem failed — show error on login overlay
      const errEl = $('#loginError');
      if (errEl) {
        errEl.textContent = (data && data.error) || 'SSO link is invalid or expired.';
        errEl.classList.remove('d-none');
      }
      const form = $('#loginForm');
      if (form) form.style.display = '';
      overlay?.querySelector('.spinner-border')?.closest('div[style]')?.remove();
    } catch (err) {
      console.warn('SSO redeem error:', err);
      const form = $('#loginForm');
      if (form) form.style.display = '';
    }
    // Clean token from URL regardless
    history.replaceState({}, '', location.pathname);
    return;
  }

  // ── Regular session check ────────────────────────────────────────────────
  try {
    const user = await checkAuth();
    if (user) {
      showApp(user);
      try { await loadTemplates(); } catch (e) { console.warn('Initial template load failed:', e); }
      setActiveNav();
      router();
    }
  } catch (e) {
    console.warn('Boot auth check error:', e);
  }
})();

