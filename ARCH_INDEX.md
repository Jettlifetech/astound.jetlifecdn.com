# ARCH_INDEX.md — Prompt DB Architecture Index

> Auto-generated architecture reference for `prompt-db.dainedvorak.com`
> Last updated: 2026-02-18

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend Language** | PHP 7.4+ |
| **Database** | MySQL 5.7+ via PDO |
| **Web Server** | Apache with mod_rewrite |
| **Frontend** | Vanilla JavaScript (no framework), SPA with hash routing |
| **CSS Framework** | Bootstrap 5.3.3 + Bootstrap Icons 1.11.3 |
| **AI APIs** | Anthropic Claude (`claude-sonnet-4-20250514`), OpenAI (`gpt-4o`), Google Gemini (`gemini-2.0-flash`) |
| **Streaming** | Server-Sent Events (SSE) |
| **Session** | PHP sessions with httponly/samesite cookies |

---

## File Map

```
/
├── index.html                  Main SPA entry point (hash router)
├── app.js                      Core SPA logic: routing, state, views, API helpers (~500 lines)
├── app.css                     Theme system: 10 color themes × 6 design styles
├── .htaccess                   Apache: security headers, rewrites, caching, GZIP
├── setup.php                   First-run installation wizard (creates DB/tables)
│
├── config/
│   ├── database.php            PDO connection factory + logError() helper
│   └── auth.php                Session management: startSecureSession(), requireAuth(), requireAdmin()
│
├── api/
│   ├── auth.php                Auth endpoints: login (rate-limited), logout, check, users CRUD, change-password
│   ├── templates.php           Template CRUD: list, fetch-with-variables, create (with variables), delete
│   ├── history.php             History: read (filtered by type), save generated prompt
│   └── ai-chat.php             AI proxy: SSE streaming to Claude / OpenAI / Gemini
│
├── js/
│   ├── home.js                 (Legacy) Template selection + prompt generation view
│   ├── template-creator.js     (Legacy) Template creation and management view
│   └── history.js              (Legacy) History display and statistics view
│
├── database/
│   ├── schema.sql              Full DB schema: 5 tables with FKs and indexes
│   └── migrate_auth.php        CLI migration: adds users table + seeds default admin
│
├── assets/
│   ├── favicon/                favicon.svg, .ico, PNG sizes, apple-touch-icon, webmanifest
│   └── images/                 astronaut-logo.png, astronaut-logo1.png
│
├── template-creator.html       (Legacy) Standalone template creator page
├── history.html                (Legacy) Standalone history page
│
├── QUICKSTART.md
├── README.md
├── INSTALLATION_CHECKLIST.md
├── QUICK_START.txt
└── THEME_UPDATE_GUIDE.md
```

> **Legacy note:** `template-creator.html`, `history.html`, and files in `js/` predate the SPA rewrite. The canonical UI is `index.html` + `app.js`.

---

## Data Flow

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (SPA)                        │
│  index.html → app.js → hash router                      │
│  Views: #/generate  #/templates  #/history  #/settings  │
│  State: Store (reactive object)                         │
│  Persistence: localStorage (API keys, theme prefs)      │
└──────────────┬──────────────────────────────────────────┘
               │  Fetch (JSON) / SSE (AI streaming)
               ▼
┌─────────────────────────────────────────────────────────┐
│                  Apache (.htaccess)                     │
│  Security headers, URL rewriting, GZIP, caching        │
└──────────────┬──────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────┐
│               PHP API Layer (/api/)                     │
│                                                         │
│  auth.php ──── session check / login / user mgmt       │
│  templates.php ─ CRUD + variable extraction (regex)    │
│  history.php ── read/write prompt history              │
│  ai-chat.php ── proxy SSE stream to AI providers       │
│                                                         │
│  All endpoints: requireAuth() from config/auth.php     │
│  All DB access: getDbConnection() from config/db.php   │
└──────────────┬──────────────────────────────────────────┘
               │  PDO prepared statements
               ▼
┌─────────────────────────────────────────────────────────┐
│               MySQL (database: prompt_db)               │
│                                                         │
│  users              id, username, email, password_hash  │
│  prompt_templates   id, user_id, name, prompt_text      │
│  template_variables id, template_id, name, label, type  │
│  prompt_history     id, user_id, template_id, output   │
│  error_logs         id, error_message, context          │
└─────────────────────────────────────────────────────────┘

