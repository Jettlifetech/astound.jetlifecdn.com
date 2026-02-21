#!/bin/bash
# ============================================================
# GitHub Multi-Account Setup Script
# Sets up SSH keys and config for managing 2 GitHub accounts
# on the same machine.
#
# Usage: bash setup-github-multi.sh
# ============================================================

set -e

BOLD="\033[1m"
GREEN="\033[32m"
CYAN="\033[36m"
YELLOW="\033[33m"
RED="\033[31m"
RESET="\033[0m"

SSH_DIR="$HOME/.ssh"

echo -e "${BOLD}${CYAN}"
echo "╔═══════════════════════════════════════════════════════╗"
echo "║     GitHub Multi-Account SSH Setup                    ║"
echo "║     Configure 2 GitHub accounts on this machine       ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo -e "${RESET}"

# Ensure .ssh directory exists
mkdir -p "$SSH_DIR"
chmod 700 "$SSH_DIR"

# --- Account 1 ---
echo -e "${BOLD}${GREEN}━━━ Account 1 (Primary) ━━━${RESET}"
read -p "GitHub username for Account 1: " GH_USER1
read -p "GitHub email for Account 1: " GH_EMAIL1
read -p "Label/alias for this account (e.g. 'personal', 'work'): " GH_LABEL1
GH_LABEL1=${GH_LABEL1:-personal}

echo ""

# --- Account 2 ---
echo -e "${BOLD}${GREEN}━━━ Account 2 (Secondary) ━━━${RESET}"
read -p "GitHub username for Account 2: " GH_USER2
read -p "GitHub email for Account 2: " GH_EMAIL2
read -p "Label/alias for this account (e.g. 'work', 'client'): " GH_LABEL2
GH_LABEL2=${GH_LABEL2:-work}

echo ""

KEY1="$SSH_DIR/id_ed25519_github_${GH_LABEL1}"
KEY2="$SSH_DIR/id_ed25519_github_${GH_LABEL2}"

# --- Generate SSH Keys ---
echo -e "${BOLD}${CYAN}━━━ Generating SSH Keys ━━━${RESET}"

if [ -f "$KEY1" ]; then
    echo -e "${YELLOW}⚠  Key already exists for ${GH_LABEL1}: $KEY1 (skipping)${RESET}"
else
    echo -e "Generating key for ${BOLD}${GH_LABEL1}${RESET} (${GH_EMAIL1})..."
    ssh-keygen -t ed25519 -C "$GH_EMAIL1" -f "$KEY1" -N ""
    echo -e "${GREEN}✓  Key created: $KEY1${RESET}"
fi

echo ""

if [ -f "$KEY2" ]; then
    echo -e "${YELLOW}⚠  Key already exists for ${GH_LABEL2}: $KEY2 (skipping)${RESET}"
else
    echo -e "Generating key for ${BOLD}${GH_LABEL2}${RESET} (${GH_EMAIL2})..."
    ssh-keygen -t ed25519 -C "$GH_EMAIL2" -f "$KEY2" -N ""
    echo -e "${GREEN}✓  Key created: $KEY2${RESET}"
fi

echo ""

# --- Configure SSH Config ---
echo -e "${BOLD}${CYAN}━━━ Configuring SSH Config ━━━${RESET}"

CONFIG_FILE="$SSH_DIR/config"
BACKUP=""

if [ -f "$CONFIG_FILE" ]; then
    BACKUP="${CONFIG_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
    cp "$CONFIG_FILE" "$BACKUP"
    echo -e "${YELLOW}⚠  Backed up existing config to: $BACKUP${RESET}"
fi

# Remove any old github host entries we manage
if [ -f "$CONFIG_FILE" ]; then
    # Remove our managed blocks
    sed -i '/^# >>> github-multi-account/,/^# <<< github-multi-account/d' "$CONFIG_FILE"
fi

# Append our config
cat >> "$CONFIG_FILE" << EOF

# >>> github-multi-account (managed by setup-github-multi.sh) >>>

# Account 1: ${GH_USER1} (${GH_LABEL1})
Host github.com-${GH_LABEL1}
    HostName github.com
    User git
    IdentityFile ${KEY1}
    IdentitiesOnly yes

# Account 2: ${GH_USER2} (${GH_LABEL2})
Host github.com-${GH_LABEL2}
    HostName github.com
    User git
    IdentityFile ${KEY2}
    IdentitiesOnly yes

