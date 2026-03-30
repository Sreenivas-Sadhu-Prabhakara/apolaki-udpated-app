# Step 6.1 — Create setup-secrets-gcp.sh Script

## Maker Output

**Script**: `scripts/gcp-migration/setup-secrets-gcp.sh`

### What the script does:
1. Defines 20 secrets that need to be in GCP Secret Manager
2. Supports `--env-file` to load values from an env file
3. Supports `--dry-run` to preview without making changes
4. For each secret: checks if it exists, creates it, adds a version with the value
5. Grants `secretmanager.secretAccessor` role to the default Compute Engine SA
6. Prints a summary and generates `--set-secrets` flags for Cloud Run deploy commands
7. Fully idempotent — safe to re-run

### Secrets managed:
- DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET
- OAUTH_GOOGLE_CLIENT_ID, OAUTH_GOOGLE_CLIENT_SECRET
- OAUTH_FACEBOOK_CLIENT_ID, OAUTH_FACEBOOK_CLIENT_SECRET
- OAUTH_INSTAGRAM_CLIENT_ID, OAUTH_INSTAGRAM_CLIENT_SECRET
- VIBER_BOT_TOKEN, VIBER_CLIENT_ID, VIBER_CLIENT_SECRET
- TELEGRAM_BOT_TOKEN
- WHATSAPP_API_TOKEN, WHATSAPP_PHONE_NUMBER_ID
- WEATHER_API_KEY, SMTP_USER, SMTP_PASS
- GOOGLE_SOLAR_API_KEY, NREL_API_KEY

## Status: READY FOR CHECKER REVIEW
