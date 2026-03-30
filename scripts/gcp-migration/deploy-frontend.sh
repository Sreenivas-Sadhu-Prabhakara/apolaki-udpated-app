#!/bin/bash
# Deploy frontend to Firebase Hosting
# Usage: ./scripts/gcp-migration/deploy-frontend.sh
set -euo pipefail

PROJECT_ROOT="/Users/macstudio/Documents/Code/apolaki-udpated-app"
PROJECT_ID="apolaki-478302"

echo "=== Deploy Frontend to Firebase Hosting ==="
echo "Project: ${PROJECT_ID}"
echo ""

# 1. Build frontend
echo "Building frontend..."
cd "${PROJECT_ROOT}/frontend"
npm run build 2>&1 | tail -10

if [ ! -f "${PROJECT_ROOT}/frontend/dist/index.html" ]; then
  echo "STEP_RESULT: FAILED: Build did not produce dist/index.html"
  exit 1
fi
echo "✅ Frontend built ($(find dist -type f | wc -l | tr -d ' ') files)"

# 2. Deploy to Firebase Hosting
echo ""
echo "Deploying to Firebase Hosting..."
cd "${PROJECT_ROOT}"

# Check if firebase CLI is available
if ! command -v firebase &>/dev/null; then
  echo "⚠️  Firebase CLI not found. Installing..."
  npm install -g firebase-tools
fi

firebase deploy --only hosting --project "${PROJECT_ID}" 2>&1

echo ""
echo "✅ Frontend deployed to Firebase Hosting!"
echo "URL: https://${PROJECT_ID}.web.app"
echo ""
echo "STEP_RESULT: SUCCESS"
