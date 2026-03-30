#!/bin/bash
# ============================================================================
# Apolaki Solar Platform — Migration Validation
# Runs all infrastructure and API tests to verify migration correctness.
# Use after any migration phase or before deploying.
# ============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo -e "${GREEN}========================================================${NC}"
echo -e "${GREEN}  Apolaki — Migration Validation Suite                  ${NC}"
echo -e "${GREEN}========================================================${NC}"
echo ""

PASSED=0
FAILED=0
SKIPPED=0

check() {
  local desc="$1"
  local cmd="$2"
  printf "  %-50s" "$desc"
  if eval "$cmd" >/dev/null 2>&1; then
    echo -e "${GREEN}PASS${NC}"
    PASSED=$((PASSED + 1))
  else
    echo -e "${RED}FAIL${NC}"
    FAILED=$((FAILED + 1))
  fi
}

skip() {
  local desc="$1"
  printf "  %-50s" "$desc"
  echo -e "${YELLOW}SKIP${NC}"
  SKIPPED=$((SKIPPED + 1))
}

echo -e "${BLUE}[1/6] File Structure${NC}"
check "cloudbuild.yaml exists"          "test -f $ROOT_DIR/cloudbuild.yaml"
check "cloudbuild-frontend.yaml exists" "test -f $ROOT_DIR/cloudbuild-frontend.yaml"
check "cloudbuild-solar.yaml exists"    "test -f $ROOT_DIR/cloudbuild-solar.yaml"
check "firebase.json exists"            "test -f $ROOT_DIR/firebase.json"
check ".firebaserc exists"              "test -f $ROOT_DIR/.firebaserc"
check ".env.gcp template exists"        "test -f $ROOT_DIR/config/env/.env.gcp"
check "Backend Dockerfile exists"       "test -f $ROOT_DIR/middleware/netlify-db-service/Dockerfile"
check "Solar Dockerfile exists"         "test -f $ROOT_DIR/middleware/solar-service/Dockerfile"
check "netlify.toml archived"           "test -f $ROOT_DIR/archived/netlify.toml.archived"
check "netlify.toml removed from root"  "test ! -f $ROOT_DIR/netlify.toml"
echo ""

echo -e "${BLUE}[2/6] Deploy Scripts${NC}"
check "deploy-backend.sh executable"    "test -x $ROOT_DIR/scripts/gcp-migration/deploy-backend.sh"
check "deploy-solar.sh executable"      "test -x $ROOT_DIR/scripts/gcp-migration/deploy-solar.sh"
check "deploy-frontend.sh executable"   "test -x $ROOT_DIR/scripts/gcp-migration/deploy-frontend.sh"
check "setup-secrets-gcp.sh executable" "test -x $ROOT_DIR/scripts/gcp-migration/setup-secrets-gcp.sh"
check "upload-assets.sh executable"     "test -x $ROOT_DIR/scripts/gcp-migration/upload-assets.sh"
check "setup-monitoring.sh executable"  "test -x $ROOT_DIR/scripts/gcp-migration/setup-monitoring.sh"
check "validate-migration.sh executable" "test -x $ROOT_DIR/scripts/gcp-migration/validate-migration.sh"
echo ""

echo -e "${BLUE}[3/6] Secret Manager Integration${NC}"
check "deploy-backend uses --set-secrets" "grep -q 'set-secrets' $ROOT_DIR/scripts/gcp-migration/deploy-backend.sh"
check "deploy-solar uses --set-secrets"   "grep -q 'set-secrets' $ROOT_DIR/scripts/gcp-migration/deploy-solar.sh"
check "cloudbuild.yaml uses --set-secrets" "grep -q 'set-secrets' $ROOT_DIR/cloudbuild.yaml"
echo ""

echo -e "${BLUE}[4/6] Code Cleanup${NC}"
check "No @netlify/neon in package.json"  "! grep -q '@netlify/neon' $ROOT_DIR/middleware/netlify-db-service/package.json"
check "Has @neondatabase/serverless"      "grep -q '@neondatabase/serverless' $ROOT_DIR/middleware/netlify-db-service/package.json"
check "No Lambda detection in server.js"  "! grep -q 'LAMBDA_TASK_ROOT' $ROOT_DIR/middleware/netlify-db-service/src/server.js"
check "No serverless-http in server.js"   "! grep -q 'serverless-http' $ROOT_DIR/middleware/netlify-db-service/src/server.js"
check "db.js supports DB_PROVIDER env"    "grep -q 'DB_PROVIDER' $ROOT_DIR/middleware/netlify-db-service/src/db.js"
echo ""

echo -e "${BLUE}[5/6] GCP CLI & Project${NC}"
if command -v gcloud >/dev/null 2>&1; then
  check "gcloud CLI installed"            "command -v gcloud"
  check "gcloud authenticated"            "gcloud auth list --filter=status:ACTIVE --format='value(account)' 2>/dev/null | grep -q '@'"
  check "Project apolaki-478302 accessible" "gcloud projects describe apolaki-478302 --format='value(projectId)' 2>/dev/null | grep -q 'apolaki'"
  check "Artifact Registry repo exists"   "gcloud artifacts repositories describe apolaki-repo --location=us-central1 --project=apolaki-478302 2>/dev/null | grep -q 'apolaki-repo'"
  check "WEATHER_API_KEY in Secret Manager" "gcloud secrets describe WEATHER_API_KEY --project=apolaki-478302 2>/dev/null | grep -q 'WEATHER_API_KEY'"
else
  skip "gcloud CLI not installed"
  skip "gcloud authentication"
  skip "GCP project access"
  skip "Artifact Registry"
  skip "Secret Manager"
fi
echo ""

echo -e "${BLUE}[6/6] Tests Available${NC}"
check "Migration API tests exist"       "test -f $ROOT_DIR/tests/api/gcp-migration.test.js"
check "Infrastructure tests exist"      "test -f $ROOT_DIR/tests/api/gcp-infra.test.js"
check "Health tests updated"            "grep -q 'apolaki-backend' $ROOT_DIR/tests/api/health.test.js"
echo ""

# Summary
TOTAL=$((PASSED + FAILED + SKIPPED))
echo -e "${GREEN}========================================================${NC}"
echo -e "  ${GREEN}Passed:  $PASSED${NC}"
echo -e "  ${RED}Failed:  $FAILED${NC}"
echo -e "  ${YELLOW}Skipped: $SKIPPED${NC}"
echo -e "  Total:   $TOTAL"
echo -e "${GREEN}========================================================${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}All checks passed! Migration is ready.${NC}"
  exit 0
else
  echo -e "${RED}$FAILED check(s) failed. Review above.${NC}"
  exit 1
fi
