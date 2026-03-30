#!/bin/bash

################################################################################
# 🔐 GitHub Secrets Remediation Script
# Fixes: Push Protection violations for exposed OAuth credentials
# 
# This script will:
# 1. Remove secrets from .env file
# 2. Create instructions for fixing git history
# 3. Guide you through safe credential rotation
################################################################################

set -e

REPO_PATH="/Users/macstudio/Documents/Code/apolaki-udpated-app"
ENV_FILE="$REPO_PATH/middleware/netlify-db-service/.env"
BACKUP_DIR="$REPO_PATH/.secret-backups"

echo "==============================================================================="
echo "🔐 GITHUB SECRETS REMEDIATION"
echo "==============================================================================="
echo ""

# Step 1: Create backup
echo "📦 Step 1: Creating backup of current .env file..."
mkdir -p "$BACKUP_DIR"
cp "$ENV_FILE" "$BACKUP_DIR/.env.backup.$(date +%Y%m%d-%H%M%S)"
echo "✅ Backup created in $BACKUP_DIR"
echo ""

# Step 2: Clear secrets from .env
echo "🔑 Step 2: Clearing secrets from .env file..."
cat > "$ENV_FILE" << 'EOF'
# Apolaki Solar Platform - Local Development Environment
# Database Service Configuration
# ⚠️  DO NOT COMMIT REAL SECRETS - Use .env.example as template

# ============================================================================
# DATABASE CONFIGURATION
# ============================================================================

NETLIFY_DATABASE_URL=postgresql://apolaki_user:apolaki_pass@localhost:5432/apolaki_db?host=/tmp
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# ============================================================================
# SECURITY & SECRETS (⚠️ Change in production!)
# ============================================================================

JWT_SECRET=dev-secret-change-in-production
JWT_EXPIRY=24h
SESSION_SECRET=dev-session-secret-change-in-production

# ============================================================================
# OAUTH CONFIGURATION (⚠️ Add your real secrets locally only!)
# ============================================================================

# Google OAuth - Get from Google Cloud Console
# https://console.cloud.google.com/
GOOGLE_CLIENT_ID=PLACEHOLDER_REPLACE_LOCALLY
GOOGLE_CLIENT_SECRET=PLACEHOLDER_REPLACE_LOCALLY
GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback
GOOGLE_PROJECT_ID=your_project_id

# Facebook OAuth
FACEBOOK_APP_ID=PLACEHOLDER_REPLACE_LOCALLY
FACEBOOK_APP_SECRET=PLACEHOLDER_REPLACE_LOCALLY
FACEBOOK_CALLBACK_URL=http://localhost:3001/api/auth/facebook/callback

# Instagram OAuth
INSTAGRAM_APP_ID=PLACEHOLDER_REPLACE_LOCALLY
INSTAGRAM_APP_SECRET=PLACEHOLDER_REPLACE_LOCALLY
INSTAGRAM_CALLBACK_URL=http://localhost:3001/api/auth/instagram/callback

# ============================================================================
# MESSAGING SERVICES
# ============================================================================

VIBER_CLIENT_ID=PLACEHOLDER_REPLACE_LOCALLY
VIBER_CLIENT_SECRET=PLACEHOLDER_REPLACE_LOCALLY
VIBER_CALLBACK_URL=http://localhost:3001/api/auth/viber/callback

TELEGRAM_BOT_TOKEN=PLACEHOLDER_REPLACE_LOCALLY
TELEGRAM_BOT_USERNAME=your_bot_username
TELEGRAM_CALLBACK_URL=http://localhost:3001/api/auth/telegram/callback

# ============================================================================
# API CONFIGURATION
# ============================================================================

API_BASE_URL=http://localhost:3001
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,http://localhost:8080

# ============================================================================
# CLOUD SERVICES
# ============================================================================

GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
NREL_API_KEY=PLACEHOLDER_REPLACE_LOCALLY
AWS_ACCESS_KEY_ID=PLACEHOLDER_REPLACE_LOCALLY
AWS_SECRET_ACCESS_KEY=PLACEHOLDER_REPLACE_LOCALLY
AWS_REGION=us-east-1
AWS_S3_BUCKET=apolaki-solar-dev

# ============================================================================
# LOGGING & MONITORING
# ============================================================================

LOG_LEVEL=debug
SENTRY_DSN=PLACEHOLDER_REPLACE_LOCALLY

# ============================================================================
# FEATURES
# ============================================================================

ENABLE_OAUTH=true
ENABLE_VIBER=true
ENABLE_TELEGRAM=true
ENABLE_WHATSAPP=true
ENABLE_EMAIL_VERIFICATION=false

WHATSAPP_API_TOKEN=PLACEHOLDER_REPLACE_LOCALLY
WHATSAPP_PHONE_NUMBER_ID=PLACEHOLDER_REPLACE_LOCALLY
WHATSAPP_OTP_TEMPLATE=otp_verification

# ============================================================================
# DATABASE POOL CONFIGURATION
# ============================================================================

