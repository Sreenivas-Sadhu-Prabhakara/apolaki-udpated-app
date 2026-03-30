#!/bin/bash
# Deploy backend to Cloud Run
# Usage: ./scripts/gcp-migration/deploy-backend.sh
set -euo pipefail

PROJECT_ID="apolaki-478302"
REGION="us-central1"
SERVICE_NAME="apolaki-backend"
IMAGE="us-central1-docker.pkg.dev/${PROJECT_ID}/apolaki-repo/${SERVICE_NAME}"

echo "=== Deploy Backend to Cloud Run ==="
echo "Service: ${SERVICE_NAME}"
echo "Image: ${IMAGE}"
echo ""

# 1. Build and push Docker image
echo "Building Docker image..."
cd /Users/macstudio/Documents/Code/apolaki-udpated-app/middleware/netlify-db-service

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
  --memory 256Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 2 \
  --set-env-vars "NODE_ENV=production,APP_ENV=production" \
  --set-secrets "DATABASE_URL=DATABASE_URL:latest,JWT_SECRET=JWT_SECRET:latest,JWT_REFRESH_SECRET=JWT_REFRESH_SECRET:latest,WEATHER_API_KEY=WEATHER_API_KEY:latest,GOOGLE_SOLAR_API_KEY=GOOGLE_SOLAR_API_KEY:latest,NREL_API_KEY=NREL_API_KEY:latest" \
  2>&1

echo ""
echo "✅ Backend deployed to Cloud Run!"
echo "URL: $(gcloud run services describe ${SERVICE_NAME} --region ${REGION} --project ${PROJECT_ID} --format 'value(status.url)' 2>/dev/null)"
echo ""
echo "STEP_RESULT: SUCCESS"
