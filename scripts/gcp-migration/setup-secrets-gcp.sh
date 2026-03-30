#!/bin/bash
# ============================================================================
# Apolaki Solar Platform — GCP Secret Manager Setup
# Phase 6: Secrets & Configuration → Secret Manager
#
# Usage:
#   ./setup-secrets-gcp.sh                    # Interactive mode
#   ./setup-secrets-gcp.sh --env-file .env    # Load from env file
#   ./setup-secrets-gcp.sh --dry-run          # Preview without changes
#   ./setup-secrets-gcp.sh --env-file .env --dry-run
#
# Compatible with macOS bash 3.x and Linux bash 4+
# ============================================================================
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

PROJECT_ID="${GCP_PROJECT_ID:-apolaki-478302}"
REGION="us-central1"
DRY_RUN=false
ENV_FILE=""

ENV_TMPFILE=$(mktemp /tmp/apolaki-secrets-env.XXXXXX)
trap "rm -f $ENV_TMPFILE" EXIT

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run)  DRY_RUN=true; shift ;;
    --env-file) ENV_FILE="$2"; shift 2 ;;
    --project)  PROJECT_ID="$2"; shift 2 ;;
    -h|--help)
      echo "Usage: $0 [--env-file FILE] [--dry-run] [--project PROJECT_ID]"
      exit 0
      ;;
    *) echo -e "${RED}Unknown option: $1${NC}"; exit 1 ;;
  esac
done

SECRETS=(
  "DATABASE_URL:PostgreSQL connection string (Neon)"
  "JWT_SECRET:JWT signing secret"
  "JWT_REFRESH_SECRET:JWT refresh token secret"
  "OAUTH_GOOGLE_CLIENT_ID:Google OAuth client ID"
  "OAUTH_GOOGLE_CLIENT_SECRET:Google OAuth client secret"
  "OAUTH_FACEBOOK_CLIENT_ID:Facebook OAuth client ID"
  "OAUTH_FACEBOOK_CLIENT_SECRET:Facebook OAuth client secret"
  "OAUTH_INSTAGRAM_CLIENT_ID:Instagram OAuth client ID"
  "OAUTH_INSTAGRAM_CLIENT_SECRET:Instagram OAuth client secret"
  "VIBER_BOT_TOKEN:Viber bot token"
  "VIBER_CLIENT_ID:Viber OAuth client ID"
  "VIBER_CLIENT_SECRET:Viber OAuth client secret"
  "TELEGRAM_BOT_TOKEN:Telegram bot token"
  "WHATSAPP_API_TOKEN:WhatsApp Cloud API token"
  "WHATSAPP_PHONE_NUMBER_ID:WhatsApp phone number ID"
  "WEATHER_API_KEY:OpenWeatherMap API key"
  "SMTP_USER:SMTP email username"
  "SMTP_PASS:SMTP email password"
  "GOOGLE_SOLAR_API_KEY:Google Solar API key"
  "NREL_API_KEY:NREL (National Renewable Energy Lab) API key"
)

log_info()    { echo -e "${BLUE}i ${NC}$1"; }
log_success() { echo -e "${GREEN}OK ${NC}$1"; }
log_warn()    { echo -e "${YELLOW}WARN ${NC}$1"; }
log_error()   { echo -e "${RED}ERR ${NC}$1"; }
log_dry()     { echo -e "${CYAN}[DRY-RUN]${NC} $1"; }