# Default GitHub (uses Account 1)
Host github.com
    HostName github.com
    User git
    IdentityFile ${KEY1}
    IdentitiesOnly yes

# <<< github-multi-account <<<
EOF

chmod 600 "$CONFIG_FILE"
echo -e "${GREEN}✓  SSH config updated: $CONFIG_FILE${RESET}"

echo ""

# --- Start SSH Agent ---
echo -e "${BOLD}${CYAN}━━━ Adding Keys to SSH Agent ━━━${RESET}"
eval "$(ssh-agent -s)" 2>/dev/null || true
ssh-add "$KEY1" 2>/dev/null || true
ssh-add "$KEY2" 2>/dev/null || true
echo -e "${GREEN}✓  Keys added to ssh-agent${RESET}"

echo ""

# --- Display Public Keys for GitHub ---
echo -e "${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "${BOLD}${YELLOW}IMPORTANT: Add these public keys to your GitHub accounts${RESET}"
echo -e "${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo ""

echo -e "${BOLD}Account 1: ${GH_USER1} (${GH_LABEL1})${RESET}"
echo -e "Go to: ${CYAN}https://github.com/settings/ssh/new${RESET}"
echo -e "Log in as: ${BOLD}${GH_USER1}${RESET}"
echo -e "Title: $(hostname) - ${GH_LABEL1}"
echo -e "Paste this key:"
echo -e "${GREEN}"
cat "${KEY1}.pub"
echo -e "${RESET}"
echo ""

echo -e "${BOLD}Account 2: ${GH_USER2} (${GH_LABEL2})${RESET}"
echo -e "Go to: ${CYAN}https://github.com/settings/ssh/new${RESET}"
echo -e "Log in as: ${BOLD}${GH_USER2}${RESET}"
echo -e "Title: $(hostname) - ${GH_LABEL2}"
echo -e "Paste this key:"
echo -e "${GREEN}"
cat "${KEY2}.pub"
echo -e "${RESET}"

# --- Wait for user to add keys ---
echo -e "${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo ""
read -p "Press ENTER after you've added BOTH keys to GitHub..." _

echo ""

# --- Test Connections ---
echo -e "${BOLD}${CYAN}━━━ Testing SSH Connections ━━━${RESET}"

echo -n "Testing ${GH_LABEL1} (${GH_USER1})... "
if ssh -T -o StrictHostKeyChecking=accept-new git@github.com-${GH_LABEL1} 2>&1 | grep -qi "success\|${GH_USER1}"; then
    echo -e "${GREEN}✓ Connected!${RESET}"
else
    echo -e "${RED}✗ Failed${RESET} — Verify the SSH key was added to ${GH_USER1}'s GitHub"
fi

echo -n "Testing ${GH_LABEL2} (${GH_USER2})... "
if ssh -T -o StrictHostKeyChecking=accept-new git@github.com-${GH_LABEL2} 2>&1 | grep -qi "success\|${GH_USER2}"; then
    echo -e "${GREEN}✓ Connected!${RESET}"
else
    echo -e "${RED}✗ Failed${RESET} — Verify the SSH key was added to ${GH_USER2}'s GitHub"
fi

echo ""

# --- Create helper script ---
HELPER_SCRIPT="$HOME/.local/bin/git-account"
mkdir -p "$(dirname "$HELPER_SCRIPT")"

cat > "$HELPER_SCRIPT" << 'HELPEREOF'
#!/bin/bash
# git-account — Switch or show GitHub account for current repo
# Usage:
#   git-account                  Show current account for this repo
#   git-account list             List all configured accounts
#   git-account set <label>      Switch this repo to use <label> account
#   git-account clone <label> <owner/repo>   Clone with specific account

BOLD="\033[1m"
GREEN="\033[32m"
CYAN="\033[36m"
YELLOW="\033[33m"
RED="\033[31m"
RESET="\033[0m"

SSH_CONFIG="$HOME/.ssh/config"

# Extract managed accounts from SSH config
get_accounts() {
    grep -A3 'github.com-' "$SSH_CONFIG" 2>/dev/null | grep -oP 'github\.com-\K\S+' | sort -u
}