DB_POOL_MIN=2
DB_POOL_MAX=10
DB_CONNECTION_TIMEOUT=5000
DB_IDLE_TIMEOUT=30000
DB_MAX_LIFETIME=3600000
EOF

echo "✅ Secrets cleared from $ENV_FILE"
echo ""

# Step 3: Git operations
echo "🔄 Step 3: Updating git..."
cd "$REPO_PATH"

# Stage the changes
git add middleware/netlify-db-service/.env
echo "✅ Staged .env changes"

# Create a commit to remove secrets
git commit -m "🔐 Remove exposed secrets from .env file

- Removed real Google OAuth credentials
- Removed AWS credentials
- Removed API keys
- Using placeholder values (PLACEHOLDER_REPLACE_LOCALLY) for development
- Use .env.example as template for local setup
- Add real secrets locally only in .env (not committed)"

echo "✅ Created cleanup commit"
echo ""

echo "==============================================================================="
echo "⚠️  IMPORTANT: Fix Git History"
echo "==============================================================================="
echo ""
echo "The secrets were already committed in the previous push."
echo "GitHub is blocking the push because it detected secrets."
echo ""
echo "You have TWO options:"
echo ""
echo "OPTION 1: Force Push (if you haven't pushed yet)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  git push --force-with-lease origin main"
echo ""
echo "⚠️  WARNING: Only use if no one else has pushed since you started!"
echo ""
echo "OPTION 2: Use GitHub's Secret Scanning to Unblock (RECOMMENDED)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. Go to: https://github.com/Sreenivas-Sadhu-Prabhakara/apolaki-udpated-app"
echo "2. Click: Settings → Security & Analysis → Secret Scanning"
echo "3. Click 'Allow' on the unblocked secrets links provided by GitHub"
echo "4. IMMEDIATELY rotate these credentials on their respective platforms:"
echo ""
echo "   - Google OAuth: https://console.cloud.google.com/"
echo "   - Facebook App: https://developers.facebook.com/apps/"
echo "   - AWS: https://console.aws.amazon.com/iam/"
echo ""
echo "5. After rotation, push the new cleanup commit:"
echo "   git push origin main"
echo ""
echo "==============================================================================="
echo "📋 NEXT STEPS"
echo "==============================================================================="
echo ""
echo "1. ✅ Secrets cleared from .env (already done)"
echo "2. ⏳ Choose Option 1 or 2 above"
echo "3. 🔄 Push the cleanup commit with new credentials"
echo "4. ✨ Verify push succeeds"
echo ""
echo "==============================================================================="
echo ""

# Instructions for adding secrets locally
cat > "$BACKUP_DIR/HOW_TO_ADD_SECRETS_LOCALLY.md" << 'EOF'
# How to Add Your Real Secrets Locally (After Fix)

## Step 1: Use .env.example as template
```bash
cd middleware/netlify-db-service
cp .env.example .env
```

## Step 2: Get Your Real Credentials

### Google OAuth
1. Go to: https://console.cloud.google.com/
2. Create or select a project
3. Enable the Google+ API
4. Create OAuth 2.0 credentials (Web Application)
5. Copy Client ID and Client Secret

### Facebook
1. Go to: https://developers.facebook.com/
2. Create an app or use existing one
3. Go to Settings → Basic
4. Copy App ID and App Secret

### AWS (Optional - for file uploads)
1. Go to: https://console.aws.amazon.com/iam/
2. Create an IAM user for development
3. Create access keys
4. Copy Access Key ID and Secret Access Key

### NREL API Key (Free)
1. Go to: https://developer.nrel.gov/
2. Sign up for free
3. Create an API key
4. Copy the key

## Step 3: Edit .env (Local File Only)

⚠️  **IMPORTANT**: Never commit this file!

```bash
# Replace placeholders in .env with your real credentials:

# Change this:
GOOGLE_CLIENT_ID=PLACEHOLDER_REPLACE_LOCALLY

# To this:
GOOGLE_CLIENT_ID=147025453706-c1nqtf93b827ecbepu33s8me257cc38v.apps.googleusercontent.com

# Do the same for all credentials
```

## Step 4: Verify .gitignore

Make sure `.gitignore` includes `.env`:

```bash
# In root .gitignore
cat .gitignore | grep "^\.env$"
# Should output: .env
```

## Step 5: Test Locally

```bash
npm run dev
# Your app should now have access to OAuth credentials
```

## Step 6: Keep Your Credentials Safe

✅ DO:
- Keep .env file locally only
- Rotate credentials periodically
- Use strong, unique credentials per environment
- Use environment-specific credentials (dev, staging, prod)

❌ DON'T:
- Commit .env to git
- Share credentials in messages/Slack
- Use same credentials for multiple environments
- Leave credentials in code comments

## For Team Members

Team members should:
1. Clone the repo (gets .env.example)
2. Copy: `cp .env.example .env`
3. Get credentials from team lead (Slack/secure channel)
4. Update .env locally
5. Never commit .env

EOF

echo "📄 Created: $BACKUP_DIR/HOW_TO_ADD_SECRETS_LOCALLY.md"
echo ""
echo "==============================================================================="
echo "✅ Script Complete!"
echo "==============================================================================="