load_env_file() {
  local file="$1"
  if [[ ! -f "$file" ]]; then
    log_error "Env file not found: $file"
    exit 1
  fi
  log_info "Loading values from: $file"
  local count=0
  while IFS= read -r line || [[ -n "$line" ]]; do
    [[ -z "$line" ]] && continue
    [[ "$line" =~ ^[[:space:]]*# ]] && continue
    if [[ "$line" =~ ^([A-Za-z_][A-Za-z0-9_]*)=(.*)$ ]]; then
      local key="${BASH_REMATCH[1]}"
      local value="${BASH_REMATCH[2]}"
      value="${value%\"}"
      value="${value#\"}"
      value="${value%\'}"
      value="${value#\'}"
      echo "${key}=${value}" >> "$ENV_TMPFILE"
      count=$((count + 1))
    fi
  done < "$file"
  log_success "Loaded $count values from env file"
}

env_lookup() {
  local key="$1"
  grep "^${key}=" "$ENV_TMPFILE" 2>/dev/null | head -1 | cut -d'=' -f2- || true
}

get_secret_value() {
  local name="$1"
  local desc="$2"

  if [[ -s "$ENV_TMPFILE" ]]; then
    local val
    val=$(env_lookup "$name")
    if [[ -n "$val" && "$val" != "CHANGE_ME" ]]; then
      echo "$val"
      return 0
    elif [[ "$val" == "CHANGE_ME" ]]; then
      log_warn "$name has placeholder value, skipping" >&2
      return 1
    fi
  fi

  echo -e "${YELLOW}Enter value for ${CYAN}$name${NC} (${desc}):" >&2
  echo -e "${YELLOW}  (press Enter to skip)${NC}" >&2
  read -r -s value
  if [[ -z "$value" ]]; then
    return 1
  fi
  echo "$value"
  return 0
}

secret_exists() {
  gcloud secrets describe "$1" --project="$PROJECT_ID" &>/dev/null
}

create_secret() {
  local name="$1"
  if $DRY_RUN; then
    log_dry "Would create secret: $name"
    return 0
  fi
  gcloud secrets create "$name" \
    --replication-policy="automatic" \
    --project="$PROJECT_ID" \
    --labels="app=apolaki,phase=migration" 2>/dev/null
}

add_secret_version() {
  local name="$1"
  local value="$2"
  if $DRY_RUN; then
    log_dry "Would add version to secret: $name (***masked***)"
    return 0
  fi
  echo -n "$value" | gcloud secrets versions add "$name" \
    --data-file=- --project="$PROJECT_ID"
}

grant_secret_access() {
  local name="$1"
  local sa="$2"
  if $DRY_RUN; then
    log_dry "Would grant secretAccessor on $name to $sa"
    return 0
  fi
  gcloud secrets add-iam-policy-binding "$name" \
    --member="serviceAccount:$sa" \
    --role="roles/secretmanager.secretAccessor" \
    --project="$PROJECT_ID" --quiet 2>/dev/null || true
}

# ── Main ─────────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}========================================================${NC}"
echo -e "${GREEN}  Apolaki Solar Platform - GCP Secret Manager Setup     ${NC}"
echo -e "${GREEN}========================================================${NC}"
echo ""

if $DRY_RUN; then
  echo -e "${CYAN}DRY-RUN MODE - no changes will be made${NC}"
  echo ""
fi

log_info "Project: $PROJECT_ID"
log_info "Region: $REGION"
echo ""

if ! $DRY_RUN; then
  PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" \
    --format="value(projectNumber)" 2>/dev/null || echo "UNKNOWN")
  if [[ "$PROJECT_NUMBER" == "UNKNOWN" ]]; then
    log_error "Could not determine project number. Check gcloud auth."
    exit 1
  fi
  SERVICE_ACCOUNT="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
  log_info "Service account: $SERVICE_ACCOUNT"
else
  SERVICE_ACCOUNT="PROJECT_NUMBER-compute@developer.gserviceaccount.com"
  log_dry "Service account: $SERVICE_ACCOUNT (placeholder)"
fi
echo ""

if [[ -n "$ENV_FILE" ]]; then
  load_env_file "$ENV_FILE"
  echo ""
fi

CREATED=0
SKIPPED=0
EXISTED=0
FAILED=0

for entry in "${SECRETS[@]}"; do
  secret_name="${entry%%:*}"
  secret_desc="${entry#*:}"

  echo -e "${BLUE}-- $secret_name${NC} ($secret_desc)"

  if ! $DRY_RUN && secret_exists "$secret_name"; then
    log_warn "Secret '$secret_name' already exists - skipping creation"
    EXISTED=$((EXISTED + 1))
    grant_secret_access "$secret_name" "$SERVICE_ACCOUNT"
    echo ""
    continue
  fi

  value=""
  if value=$(get_secret_value "$secret_name" "$secret_desc"); then
    if create_secret "$secret_name"; then
      log_success "Created secret: $secret_name"
    else
      log_error "Failed to create secret: $secret_name"
      FAILED=$((FAILED + 1))
      echo ""
      continue
    fi

    if add_secret_version "$secret_name" "$value"; then
      log_success "Added value to: $secret_name"
    else
      log_error "Failed to add value to: $secret_name"
      FAILED=$((FAILED + 1))
      echo ""
      continue
    fi

    grant_secret_access "$secret_name" "$SERVICE_ACCOUNT"
    log_success "Granted access to Cloud Run service account"
    CREATED=$((CREATED + 1))
  else
    log_warn "Skipped (no value provided): $secret_name"
    SKIPPED=$((SKIPPED + 1))
  fi
  echo ""
done

echo ""
echo -e "${GREEN}========================================================${NC}"
echo -e "${GREEN}  Summary                                               ${NC}"
echo -e "${GREEN}========================================================${NC}"
echo -e "  Created:  ${GREEN}$CREATED${NC}"
echo -e "  Existed:  ${YELLOW}$EXISTED${NC}"
echo -e "  Skipped:  ${YELLOW}$SKIPPED${NC}"
echo -e "  Failed:   ${RED}$FAILED${NC}"
echo ""

if $DRY_RUN; then
  echo -e "${CYAN}This was a dry run. Re-run without --dry-run to apply.${NC}"
  echo ""
fi

echo -e "${BLUE}-- Cloud Run --set-secrets flags for deploy scripts:${NC}"
echo ""
echo -e "${CYAN}# Node.js backend (db-service):${NC}"
echo 'gcloud run deploy apolaki-db-service \'
echo '  --set-secrets=DATABASE_URL=DATABASE_URL:latest,JWT_SECRET=JWT_SECRET:latest,JWT_REFRESH_SECRET=JWT_REFRESH_SECRET:latest,OAUTH_GOOGLE_CLIENT_ID=OAUTH_GOOGLE_CLIENT_ID:latest,OAUTH_GOOGLE_CLIENT_SECRET=OAUTH_GOOGLE_CLIENT_SECRET:latest,OAUTH_FACEBOOK_CLIENT_ID=OAUTH_FACEBOOK_CLIENT_ID:latest,OAUTH_FACEBOOK_CLIENT_SECRET=OAUTH_FACEBOOK_CLIENT_SECRET:latest,OAUTH_INSTAGRAM_CLIENT_ID=OAUTH_INSTAGRAM_CLIENT_ID:latest,OAUTH_INSTAGRAM_CLIENT_SECRET=OAUTH_INSTAGRAM_CLIENT_SECRET:latest,VIBER_BOT_TOKEN=VIBER_BOT_TOKEN:latest,VIBER_CLIENT_ID=VIBER_CLIENT_ID:latest,VIBER_CLIENT_SECRET=VIBER_CLIENT_SECRET:latest,TELEGRAM_BOT_TOKEN=TELEGRAM_BOT_TOKEN:latest,WHATSAPP_API_TOKEN=WHATSAPP_API_TOKEN:latest,WHATSAPP_PHONE_NUMBER_ID=WHATSAPP_PHONE_NUMBER_ID:latest,WEATHER_API_KEY=WEATHER_API_KEY:latest,SMTP_USER=SMTP_USER:latest,SMTP_PASS=SMTP_PASS:latest,GOOGLE_SOLAR_API_KEY=GOOGLE_SOLAR_API_KEY:latest,NREL_API_KEY=NREL_API_KEY:latest'
echo ""
echo -e "${CYAN}# Go solar service:${NC}"
echo 'gcloud run deploy apolaki-solar-service \'
echo '  --set-secrets=GOOGLE_SOLAR_API_KEY=GOOGLE_SOLAR_API_KEY:latest,NREL_API_KEY=NREL_API_KEY:latest,DATABASE_URL=DATABASE_URL:latest'
echo ""

log_success "Phase 6 - setup-secrets-gcp.sh complete"
