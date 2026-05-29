#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────────────────────────────
# Apolaki Solar Platform — Pre-Deployment Verification Script
#
# Run this BEFORE every deployment to catch regressions and security gaps.
# ──────────────────────────────────────────────────────────────────────

FAILED=0
SKIP_E2E=${SKIP_E2E:-false}

echo ""
echo "🚀 Starting Pre-Deployment Verification..."
echo "══════════════════════════════════════"

# 1. Linting
echo "[1/4] Checking code standards..."
if npm run lint --silent; then
  echo "  ✅ Linting passed."
else
  echo "  ❌ Linting failed."
  FAILED=$((FAILED + 1))
fi

# 2. API Integration Tests (Regressions)
echo "[2/4] Running API regression suite..."
if npm run test:api --prefix tests -- --reporter min; then
  echo "  ✅ API regressions passed."
else
  echo "  ❌ API regressions failed."
  FAILED=$((FAILED + 1))
fi

# 3. Security Penetration Checks
echo "[3/4] Running security validation suite..."
if npm run test:security --prefix tests -- --reporter min; then
  echo "  ✅ Security checks passed."
else
  echo "  ❌ Security checks failed."
  FAILED=$((FAILED + 1))
fi

# 4. End-to-End (E2E) UI Tests
if [[ "$SKIP_E2E" == "true" ]]; then
  echo "[4/4] Skipping E2E tests (SKIP_E2E=true)."
else
  echo "[4/4] Running E2E user journey validation..."
  if npm run test:e2e --prefix tests -- --reporter min; then
    echo "  ✅ E2E validation passed."
  else
    echo "  ❌ E2E validation failed."
    FAILED=$((FAILED + 1))
  fi
fi

echo ""
echo "📊 Verification Summary:"
echo "══════════════════════════════════════"
if [[ "$FAILED" -eq 0 ]]; then
  echo "✅ ALL CHECKS PASSED — Safe to deploy."
  exit 0
else
  echo "🚫 $FAILED CHECK(S) FAILED — Deployment Blocked."
  exit 1
fi