case "${1:-}" in
    ""|show)
        if ! git rev-parse --is-inside-work-tree &>/dev/null; then
            echo -e "${RED}Not inside a git repository${RESET}"
            exit 1
        fi
        REMOTE=$(git remote get-url origin 2>/dev/null || echo "none")
        echo -e "${BOLD}Current repo:${RESET} $(basename "$(pwd)")"
        echo -e "${BOLD}Remote:${RESET} $REMOTE"

        # Detect which account
        if [[ "$REMOTE" =~ github\.com-([a-zA-Z0-9_-]+) ]]; then
            echo -e "${BOLD}Account:${RESET} ${GREEN}${BASH_REMATCH[1]}${RESET}"
        elif [[ "$REMOTE" =~ github\.com ]]; then
            echo -e "${BOLD}Account:${RESET} ${YELLOW}default (check SSH config)${RESET}"
        else
            echo -e "${BOLD}Account:${RESET} ${YELLOW}non-GitHub remote${RESET}"
        fi

        echo -e "${BOLD}Git user:${RESET} $(git config user.name 2>/dev/null || echo 'not set') <$(git config user.email 2>/dev/null || echo 'not set')>"
        ;;

    list)
        echo -e "${BOLD}Configured GitHub accounts:${RESET}"
        while IFS= read -r line; do
            if [[ "$line" =~ ^#[[:space:]]*Account ]]; then
                echo -e "  ${GREEN}$line${RESET}"
            fi
        done < "$SSH_CONFIG"
        echo ""
        echo -e "${BOLD}Available labels:${RESET}"
        for acc in $(get_accounts); do
            echo -e "  • ${CYAN}$acc${RESET}"
        done
        ;;

    set)
        LABEL="$2"
        if [ -z "$LABEL" ]; then
            echo -e "${RED}Usage: git-account set <label>${RESET}"
            echo "Available: $(get_accounts | tr '\n' ' ')"
            exit 1
        fi

        if ! git rev-parse --is-inside-work-tree &>/dev/null; then
            echo -e "${RED}Not inside a git repository${RESET}"
            exit 1
        fi

        REMOTE=$(git remote get-url origin 2>/dev/null)
        if [ -z "$REMOTE" ]; then
            echo -e "${RED}No 'origin' remote found${RESET}"
            exit 1
        fi

        # Extract owner/repo from any GitHub URL format
        OWNER_REPO=""
        if [[ "$REMOTE" =~ github\.com[:/]([^/]+/[^/]+?)(\.git)?$ ]]; then
            OWNER_REPO="${BASH_REMATCH[1]}"
        elif [[ "$REMOTE" =~ github\.com-[a-zA-Z0-9_-]+[:/]([^/]+/[^/]+?)(\.git)?$ ]]; then
            OWNER_REPO="${BASH_REMATCH[1]}"
        fi

        if [ -z "$OWNER_REPO" ]; then
            echo -e "${RED}Could not parse owner/repo from: $REMOTE${RESET}"
            exit 1
        fi

        NEW_URL="git@github.com-${LABEL}:${OWNER_REPO}.git"
        git remote set-url origin "$NEW_URL"
        echo -e "${GREEN}✓ Remote updated to: $NEW_URL${RESET}"

        # Lookup email from SSH config comments
        ACCOUNT_INFO=$(grep -B1 "github.com-${LABEL}" "$SSH_CONFIG" | grep "^#" | head -1)
        if [[ "$ACCOUNT_INFO" =~ \(([^)]+)\) ]]; then
            echo -e "${CYAN}Account: ${BASH_REMATCH[1]}${RESET}"
        fi

        # Prompt to set local git identity
        read -p "Set local git user.name for this repo? (leave blank to skip): " LOCAL_NAME
        if [ -n "$LOCAL_NAME" ]; then
            git config user.name "$LOCAL_NAME"
        fi
        read -p "Set local git user.email for this repo? (leave blank to skip): " LOCAL_EMAIL
        if [ -n "$LOCAL_EMAIL" ]; then
            git config user.email "$LOCAL_EMAIL"
        fi
        echo -e "${GREEN}✓ Done!${RESET}"
        ;;

    clone)
        LABEL="$2"
        REPO="$3"
        if [ -z "$LABEL" ] || [ -z "$REPO" ]; then
            echo -e "${RED}Usage: git-account clone <label> <owner/repo>${RESET}"
            echo "Example: git-account clone work Myorg/myrepo"
            exit 1
        fi
        URL="git@github.com-${LABEL}:${REPO}.git"
        echo -e "${CYAN}Cloning: $URL${RESET}"
        git clone "$URL"
        ;;

    *)
        echo -e "${BOLD}git-account${RESET} — Manage GitHub multi-account repos"
        echo ""
        echo "Commands:"
        echo "  git-account              Show current repo's account"
        echo "  git-account list         List configured accounts"
        echo "  git-account set <label>  Switch repo to a specific account"
        echo "  git-account clone <label> <owner/repo>  Clone with account"
        echo ""
        echo "Available labels: $(get_accounts | tr '\n' ' ')"
        ;;
