#!/bin/bash
# Deploy Go solar service to Cloud Run
# Usage: ./scripts/gcp-migration/deploy-solar.sh
set -euo pipefail

PROJECT_ID="apolaki-478302"
REGION="us-central1"
SERVICE_NAME="apolaki-solar"
IMAGE="us-central1-docker.pkg.dev/${PROJECT_ID}/apolaki-repo/${SERVICE_NAME}"

echo "=== Deploy Solar Service to Cloud Run ==="
echo "Service: ${SERVICE_NAME}"
echo "Image: ${IMAGE}"
echo ""

# 1. Build and push Docker image
echo "Building Docker image (Go multi-stage)..."
cd /Users/macstudio/Documents/Code/apolaki-udpated-app/middleware/solar-service

gcloud builds submit \
  --tag "${IMAGE}:latest" \
  --project "${PROJECT_ID}" \
  2>&1 | tail -20

echo ""
echo "✅ Image built and pushed"

# 2. Deploy to Cloud Run
echo ""
echo "Deploying to Cloud Run..."
gcloud run deploy "${SERVICE_NAME}" \
  --image "${IMAGE}:latest" \
  --platform managed \
  --region "${REGION}" \
  --project "${PROJECT_ID}" \
  --allow-unauthenticated \
  --port 8080 \
  --memory 128Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 2 \
  2>&1

echo ""
echo "✅ Solar service deployed to Cloud Run!"
echo "URL: $(gcloud run services describe ${SERVICE_NAME} --region ${REGION} --project ${PROJECT_ID} --format 'value(status.url)' 2>/dev/null)"
echo ""
echo "STEP_RESULT: SUCCESS"
