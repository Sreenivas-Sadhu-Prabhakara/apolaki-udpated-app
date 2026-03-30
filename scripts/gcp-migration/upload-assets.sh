#!/bin/bash
# Upload static assets from frontend/public/ to GCS bucket
# Usage: ./scripts/gcp-migration/upload-assets.sh
set -euo pipefail

PROJECT_ROOT="/Users/macstudio/Documents/Code/apolaki-udpated-app"
PROJECT_ID="apolaki-478302"
BUCKET_NAME="apolaki-assets-${PROJECT_ID}"
REGION="us-central1"

echo "=== Upload Static Assets to GCS ==="
echo "Bucket: gs://${BUCKET_NAME}"
echo ""

# 1. Create bucket if it doesn't exist
if gsutil ls -b "gs://${BUCKET_NAME}" &>/dev/null; then
  echo "✅ Bucket already exists"
else
  echo "Creating bucket..."
  gsutil mb -p "${PROJECT_ID}" -l "${REGION}" -b on "gs://${BUCKET_NAME}"
  echo "✅ Bucket created"
fi

# 2. Make bucket publicly readable
echo "Setting public read access..."
gsutil iam ch allUsers:objectViewer "gs://${BUCKET_NAME}" 2>&1 || true

# 3. Upload frontend/public/ contents
echo ""
echo "Uploading frontend/public/ → gs://${BUCKET_NAME}/public/..."
gsutil -m rsync -r "${PROJECT_ROOT}/frontend/public/" "gs://${BUCKET_NAME}/public/"

# 4. Set cache headers on uploaded files
echo ""
echo "Setting cache headers..."
gsutil -m setmeta -h "Cache-Control:public, max-age=3600" "gs://${BUCKET_NAME}/public/**" 2>/dev/null || true

# 5. Print results
echo ""
echo "✅ Assets uploaded successfully!"
echo "Public URL: https://storage.googleapis.com/${BUCKET_NAME}/public/"
echo ""
echo "STEP_RESULT: SUCCESS"