esac
HELPEREOF

chmod +x "$HELPER_SCRIPT"
echo -e "${GREEN}✓  Helper script installed: $HELPER_SCRIPT${RESET}"

# Add to PATH if needed
if [[ ":$PATH:" != *":$HOME/.local/bin:"* ]]; then
    echo 'export PATH="$HOME/.local/bin:$PATH"' >> "$HOME/.bashrc"
    echo -e "${YELLOW}Added ~/.local/bin to PATH in .bashrc (restart shell or run: source ~/.bashrc)${RESET}"
fi

echo ""

# --- Fix current repo ---
echo -e "${BOLD}${CYAN}━━━ Current Repository Setup ━━━${RESET}"
if git rev-parse --is-inside-work-tree &>/dev/null 2>&1; then
    CURRENT_REMOTE=$(git remote get-url origin 2>/dev/null || echo "")
    echo -e "Current directory: $(pwd)"
    echo -e "Current remote: ${CURRENT_REMOTE:-none}"
    echo ""
    echo -e "Which account should this repo use?"
    echo -e "  1) ${GH_LABEL1} (${GH_USER1})"
    echo -e "  2) ${GH_LABEL2} (${GH_USER2})"
    echo -e "  3) Skip (don't change)"
    read -p "Choice [1/2/3]: " REPO_CHOICE

    case "$REPO_CHOICE" in
        1)
            CHOSEN_LABEL="$GH_LABEL1"
            CHOSEN_USER="$GH_USER1"
            CHOSEN_EMAIL="$GH_EMAIL1"
            ;;
        2)
            CHOSEN_LABEL="$GH_LABEL2"
            CHOSEN_USER="$GH_USER2"
            CHOSEN_EMAIL="$GH_EMAIL2"
            ;;
        *)
            echo "Skipped."
            CHOSEN_LABEL=""
            ;;
    esac

    if [ -n "$CHOSEN_LABEL" ]; then
        read -p "GitHub org or username that owns this repo: " REPO_OWNER
        read -p "Repository name: " REPO_NAME
        NEW_URL="git@github.com-${CHOSEN_LABEL}:${REPO_OWNER}/${REPO_NAME}.git"

        git remote set-url origin "$NEW_URL" 2>/dev/null || git remote add origin "$NEW_URL"
        git config user.name "$CHOSEN_USER"
        git config user.email "$CHOSEN_EMAIL"

        echo -e "${GREEN}✓  Remote set to: $NEW_URL${RESET}"
        echo -e "${GREEN}✓  Local git user: $CHOSEN_USER <$CHOSEN_EMAIL>${RESET}"
    fi
fi

echo ""
echo -e "${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "${BOLD}${GREEN}✅ Setup Complete!${RESET}"
echo -e "${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo ""
echo -e "${BOLD}Quick Reference:${RESET}"
echo ""
echo -e "  ${BOLD}Clone a repo with a specific account:${RESET}"
echo -e "    git clone git@github.com-${GH_LABEL1}:${GH_USER1}/repo-name.git"
echo -e "    git clone git@github.com-${GH_LABEL2}:${GH_USER2}/repo-name.git"
echo ""
echo -e "  ${BOLD}Switch an existing repo's account:${RESET}"
echo -e "    cd /path/to/repo"
echo -e "    git-account set ${GH_LABEL1}     # or: git-account set ${GH_LABEL2}"
echo ""
echo -e "  ${BOLD}View current repo's account:${RESET}"
echo -e "    git-account"
echo ""
echo -e "  ${BOLD}List all configured accounts:${RESET}"
echo -e "    git-account list"
echo ""
echo -e "  ${BOLD}Push to specific account:${RESET}"
echo -e "    git push origin main"
echo ""
echo -e "${YELLOW}Note: The SSH host alias (github.com-<label>) in the remote URL"
echo -e "is what determines which SSH key (and thus which account) is used.${RESET}"
echo ""
