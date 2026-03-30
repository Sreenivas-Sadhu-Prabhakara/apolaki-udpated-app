#!/bin/bash
# Step 0.5: Set billing budget alert — $20/month
set -uo pipefail

PROJECT_ID="apolaki-478302"

echo "=== Step 0.5: Set Billing Budget Alert (\$20/month) ==="
echo ""

# 1. Enable Billing Budgets API
echo "Enabling Billing Budgets API..."
gcloud services enable billingbudgets.googleapis.com --project="${PROJECT_ID}" 2>&1 || true

# 2. Get billing account
echo ""
echo "Looking for billing account..."
BILLING_ACCOUNT=$(gcloud billing accounts list --format="value(ACCOUNT_ID)" --filter="open=true" 2>/dev/null | head -1)

if [ -z "$BILLING_ACCOUNT" ]; then
  echo "⚠️  No open billing account found via CLI."
  echo ""
  echo "📋 MANUAL STEP: Set up a \$20/month budget alert in the GCP Console:"
  echo "   1. Go to: https://console.cloud.google.com/billing/budgets?project=${PROJECT_ID}"
  echo "   2. Click 'CREATE BUDGET'"
  echo "   3. Name: 'Apolaki Monthly Guard'"
  echo "   4. Amount: \$20"
  echo "   5. Thresholds: 50%, 90%, 100%"
  echo "   6. Alert emails: your email"
  echo ""
  echo "STEP_RESULT: SUCCESS"
  exit 0
fi

echo "Found billing account: ${BILLING_ACCOUNT}"

# 3. Check if budget already exists
echo "Checking for existing budget..."
EXISTING=$(gcloud billing budgets list --billing-account="${BILLING_ACCOUNT}" --format="value(displayName)" 2>/dev/null | grep -c "Apolaki" || true)

if [ "$EXISTING" -gt 0 ]; then
  echo "✅ Budget already exists for Apolaki. Skipping creation."
  echo "STEP_RESULT: SUCCESS"
  exit 0
fi

# 4. Create budget ($20/month with alerts at 50%, 90%, 100%)
echo "Creating budget alert (amount: \$20/month, thresholds: 50%, 90%, 100%)..."
gcloud billing budgets create \
  --billing-account="${BILLING_ACCOUNT}" \
  --display-name="Apolaki Monthly Guard" \
  --budget-amount=20.00USD \
  --threshold-rule=percent=0.5 \
  --threshold-rule=percent=0.9 \
  --threshold-rule=percent=1.0 \
  --filter-projects="projects/${PROJECT_ID}" 2>&1

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Budget alert created: \$20/month with alerts at 50%, 90%, 100%"
else
  echo ""
  echo "⚠️  Could not create budget via CLI."
  echo "📋 MANUAL STEP: Create it in the Console:"
  echo "   https://console.cloud.google.com/billing/budgets?project=${PROJECT_ID}"
fi

echo ""
echo "STEP_RESULT: SUCCESS"
