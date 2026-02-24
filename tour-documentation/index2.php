<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Prompt DB — Documentation</title>
<meta name="description" content="Full feature documentation for every page and function in the Prompt DB web application.">
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
<link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;900&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
  :root {
    --brand: #7c3aed;
    --brand2: #06b6d4;
    --bg: #0d0f17;
    --surface: #13161f;
    --surface2: #1b1f2e;
    --border: rgba(255,255,255,0.09);
    --text: #e2e8f0;
    --muted: #64748b;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: var(--bg); color: var(--text); font-family: 'Inter', sans-serif; font-size: 0.95rem; line-height: 1.7; }

  /* Sidebar */
  #sidebar {
    position: fixed; left: 0; top: 0; bottom: 0; width: 260px;
    background: var(--surface); border-right: 1px solid var(--border);
    overflow-y: auto; z-index: 100; padding: 1.5rem 0;
    transition: transform .3s;
  }
  #sidebar .logo { padding: 0 1.5rem 1.5rem; border-bottom: 1px solid var(--border); margin-bottom: 1rem; }
  #sidebar .logo h1 { font-size: 1.15rem; font-weight: 800; background: linear-gradient(135deg, var(--brand), var(--brand2)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  #sidebar .logo p { color: var(--muted); font-size: 0.75rem; }
  #sidebar nav a {
    display: flex; align-items: center; gap: 0.6rem;
    padding: 0.55rem 1.5rem; color: var(--muted); text-decoration: none;
    font-size: 0.85rem; font-weight: 500; border-left: 3px solid transparent;
    transition: all .2s;
  }
  #sidebar nav a:hover, #sidebar nav a.active {
    color: var(--text); border-left-color: var(--brand);
    background: rgba(124,58,237,0.08);
  }
  #sidebar nav .section-label { padding: 1rem 1.5rem 0.3rem; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: var(--muted); }

  /* Main */
  main { margin-left: 260px; padding: 2.5rem; max-width: 1100px; }

  /* Hero */
  .hero {
    background: linear-gradient(135deg, rgba(124,58,237,0.18) 0%, rgba(6,182,212,0.10) 100%);
    border: 1px solid var(--border); border-radius: 1.25rem;
    padding: 3rem; margin-bottom: 3rem; text-align: center;
  }
  .hero h1 { font-size: 2.6rem; font-weight: 900; background: linear-gradient(135deg, #a78bfa, #38bdf8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: .5rem; }
  .hero p { color: var(--muted); font-size: 1.05rem; margin-bottom: 1.5rem; }
  .badge-pill { display: inline-flex; align-items: center; gap: .4rem; background: rgba(124,58,237,0.2); border: 1px solid rgba(124,58,237,0.4); color: #a78bfa; border-radius: 999px; padding: .3rem .9rem; font-size: .8rem; font-weight: 600; }

  /* Section */
  .doc-section { margin-bottom: 4rem; scroll-margin-top: 1.5rem; }
  .section-header {
    display: flex; align-items: center; gap: .75rem;
    padding: 1.25rem 1.5rem; background: var(--surface);
    border: 1px solid var(--border); border-radius: 1rem 1rem 0 0;
    border-bottom: 2px solid var(--brand);
  }
  .section-header .icon-circle {
    width: 42px; height: 42px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 1.2rem; flex-shrink: 0;
    background: linear-gradient(135deg, rgba(124,58,237,0.3), rgba(6,182,212,0.2));
    border: 1px solid rgba(124,58,237,0.3);
  }
  .section-header h2 { font-size: 1.3rem; font-weight: 700; color: #fff; margin: 0; }
  .section-header p { font-size: 0.8rem; color: var(--muted); margin: 0; }
  .section-body { background: var(--surface2); border: 1px solid var(--border); border-top: none; border-radius: 0 0 1rem 1rem; padding: 1.75rem; }

  /* Feature cards */
  .feature-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1rem; margin-top: 1rem; }
  .feature-card {
    background: rgba(255,255,255,0.03); border: 1px solid var(--border);
    border-radius: .75rem; padding: 1.1rem;
    transition: border-color .2s, transform .2s;
  }
  .feature-card:hover { border-color: rgba(124,58,237,0.4); transform: translateY(-2px); }
  .feature-card .fc-icon { font-size: 1.4rem; margin-bottom: .5rem; }
  .feature-card h4 { font-size: .9rem; font-weight: 700; color: #fff; margin-bottom: .25rem; }
  .feature-card p { font-size: .8rem; color: var(--muted); margin: 0; }

  /* Function table */
  .fn-table { width: 100%; border-collapse: collapse; margin-top: 1rem; font-size: .85rem; }
  .fn-table th { background: rgba(124,58,237,0.12); color: #a78bfa; font-weight: 600; padding: .6rem 1rem; text-align: left; border-bottom: 1px solid var(--border); }
  .fn-table td { padding: .65rem 1rem; border-bottom: 1px solid var(--border); vertical-align: top; color: var(--text); }
  .fn-table tr:last-child td { border-bottom: none; }
  .fn-table tr:hover td { background: rgba(255,255,255,0.02); }
  .fn-name { font-family: 'JetBrains Mono', monospace; font-size: .8rem; color: var(--brand2); font-weight: 600; }
  .fn-desc { color: var(--muted); font-size: .8rem; }

  /* Steps */
  .steps { counter-reset: step; margin-top: 1rem; display: flex; flex-direction: column; gap: .6rem; }
  .step { display: flex; gap: 1rem; align-items: flex-start; }
  .step::before { counter-increment: step; content: counter(step); display: flex; align-items: center; justify-content: center; min-width: 28px; height: 28px; border-radius: 50%; background: linear-gradient(135deg, var(--brand), var(--brand2)); color: #fff; font-size: .8rem; font-weight: 700; flex-shrink: 0; margin-top: .15rem; }
  .step p { margin: 0; font-size: .88rem; color: var(--text); }
  .step strong { color: #a78bfa; }

  /* Tip box */
  .tip { background: rgba(6,182,212,0.08); border: 1px solid rgba(6,182,212,0.25); border-radius: .6rem; padding: .85rem 1rem; margin-top: 1rem; font-size: .85rem; display: flex; gap: .6rem; }
  .tip i { color: #38bdf8; flex-shrink: 0; font-size: 1rem; margin-top: .1rem; }

  /* Warning box */
  .warn { background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.25); border-radius: .6rem; padding: .85rem 1rem; margin-top: .75rem; font-size: .85rem; display: flex; gap: .6rem; }
  .warn i { color: #fbbf24; flex-shrink: 0; font-size: 1rem; margin-top: .1rem; }

  /* API table */
  .api-row { display: flex; gap: .5rem; align-items: baseline; flex-wrap: wrap; margin-bottom: .3rem; }
  .method { padding: .15rem .55rem; border-radius: .3rem; font-family: 'JetBrains Mono', monospace; font-size: .75rem; font-weight: 700; }
  .method.get { background: rgba(16,185,129,0.2); color: #10b981; }
  .method.post { background: rgba(59,130,246,0.2); color: #60a5fa; }
  .method.put { background: rgba(245,158,11,0.2); color: #fbbf24; }
  .method.delete { background: rgba(239,68,68,0.2); color: #f87171; }
  .endpoint { font-family: 'JetBrains Mono', monospace; font-size: .8rem; color: var(--brand2); }

  /* Tag badges */
  .tag { display: inline-block; padding: .15rem .55rem; border-radius: .3rem; font-size: .72rem; font-weight: 600; margin-right: .25rem; }
  .tag-new { background: rgba(16,185,129,0.2); color: #10b981; }
  .tag-owner { background: rgba(124,58,237,0.2); color: #a78bfa; }
  .tag-all { background: rgba(6,182,212,0.2); color: #38bdf8; }

  /* Responsive */
  @media (max-width: 768px) {
    #sidebar { transform: translateX(-100%); }
    #sidebar.open { transform: translateX(0); }
    main { margin-left: 0; padding: 1.25rem; }
    .hero h1 { font-size: 1.8rem; }
  }
  #menuToggle { display: none; position: fixed; top: 1rem; left: 1rem; z-index: 200; background: var(--brand); color: #fff; border: none; border-radius: .5rem; padding: .5rem .75rem; cursor: pointer; }
  @media (max-width: 768px) { #menuToggle { display: block; } }

  /* scroll highlight */
  :target { scroll-margin-top: 80px; }
</style>
</head>
<body>

<button id="menuToggle" onclick="document.getElementById('sidebar').classList.toggle('open')">☰</button>

<aside id="sidebar">
  <div class="logo">
    <h1>⚡ Prompt DB</h1>
    <p>Feature Documentation v1.0</p>
  </div>
  <nav id="toc">
    <div class="section-label">Overview</div>
    <a href="#overview"><i class="bi bi-house"></i> Introduction</a>
    <a href="#toast"><i class="bi bi-bell"></i> Toast Notifications</a>

    <div class="section-label">Pages</div>
    <a href="#generate"><i class="bi bi-magic"></i> Generate</a>
    <a href="#templates"><i class="bi bi-grid"></i> Templates</a>
    <a href="#history"><i class="bi bi-clock-history"></i> History</a>
    <a href="#profiles"><i class="bi bi-person-lines-fill"></i> Data Profiles</a>
    <a href="#schema"><i class="bi bi-braces"></i> Schema Generator</a>
    <a href="#settings"><i class="bi bi-gear"></i> Settings</a>
    <a href="#users"><i class="bi bi-people"></i> Users (Admin)</a>

    <div class="section-label">Technical</div>
    <a href="#api"><i class="bi bi-cloud"></i> API Endpoints</a>
    <a href="#auth"><i class="bi bi-shield-lock"></i> Auth & Sessions</a>
    <a href="#userflow"><i class="bi bi-diagram-3"></i> User Flow</a>
  </nav>
</aside>

<main>

  <!-- HERO -->
  <div class="hero" id="overview">
    <div class="mb-3">
      <span class="badge-pill"><i class="bi bi-stars"></i> Prompt DB Cosmic SPA</span>
    </div>
    <h1>Feature Documentation</h1>
    <p>Complete reference for every page, feature, and function in the Prompt DB web application.</p>
    <div class="d-flex gap-2 justify-content-center flex-wrap">
      <span class="badge bg-primary">7 Pages</span>
      <span class="badge bg-success">8 API Endpoints</span>
      <span class="badge bg-info text-dark">Public / Private Templates</span>
      <span class="badge bg-warning text-dark">AI Schema Generator</span>
    </div>
  </div>

  <!-- TOAST NOTIFICATIONS -->
  <div class="doc-section" id="toast">
    <div class="section-header">
      <div class="icon-circle">🔔</div>
      <div>
        <h2>Toast Notifications</h2>
        <p>App-wide non-blocking status messages — bottom-right, 15-second auto-dismiss</p>
      </div>
    </div>
    <div class="section-body">
      <p>Toast notifications appear in the <strong>bottom-right corner</strong> of the screen for every user-initiated action. They slide in with a smooth animation, auto-close after <strong>15 seconds</strong>, and can be manually dismissed with the ✕ button.</p>
      <div class="feature-grid">
        <div class="feature-card"><div class="fc-icon">✅</div><h4>Success</h4><p>Green — Confirms a successful save, create, copy, or delete.</p></div>
        <div class="feature-card"><div class="fc-icon">❌</div><h4>Error / Danger</h4><p>Red — Reports API failures, validation issues, or server errors.</p></div>
        <div class="feature-card"><div class="fc-icon">⚠️</div><h4>Warning</h4><p>Amber — Prompts user to fill required fields or check configuration.</p></div>
        <div class="feature-card"><div class="fc-icon">ℹ️</div><h4>Info</h4><p>Blue — General informational messages like re-parse notices.</p></div>
      </div>
      <div class="tip"><i class="bi bi-lightbulb-fill"></i><div>Every save, update, delete, copy, export, and import action triggers a toast. No result is silent — you always know if something succeeded or failed.</div></div>
    </div>
  </div>

  <!-- GENERATE -->
  <div class="doc-section" id="generate">
    <div class="section-header">
      <div class="icon-circle">🪄</div>
      <div>
        <h2>Generate</h2>
        <p>Route: <code>#/generate</code> — Fill template variables and produce a finished prompt</p>
      </div>
    </div>
    <div class="section-body">
      <div class="feature-grid">
        <div class="feature-card"><div class="fc-icon">📋</div><h4>Template Selector</h4><p>Dropdown to select from all your templates (and public templates from others).</p></div>
        <div class="feature-card"><div class="fc-icon">👤</div><h4>Profile Autofill</h4><p>Optionally select a Data Profile to pre-fill all variable fields instantly.</p></div>
        <div class="feature-card"><div class="fc-icon">🔤</div><h4>Dynamic Variable Form</h4><p>Auto-renders input fields for every <code>[variable]</code> in the selected template.</p></div>
        <div class="feature-card"><div class="fc-icon">⚡</div><h4>Generate Button</h4><p>Fills all <code>[variable]</code> tokens and produces the final ready-to-use prompt.</p></div>
        <div class="feature-card"><div class="fc-icon">📎</div><h4>Copy Button</h4><p>Copies the generated prompt to clipboard with a single click.</p></div>
        <div class="feature-card"><div class="fc-icon">🔄</div><h4>Reset Button</h4><p>Clears all variable inputs back to empty.</p></div>
        <div class="feature-card"><div class="fc-icon">🤖</div><h4>AI Chat (optional)</h4><p>Send the generated prompt directly to an AI provider (Claude, GPT-4o, Gemini) if an API key is configured in Settings.</p></div>
        <div class="feature-card"><div class="fc-icon">📝</div><h4>Save to History</h4><p>Successful prompt generations are auto-saved to the History log.</p></div>
      </div>

      <h5 class="mt-4 mb-2" style="color:#a78bfa">How to use</h5>
      <div class="steps">
        <div class="step"><p><strong>Select a template</strong> from the dropdown. The variable form renders dynamically.</p></div>
        <div class="step"><p>(Optional) <strong>Select a Data Profile</strong> to autofill all fields.</p></div>
        <div class="step"><p><strong>Fill in variable fields</strong> with your specific values.</p></div>
        <div class="step"><p>Click <strong>Generate</strong>. The finished prompt appears below.</p></div>
        <div class="step"><p>Click <strong>Copy</strong> to copy to clipboard, or send to AI if configured.</p></div>
      </div>
    </div>
  </div>

  <!-- TEMPLATES -->
  <div class="doc-section" id="templates">
    <div class="section-header">
      <div class="icon-circle">🗂️</div>
      <div>
        <h2>Templates</h2>
        <p>Route: <code>#/templates</code> — Create, manage, and share prompt templates</p>
      </div>
    </div>
    <div class="section-body">

      <h5 class="mb-2" style="color:#a78bfa">Create Template Form</h5>
      <div class="feature-grid">
        <div class="feature-card"><div class="fc-icon">✏️</div><h4>Name & Category</h4><p>Give each template a unique name (per-user) and optional category tag.</p></div>
        <div class="feature-card"><div class="fc-icon">🎨</div><h4>Group & Color</h4><p>Assign a named group and a color swatch for visual organization.</p></div>
        <div class="feature-card"><div class="fc-icon">🔒</div><h4>Visibility Toggle</h4><p><span class="tag tag-new">NEW</span> Toggle between Private (default) and Public. Public templates are usable by all authenticated users.</p></div>
        <div class="feature-card"><div class="fc-icon">🔍</div><h4>Parse Variables</h4><p>Click "Parse Variables" to auto-detect all <code>[bracketed]</code> tokens in the prompt text.</p></div>
        <div class="feature-card"><div class="fc-icon">⚙️</div><h4>Variable Config</h4><p>For each variable: set a human-readable label and input type (text, textarea, number, date, email, url).</p></div>
        <div class="feature-card"><div class="fc-icon">💾</div><h4>Save Template</h4><p>Saves the template and all variable configs. Toast confirmation shown on success.</p></div>
      </div>

      <h5 class="mt-4 mb-2" style="color:#a78bfa">Template List Table</h5>
      <table class="fn-table">
        <thead><tr><th>Column</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td class="fn-name">Name</td><td>Template name. Sortable. Click to open the Generate view with this template pre-selected.</td></tr>
          <tr><td class="fn-name">Category</td><td>Optional tag (Content, Schema, QA, Coding, Rich Media). Sortable & filterable.</td></tr>
          <tr><td class="fn-name">Group</td><td>Visual grouping label with color swatch.</td></tr>
          <tr><td class="fn-name">Uses</td><td>How many times this template has been used to generate prompts. Sortable.</td></tr>
          <tr><td class="fn-name">Visibility <span class="tag tag-new">NEW</span></td><td>🌐 Public or 🔒 Private badge. Non-owned public templates show the owner's username below.</td></tr>
          <tr><td class="fn-name">Created</td><td>Creation timestamp. Sortable.</td></tr>
          <tr><td class="fn-name">Actions</td><td>✏️ Edit (owner only), ▶️ Use in Generate (all), 🗑️ Delete (owner only).</td></tr>
        </tbody>
      </table>

      <h5 class="mt-4 mb-2" style="color:#a78bfa">Table Toolbar Features</h5>
      <div class="feature-grid">
        <div class="feature-card"><div class="fc-icon">🔎</div><h4>Global Search</h4><p>Filter templates by name in real-time from the top navbar search bar.</p></div>
        <div class="feature-card"><div class="fc-icon">✅</div><h4>Bulk Select</h4><p>Check any rows; bulk actions (Category, Group, Delete) appear in the toolbar.</p></div>
        <div class="feature-card"><div class="fc-icon">📤</div><h4>Export</h4><p>Export selected (or all) templates to a JSON file for backup or transfer.</p></div>
        <div class="feature-card"><div class="fc-icon">📥</div><h4>Import</h4><p>Import templates from a previously exported JSON file. Duplicates are skipped.</p></div>
        <div class="feature-card"><div class="fc-icon">🔢</div><h4>Sort Headers</h4><p>Click any column header to sort ascending/descending.</p></div>
        <div class="feature-card"><div class="fc-icon">🏷️</div><h4>Category Filter</h4><p>Filter the list by category using the dropdown above the table.</p></div>
      </div>

      <h5 class="mt-4 mb-2" style="color:#a78bfa">Edit Template Modal</h5>
      <p>Clicking ✏️ opens the Edit modal where you can update name, category, visibility <span class="tag tag-new">NEW</span>, prompt text, and all variable configs. Changes are saved immediately when you click <strong>Save Changes</strong>.</p>

      <div class="tip"><i class="bi bi-globe"></i><div><strong>Public Templates</strong> — When set to 🌐 Public, a template appears in every user's template list and Generate dropdown. Non-owners see the creator's username and can use (but not edit or delete) the template.</div></div>
      <div class="warn"><i class="bi bi-exclamation-triangle"></i><div>Template names must be unique <em>per user</em>. Two users can both have a template named "Blog Post"; only one user cannot have two templates with the same name.</div></div>
    </div>
  </div>

  <!-- HISTORY -->
  <div class="doc-section" id="history">
    <div class="section-header">
      <div class="icon-circle">🕰️</div>
      <div>
        <h2>History</h2>
        <p>Route: <code>#/history</code> — Audit log of all generated prompts and events</p>
      </div>
    </div>
    <div class="section-body">
      <div class="feature-grid">
        <div class="feature-card"><div class="fc-icon">📊</div><h4>Stats Cards</h4><p>At-a-glance counts: Prompts Generated, Templates Created, Errors Logged.</p></div>
        <div class="feature-card"><div class="fc-icon">🔵</div><h4>Prompt Entries</h4><p>Shows the full generated prompt text, the template used, timestamps, and variable values.</p></div>
        <div class="feature-card"><div class="fc-icon">🟢</div><h4>Template Entries</h4><p>Logs when a new template is created.</p></div>
        <div class="feature-card"><div class="fc-icon">🔴</div><h4>Error Entries</h4><p>Records failures with error message and context for debugging.</p></div>
        <div class="feature-card"><div class="fc-icon">🔍</div><h4>Filter Buttons</h4><p>Switch between All / Prompts / Templates / Errors views.</p></div>
        <div class="feature-card"><div class="fc-icon">📋</div><h4>Copy from History</h4><p>Re-copy any previously generated prompt directly from the History card.</p></div>
        <div class="feature-card"><div class="fc-icon">🔎</div><h4>Global Search</h4><p>Real-time filter across all history items by template name, prompt text, or error message.</p></div>
      </div>
      <div class="tip"><i class="bi bi-lightbulb-fill"></i><div>History entries use relative time ("5 minutes ago") for recent items, falling back to full date/time for older records.</div></div>
    </div>
  </div>

  <!-- DATA PROFILES -->
  <div class="doc-section" id="profiles">
    <div class="section-header">
      <div class="icon-circle">👤</div>
      <div>
        <h2>Data Profiles</h2>
        <p>Route: <code>#/profiles</code> — Save default variable values for reuse</p>
      </div>
    </div>
    <div class="section-body">
      <p>Data Profiles store a set of pre-filled values for template variables. When selected on the Generate page, all matching fields are auto-populated — saving time for repetitive workflows like "My Website" or "Client A".</p>
      <div class="feature-grid">
        <div class="feature-card"><div class="fc-icon">➕</div><h4>New Profile</h4><p>Create a named profile. All unique template variables from across your templates appear as fillable fields.</p></div>
        <div class="feature-card"><div class="fc-icon">✏️</div><h4>Edit Profile</h4><p>Click any profile in the sidebar to open and edit it. Changes save immediately.</p></div>
        <div class="feature-card"><div class="fc-icon">🗑️</div><h4>Delete Profile</h4><p>Delete a profile with confirmation. Templates are not affected.</p></div>
        <div class="feature-card"><div class="fc-icon">⚡</div><h4>Autofill on Generate</h4><p>Selecting a profile on the Generate page instantly fills all matching variable inputs.</p></div>
      </div>
      <div class="tip"><i class="bi bi-lightbulb-fill"></i><div>If you haven't created any templates yet, the Profile form will be empty — variable fields are derived from your template library.</div></div>
    </div>
  </div>

  <!-- SCHEMA GENERATOR -->
  <div class="doc-section" id="schema">
    <div class="section-header">
      <div class="icon-circle">🧬</div>
      <div>
        <h2>Schema Generator</h2>
        <p>Route: <code>#/schema</code> — AI-powered JSON-LD structured data generation</p>
      </div>
    </div>
    <div class="section-body">
      <h5 class="mb-2" style="color:#a78bfa">Input Modes (3 Tabs)</h5>
      <div class="feature-grid">
        <div class="feature-card"><div class="fc-icon">🌐</div><h4>Import Webpage</h4><p>Enter a URL — the app fetches and converts the page to Markdown, which is then sent to the AI.</p></div>
        <div class="feature-card"><div class="fc-icon">📋</div><h4>Paste Markdown</h4><p>Paste pre-converted Markdown directly into the textarea for custom input.</p></div>
        <div class="feature-card"><div class="fc-icon">📝</div><h4>List of URLs</h4><p>Paste multiple URLs (one per line) for batch processing. Results stream in sequentially.</p></div>
      </div>

      <h5 class="mt-4 mb-2" style="color:#a78bfa">Features</h5>
      <div class="feature-grid">
        <div class="feature-card"><div class="fc-icon">🤖</div><h4>AI Provider Select</h4><p>Choose from Claude (Anthropic), GPT-4o (OpenAI), or Gemini (Google). API key must be set in Settings.</p></div>
        <div class="feature-card"><div class="fc-icon">⚡</div><h4>Streaming Output</h4><p>Responses stream in token-by-token via SSE so you see results as they arrive.</p></div>
        <div class="feature-card"><div class="fc-icon">📊</div><h4>Batch Progress Bar</h4><p>URL list mode shows a progress bar and per-URL status badges (green=success, red=error).</p></div>
        <div class="feature-card"><div class="fc-icon">🔍</div><h4>Identify Schema Types</h4><p>URL list mode has an extra "Identify applicable Schema Types" button — asks AI to list applicable Schema.org types without writing code.</p></div>
        <div class="feature-card"><div class="fc-icon">📋</div><h4>Copy Output</h4><p>One-click copy of the full generated JSON-LD.</p></div>
        <div class="feature-card"><div class="fc-icon">✅</div><h4>Google Validation</h4><p>"Validate (G-Rich Results)" opens Google's Rich Results Test tool with the schema pre-filled.</p></div>
        <div class="feature-card"><div class="fc-icon">⚙️</div><h4>Prompt Settings</h4><p>Customize the AI system prompt templates for schema generation from Settings.</p></div>
      </div>
    </div>
  </div>

  <!-- SETTINGS -->
  <div class="doc-section" id="settings">
    <div class="section-header">
      <div class="icon-circle">⚙️</div>
      <div>
        <h2>Settings</h2>
        <p>Route: <code>#/settings</code> — API keys, themes, and schema prompt configuration</p>
      </div>
    </div>
    <div class="section-body">
      <div class="feature-grid">
        <div class="feature-card"><div class="fc-icon">🔑</div><h4>API Keys</h4><p>Store API keys for Claude, OpenAI, and Gemini. Keys are saved in <code>localStorage</code> (device-only, not sent to server).</p></div>
        <div class="feature-card"><div class="fc-icon">🎨</div><h4>Color Themes</h4><p>Choose from multiple visual color themes (Cosmic, Ocean, Ember, Forest, Rose, Monochrome).</p></div>
        <div class="feature-card"><div class="fc-icon">🖼️</div><h4>UI Styles</h4><p>Toggle between design styles: Glassmorphism, Solid, Minimal, Neon.</p></div>
        <div class="feature-card"><div class="fc-icon">📝</div><h4>Schema Prompt Templates</h4><p>Customize the AI prompts used by the Schema Generator: Markdown mode, URL mode, and Identify mode.</p></div>
        <div class="feature-card"><div class="fc-icon">🚪</div><h4>Logout</h4><p>Ends the current session and redirects to the login screen.</p></div>
      </div>
      <div class="warn"><i class="bi bi-exclamation-triangle"></i><div>API keys are stored in <strong>localStorage</strong> on your browser only. They are never sent to the server or stored in the database.</div></div>
    </div>
  </div>

  <!-- USERS -->
  <div class="doc-section" id="users">
    <div class="section-header">
      <div class="icon-circle">👥</div>
      <div>
        <h2>Users (Admin Only)</h2>
        <p>Route: <code>#/users</code> — Manage user accounts</p>
      </div>
    </div>
    <div class="section-body">
      <div class="feature-grid">
        <div class="feature-card"><div class="fc-icon">➕</div><h4>Create Users</h4><p>Admins can create new user accounts with username, email, password, and role.</p></div>
        <div class="feature-card"><div class="fc-icon">🔐</div><h4>Roles</h4><p>Two roles: <code>admin</code> (full access including Users page) and <code>user</code> (standard access).</p></div>
        <div class="feature-card"><div class="fc-icon">🗑️</div><h4>Delete Users</h4><p>Admins can delete user accounts. Non-admin users cannot access this page.</p></div>
      </div>
      <div class="warn"><i class="bi bi-exclamation-triangle"></i><div>The Users page is only visible in the sidebar for accounts with <code>role = admin</code>. Regular users receive a permission error if they navigate here directly.</div></div>
    </div>
  </div>

  <!-- API ENDPOINTS -->
  <div class="doc-section" id="api">
    <div class="section-header">
      <div class="icon-circle">☁️</div>
      <div>
        <h2>API Endpoints</h2>
        <p>All REST endpoints served from <code>api/</code> — require session auth</p>
      </div>
    </div>
    <div class="section-body">
      <table class="fn-table">
        <thead><tr><th>Method</th><th>Endpoint</th><th>Description</th></tr></thead>
        <tbody>
          <tr>
            <td><span class="method get">GET</span><span class="method post">POST</span><span class="method put">PUT</span><span class="method delete">DELETE</span></td>
            <td class="endpoint">templates.php</td>
            <td>Full CRUD for templates. GET returns own + public templates with <code>is_owner</code> flag. Actions: <code>increment_use</code>, <code>toggle_public</code>, <code>bulk_category</code>, <code>bulk_group</code>, <code>bulk_delete</code>, <code>export</code>, <code>import</code>.</td>
          </tr>
          <tr>
            <td><span class="method get">GET</span><span class="method post">POST</span><span class="method put">PUT</span><span class="method delete">DELETE</span></td>
            <td class="endpoint">profiles.php</td>
            <td>CRUD for Data Profiles. <code>GET ?action=variables</code> returns a merged list of all unique variables across all templates.</td>
          </tr>
          <tr>
            <td><span class="method get">GET</span><span class="method post">POST</span></td>
            <td class="endpoint">history.php</td>
            <td>Log and retrieve history events (prompt, template, error types).</td>
          </tr>
          <tr>
            <td><span class="method get">GET</span><span class="method post">POST</span><span class="method put">PUT</span></td>
            <td class="endpoint">users.php</td>
            <td>Admin-only. List, create, and delete user accounts.</td>
          </tr>
          <tr>
            <td><span class="method get">GET</span><span class="method post">POST</span></td>
            <td class="endpoint">schema-settings.php</td>
            <td>Retrieve and update the AI prompt templates used by the Schema Generator.</td>
          </tr>
          <tr>
            <td><span class="method post">POST</span></td>
            <td class="endpoint">crawl.php</td>
            <td>Accepts a URL; fetches the page and returns Markdown content + page title.</td>
          </tr>
          <tr>
            <td><span class="method post">POST</span></td>
            <td class="endpoint">ai-chat.php</td>
            <td>Proxy to AI providers (Claude/OpenAI/Gemini). Streams SSE response back to the browser.</td>
          </tr>
          <tr>
            <td><span class="method post">POST</span></td>
            <td class="endpoint">auth.php</td>
            <td>Session login/logout. Returns session cookie used for all subsequent API calls.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- AUTH -->
  <div class="doc-section" id="auth">
    <div class="section-header">
      <div class="icon-circle">🔐</div>
      <div>
        <h2>Authentication &amp; Sessions</h2>
        <p>PHP session-based auth with hardened cookie settings</p>
      </div>
    </div>
    <div class="section-body">
      <div class="feature-grid">
        <div class="feature-card"><div class="fc-icon">🍪</div><h4>Session Cookies</h4><p>Secure, HttpOnly, SameSite=Strict cookies. Session lifetime: 2 hours.</p></div>
        <div class="feature-card"><div class="fc-icon">🔒</div><h4>All Endpoints Protected</h4><p>Every API call calls <code>requireAuth()</code>. Unauthenticated requests return HTTP 401.</p></div>
        <div class="feature-card"><div class="fc-icon">🛡️</div><h4>Per-User Data</h4><p>All DB queries include <code>user_id = ?</code> filters. Users can only modify their own data.</p></div>
        <div class="feature-card"><div class="fc-icon">🌐</div><h4>Public Templates</h4><p>Exception: public templates (<code>is_public=1</code>) are readable by all authenticated users, but only writable by the owner.</p></div>
      </div>
    </div>
  </div>

  <!-- USER FLOW LINK -->
  <div class="doc-section" id="userflow">
    <div class="section-header">
      <div class="icon-circle">🗺️</div>
      <div>
        <h2>User Flow Diagram</h2>
        <p>Visual map of ideal paths through the application</p>
      </div>
    </div>
    <div class="section-body" style="text-align:center">
      <p class="mb-3" style="color:var(--muted)">Interactive SVG user flow diagram — covers New User Onboarding, Daily Workflow, and Admin flows.</p>
      <a href="userflow.svg" target="_blank" class="btn btn-outline-light">
        <i class="bi bi-diagram-3 me-2"></i>Open User Flow SVG
      </a>
      <div class="mt-4">
        <object data="userflow.svg" type="image/svg+xml" style="width:100%;max-width:900px;border-radius:1rem;border:1px solid var(--border)"></object>
      </div>
    </div>
  </div>

  <footer class="text-center py-4 mt-4" style="color:var(--muted);border-top:1px solid var(--border);font-size:.82rem">
    Prompt DB Documentation &mdash; Generated 2026-02-23 &mdash; Daine Dvorak
  </footer>

</main>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
<script>
// Active sidebar link on scroll
const sections = document.querySelectorAll('.doc-section');
const navLinks = document.querySelectorAll('#toc a');
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      navLinks.forEach(a => a.classList.remove('active'));
      const link = document.querySelector(`#toc a[href="#${e.target.id}"]`);
      if (link) link.classList.add('active');
    }
  });
}, { rootMargin: '-20% 0px -70% 0px' });
sections.forEach(s => observer.observe(s));

// Close sidebar on link click (mobile)
navLinks.forEach(a => a.addEventListener('click', () => {
  document.getElementById('sidebar').classList.remove('open');
}));
</script>
</body>
</html>