AI Flow (separate path):
Browser → api/ai-chat.php → Anthropic / OpenAI / Gemini API
                          ← SSE stream of text chunks
Browser (EventSource) ← real-time token-by-token output
```

---

## Database Schema

### `users`
| Column | Type | Notes |
|--------|------|-------|
| id | INT PK AUTO_INCREMENT | |
| username | VARCHAR(50) UNIQUE | |
| email | VARCHAR(255) UNIQUE | |
| password_hash | VARCHAR(255) | `password_hash(PASSWORD_DEFAULT)` |
| role | ENUM('admin','user') | Default: 'user' |
| created_at / updated_at | TIMESTAMP | |

### `prompt_templates`
| Column | Type | Notes |
|--------|------|-------|
| id | INT PK | |
| user_id | INT FK → users | Owner isolation |
| template_name | VARCHAR(255) UNIQUE | |
| prompt_text | TEXT | Contains `[variable]` placeholders |
| created_at / updated_at | TIMESTAMP | |

### `template_variables`
| Column | Type | Notes |
|--------|------|-------|
| id | INT PK | |
| template_id | INT FK → prompt_templates | |
| variable_name | VARCHAR(255) | Raw name from `[var]` |
| field_label | VARCHAR(255) | Human-readable label |
| field_type | VARCHAR(50) | text / textarea / select |
| variable_order | INT | Display ordering |

### `prompt_history`
| Column | Type | Notes |
|--------|------|-------|
| id | INT PK | |
| user_id | INT FK → users | |
| template_id | INT FK → prompt_templates | |
| template_name | VARCHAR(255) | Denormalized for display |
| generated_prompt | TEXT | Final filled-in prompt |
| variable_data | JSON | Input values snapshot |
| created_at | TIMESTAMP | |

### `error_logs`
| Column | Type | Notes |
|--------|------|-------|
| id | INT PK | |
| error_message | TEXT | |
| error_context | TEXT | |
| created_at | TIMESTAMP | Admin-only via history API |

---

## API Endpoints

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/auth.php?action=check` | No | Check login status |
| POST | `/api/auth.php?action=login` | No | Login (rate-limited: 5 attempts → 60s lockout) |
| POST | `/api/auth.php?action=logout` | Yes | Destroy session |
| GET | `/api/auth.php?action=users` | Admin | List all users |
| POST | `/api/auth.php?action=users` | Admin | Create user |
| DELETE | `/api/auth.php?action=users` | Admin | Delete user |
| POST | `/api/auth.php?action=change-password` | Yes | Update password |
| GET | `/api/templates.php` | Yes | List templates (or fetch one with variables) |
| POST | `/api/templates.php` | Yes | Create template + variables (transactional) |
| DELETE | `/api/templates.php` | Yes | Delete template (owner only) |
| GET | `/api/history.php?type=` | Yes | Fetch history (all/prompts/templates/errors) |
| POST | `/api/history.php` | Yes | Save generated prompt to history |
| POST | `/api/ai-chat.php` | Yes | Stream AI response via SSE |

---

## Key Functions

### Backend — `config/database.php`
| Function | Description |
|----------|-------------|
| `getDbConnection()` | Returns PDO instance; throws on failure |
| `logError($msg, $ctx)` | Inserts into `error_logs` table |

### Backend — `config/auth.php`
| Function | Description |
|----------|-------------|
| `startSecureSession()` | Configures and starts PHP session with secure cookie params |
| `requireAuth()` | Returns user array or sends 401 JSON response |
| `getAuthUser()` | Soft check — returns user or null (no redirect) |
| `requireAdmin()` | Returns user or sends 403 if not admin role |

### Backend — `api/auth.php`
| Function | Description |
|----------|-------------|
| `handleLogin()` | Rate-limited login with `password_verify()` |
| `handleLogout()` | Destroys session and clears cookie |
| `handleCheck()` | Returns `{authenticated, user}` |
| `handleUsers()` | Admin CRUD: list / create / delete users |
| `handleChangePassword()` | Verifies old password, sets new hash |
| `validatePassword($pw)` | Min 8 chars, must have letter + number |

### Backend — `api/ai-chat.php`
| Function | Description |
|----------|-------------|
| `streamClaude($prompt, $key)` | Calls Anthropic streaming API, emits SSE |
| `streamOpenAI($prompt, $key)` | Calls OpenAI streaming API, emits SSE |
| `streamGemini($prompt, $key)` | Calls Gemini streaming API, emits SSE |
| `sendSSE($data)` | Formats and flushes a single SSE `data:` frame |
| `sendDone()` | Emits `data: [DONE]` to close the stream |

