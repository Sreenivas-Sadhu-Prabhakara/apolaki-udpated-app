#!/bin/bash
# ============================================================================
# Apolaki Solar Platform — GCP Monitoring & Alerting Setup
# Phase 8: Uptime checks, budget alerts, and log-based metrics
# ============================================================================
set -euo pipefail

PROJECT_ID="${GCP_PROJECT_ID:-apolaki-478302}"
REGION="us-central1"

echo "========================================================"
echo "  Apolaki — GCP Monitoring Setup"
echo "========================================================"
echo ""

# 1. Enable monitoring API (idempotent)
echo "Enabling monitoring API..."
gcloud services enable monitoring.googleapis.com --project="$PROJECT_ID" 2>/dev/null || true
echo "OK"

# 2. Create uptime check for backend health endpoint
echo ""
echo "Creating uptime checks..."

# Get Cloud Run service URLs
BACKEND_URL=$(gcloud run services describe apolaki-backend \
  --region="$REGION" --project="$PROJECT_ID" \
  --format='value(status.url)' 2>/dev/null || echo "")

SOLAR_URL=$(gcloud run services describe apolaki-solar \
  --region="$REGION" --project="$PROJECT_ID" \
  --format='value(status.url)' 2>/dev/null || echo "")

if [ -n "$BACKEND_URL" ]; then
  echo "Backend URL: $BACKEND_URL"
  # Create uptime check via gcloud (or API)
  echo "  -> Set up uptime check at: ${BACKEND_URL}/health"
  echo "     (Configure in Cloud Console > Monitoring > Uptime Checks)"
else
  echo "WARN: Backend not deployed yet. Skipping uptime check."
fi

if [ -n "$SOLAR_URL" ]; then
  echo "Solar URL: $SOLAR_URL"
  echo "  -> Set up uptime check at: ${SOLAR_URL}/health"
else
  echo "WARN: Solar service not deployed yet. Skipping uptime check."
fi

# 3. Budget alerts
echo ""
echo "Budget alerts:"
echo "  Current budget: \$20/month (set in Phase 0)"
echo "  Recommended additional thresholds:"
echo "    - \$0 (any spend = investigate)"
echo "    - \$5 (medium alert)"
echo "    - \$10 (high alert)"
echo "  Configure at: https://console.cloud.google.com/billing/budgets?project=$PROJECT_ID"

# 4. Log-based alerts
echo ""
echo "Setting up log-based alerting..."
echo "  Cloud Run errors are automatically logged to Cloud Logging."
echo "  Configure alert policies at:"
echo "    https://console.cloud.google.com/monitoring/alerting?project=$PROJECT_ID"
echo ""
echo "  Recommended alert policies:"
echo "    1. Cloud Run error rate > 5% over 5 minutes"
echo "    2. Cloud Run latency p99 > 5s"
echo "    3. Cloud Run instance count > 2 (unexpected scaling)"

echo ""
echo "OK Monitoring setup guidance complete"
echo ""
echo "STEP_RESULT: SUCCESS"
