# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Prompt DB** is a PHP/MySQL web application for creating prompt templates with `[variable]` placeholders, filling them via a dynamically-generated form, and streaming the result to AI providers (Anthropic Claude, OpenAI, Google Gemini).

## Tech Stack

- **Backend**: PHP 7.4+ with PDO, Apache with mod_rewrite
- **Frontend**: Vanilla JS SPA with hash routing (`#/generate`, `#/templates`, `#/profiles`, `#/history`, `#/settings`, `#/users`)
- **CSS**: Bootstrap 5.3.3 + Bootstrap Icons 1.11.3; custom theme system in `app.css`
- **Database**: MySQL 5.7+ (`prompt_db`)
- **AI Streaming**: Server-Sent Events (SSE) via `api/ai-chat.php` → Anthropic / OpenAI / Gemini

## Architecture

### Single Page Application

The canonical app is `index.html` + `app.js`. Files in `js/` (`home.js`, `template-creator.js`, `history.js`) and `template-creator.html`/`history.html` are **legacy** and no longer the primary UI.

`app.js` contains:
- `Store` — simple reactive state object (templates, history, user, searchQuery)
- `h(tag, attrs, ...children)` — DOM element factory used throughout instead of innerHTML
- `api.get/post/del/updateTemplate` — all AJAX calls; 401 responses signal session expiry
- Route functions: `renderGenerate`, `renderTemplates`, `renderProfiles`, `renderHistory`, `renderSettings`, `renderUsers`
- `router()` — maps `location.hash` → render function on `hashchange`

### PHP API Layer (`/api/`)

Every endpoint calls `requireAuth()` from `config/auth.php` (returns user array or sends 401). All DB access goes through `getDbConnection()` from `config/database.php`.

| File | Purpose |
|------|---------|
| `api/auth.php` | Login (rate-limited: 5 attempts → 60s lockout), logout, session check, user CRUD, change-password |
| `api/templates.php` | Template CRUD + variable extraction via `[var]` regex |
| `api/history.php` | Read/write prompt history |
| `api/ai-chat.php` | SSE proxy to Claude/OpenAI/Gemini; disables output buffering for streaming |
| `api/profiles.php` | Data profiles CRUD + aggregate variable list across all templates |

### Database (`prompt_db`)

Tables: `users`, `prompt_templates`, `template_variables`, `prompt_history`, `error_logs`.
All template queries are scoped to `user_id` for data isolation. See `database/schema.sql` for full schema.

### Theme System

`app.css` implements 10 color themes × 6 design styles. Theme is set via `data-theme` and `data-style` attributes on `<html>`, persisted to `localStorage`.

## Setup

1. Edit `config/database.php` — set DB credentials
2. Visit `setup.php` in browser — creates database and tables
3. Run `php database/migrate_auth.php` — creates users table and seeds admin
4. Delete or protect `setup.php`
5. Login as `admin` / `ChangeMe123!` and change password immediately

## Common Commands

```bash
# Check Apache error logs
sudo tail -f /var/log/apache2/error.log

# Verify MySQL is running
sudo systemctl status mysql

# Connect to the database
mysql -u jltremoteroot -p prompt_db

# Apply schema from scratch
mysql -u root -p < database/schema.sql

# Run auth migration (adds users table, seeds admin)
php database/migrate_auth.php

# Check PHP has PDO MySQL
php -m | grep pdo_mysql
```

## Key Conventions

- **DOM construction**: Use `h()` factory in `app.js`, not innerHTML, to avoid XSS. Legacy views in `js/` use manual `textContent` escaping.
- **API calls**: All frontend calls go through `api.*` helpers in `app.js` which set correct headers and handle 401 uniformly.
- **Error logging**: Call `logError($msg, $ctx)` from `config/database.php` to write to the `error_logs` table (visible in History view to admins).
- **Template variables**: Parsed from `[variable-name]` syntax via regex in both PHP (`api/templates.php`) and JS (`js/template-creator.js`).
- **AI keys**: Stored in browser `localStorage` by the user; sent per-request to `api/ai-chat.php` — never persisted server-side.
- **SSE streaming**: `api/ai-chat.php` disables all output buffering layers before emitting `data:` frames. The frontend uses `EventSource` to consume them.

## Security Notes

- DB credentials are hardcoded in `config/database.php` — consider moving to environment variables for production.
- The default admin password `ChangeMe123!` must be changed immediately after running the migration.
- HTTPS is not enforced in `.htaccess` — add a redirect for production deployments.