### Frontend — `app.js`
| Symbol | Description |
|--------|-------------|
| `Store` | Reactive state container (templates, history, user, currentView) |
| `$(sel)`, `$$(sel)` | `querySelector` / `querySelectorAll` shortcuts |
| `h(tag, attrs, ...children)` | Virtual DOM element factory |
| `toast(msg, type)` | Bootstrap toast notifications |
| `confirmDialog(msg)` | Promise-based confirmation modal |
| `api.get(url)` | Authenticated fetch GET → JSON |
| `api.post(url, body)` | Authenticated fetch POST → JSON |
| `api.del(url, body)` | Authenticated fetch DELETE → JSON |
| `renderGenerate()` | View: template selector + variable form + AI chat |
| `renderTemplates()` | View: template list + create/delete UI |
| `renderHistory()` | View: history browser with stats |
| `renderSettings()` | View: AI provider key management |
| `router()` | Hash-change listener → maps `#/route` to render functions |
| `loadTemplates()` | Fetches and caches templates into Store |
| `loadHistory()` | Fetches and caches history into Store |

### Frontend — `js/home.js` (legacy)
| Function | Description |
|----------|-------------|
| `loadTemplates()` | Populates template dropdown |
| `handleTemplateChange()` | Fetches variables, renders dynamic form |
| `generatePrompt()` | Replaces `[vars]` in template text with form values |

### Frontend — `js/template-creator.js` (legacy)
| Function | Description |
|----------|-------------|
| `parseVariables(text)` | Extracts `[var]` tokens via regex |
| `saveTemplate()` | POSTs new template + variables |
| `deleteTemplate(id)` | DELETEs template by ID |

### Frontend — `js/history.js` (legacy)
| Function | Description |
|----------|-------------|
| `loadHistory(type)` | Fetches filtered history |
| `displayHistory(items)` | Renders history cards with HTML escaping |
| `updateStatistics(data)` | Updates count badges |

---

## Theme System

### Color Themes (10)
Lavender, Ocean, Peach, Mint, Rose, Slate, Gold, Teal, Coral, Indigo
Applied via `data-theme="<name>"` on `<html>`. Each defines CSS custom properties:
`--space-bg-*`, `--glass-bg`, `--glass-brd`, `--text`, `--accent`, `--muted`, `--warning`

### Design Styles (6)
Glass (default), Glassy, Bubbly, Material, Neumorphism, Skeuomorphism
Applied via `data-style="<name>"` on `<html>`.

Both settings are persisted to `localStorage`.

---

## Security Posture

### Implemented
- PDO prepared statements (all queries)
- `password_hash` / `password_verify` (bcrypt)
- Secure session cookies (httponly, samesite=Strict)
- Login rate limiting (5 attempts → 60s lockout)
- Role-based access (admin vs. user)
- User-scoped data isolation (`user_id` filtering)
- HTML escaping in frontend to prevent XSS
- Apache security headers (X-Frame-Options, X-XSS-Protection, etc.)
- `Options -Indexes` (no directory listing)

### Known Concerns
1. **Hardcoded DB credentials** in `config/database.php` — should use env vars or `.env`
2. **Default admin password** `ChangeMe123!` set by migration — must be changed post-install
3. **AI API keys** stored in `localStorage` — acceptable for user-supplied keys, but document this
4. **HTTPS not enforced** — `.htaccess` does not redirect HTTP → HTTPS

---

## SPA Routes

| Hash Route | View Rendered | Description |
|------------|--------------|-------------|
| `#/generate` | `renderGenerate()` | Select template, fill variables, generate + stream AI response |
| `#/templates` | `renderTemplates()` | Browse, create, delete prompt templates |
| `#/history` | `renderHistory()` | Browse and filter generated prompt history |
| `#/settings` | `renderSettings()` | Manage AI provider API keys |

---

## Setup / Installation

1. Edit `config/database.php` — set DB host, user, password, name
2. Visit `setup.php` in browser — creates database and tables
3. Run `php database/migrate_auth.php` — adds users table + seeds admin account
4. Delete or protect `setup.php`
5. `chmod -R 755 .`
6. Login as `admin` / `ChangeMe123!` and change the password immediately

**Default admin:** username `admin`, password `ChangeMe123!`
