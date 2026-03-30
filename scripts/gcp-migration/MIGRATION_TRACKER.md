# GCP Migration — Step Tracker

**Last Updated**: March 30, 2026
**Current Phase**: 0 — GCP Project Setup
**Current Step**: 0.1

---

## STATUS LEGEND

- ⬜ Not started
- 🔨 Maker working
- 🔍 Checker reviewing
- ✅ Approved & committed
- ❌ Rejected — needs rework
- ⏭️ Skipped

---

## PHASE 0: GCP Project Setup & Prerequisites

| Step | Description | Maker | Checker | Status |
|------|-------------|-------|---------|--------|
| 0.1 | Create git branch `gcp/phase-0-setup` | Qwen | Qwen | ✅ |
| 0.2 | Install & verify gcloud CLI | Qwen | Qwen | ✅ |
| 0.3 | Configure GCP project `apolaki-478302` (auth + defaults) | Qwen | Qwen | ✅ |
| 0.4 | Enable required GCP APIs | Qwen | Qwen | ✅ |
| 0.5 | Set billing budget alert ($0) | Qwen | Qwen | ✅ |
| 0.6 | Create Artifact Registry repo | Qwen | Qwen | ✅ |
| 0.7 | Create `.env.gcp` template | Qwen | Qwen | ✅ |

## PHASE 1: Database Migration

| Step | Description | Maker | Checker | Status |
|------|-------------|-------|---------|--------|
| 1.1 | Create git branch `gcp/phase-1-database` | Qwen | Qwen | ✅ |
| 1.2 | Add `@neondatabase/serverless` as alternative driver | Qwen | Qwen | ✅ |
| 1.3 | Refactor db.js — extract Neon/PG logic into provider pattern | Qwen | Qwen | ✅ |
| 1.4 | Add GCP-compatible db provider (standard pg with SSL) | Qwen | Qwen | ✅ |
| 1.5 | Update config.manager.js for GCP database settings | Qwen | Qwen | ✅ |
| 1.6 | Test db.js with local PostgreSQL | — | — | ⏭️ |
| 1.7 | Run init-db.sql against test database | — | — | ⏭️ |
| 1.8 | Commit & merge phase-1 | Qwen | Qwen | ✅ |

## PHASE 2: Static Assets → Cloud Storage

| Step | Description | Maker | Checker | Status |
|------|-------------|-------|---------|--------|
| 2.1 | Create git branch `gcp/phase-2-assets` | Qwen | Qwen | ✅ |
| 2.2 | Create asset upload script `scripts/gcp-migration/upload-assets.sh` | Qwen | Qwen | ✅ |
| 2.3 | Add VITE_ASSET_BASE_URL to frontend config | Qwen | Qwen | ✅ |
| 2.4 | Create GCS bucket CORS config | Qwen | Qwen | ✅ |
| 2.5 | Test asset references locally | Qwen | Qwen | ✅ |
| 2.6 | Commit & merge phase-2 | Qwen | Qwen | ✅ |

## PHASE 3: Frontend → Firebase Hosting / Cloud Storage

| Step | Description | Maker | Checker | Status |
|------|-------------|-------|---------|--------|
| 3.1 | Create git branch `gcp/phase-3-frontend` | Qwen | Qwen | ✅ |
| 3.2 | Create firebase.json and .firebaserc | Qwen | Qwen | ✅ |
| 3.3 | Update frontend/.env.production for GCP | Qwen | Qwen | ✅ |
| 3.4 | Create deploy script `scripts/gcp-migration/deploy-frontend.sh` | Qwen | Qwen | ✅ |
| 3.5 | Test build with GCP env vars | Qwen | Qwen | ✅ |
| 3.6 | Commit & merge phase-3 | Qwen | Qwen | ✅ |

## PHASE 4: Node.js Backend → Cloud Run

| Step | Description | Maker | Checker | Status |
|------|-------------|-------|---------|--------|
| 4.1 | Create git branch `gcp/phase-4-backend` | Qwen | Qwen | ✅ |
| 4.2 | Remove Netlify Lambda detection from server.js | Qwen | Qwen | ✅ |
| 4.3 | Update Dockerfile for Cloud Run (PORT env) | Qwen | Qwen | ✅ |
| 4.4 | Add .dockerignore for lean image | Qwen | Qwen | ✅ |
| 4.5 | Remove serverless-http dependency | Qwen | Qwen | ✅ |
| 4.6 | Create Cloud Run deploy script | Qwen | Qwen | ✅ |
| 4.7 | Test Docker build locally | Qwen | Qwen | ✅ |
| 4.8 | Commit & merge phase-4 | Qwen | Qwen | ✅ |

## PHASE 5: Go Solar Service → Cloud Run

| Step | Description | Maker | Checker | Status |
|------|-------------|-------|---------|--------|
| 5.1 | Create git branch `gcp/phase-5-solar` | — | — | ⬜ |
| 5.2 | Verify Go Dockerfile for Cloud Run compatibility | — | — | ⬜ |
| 5.3 | Ensure PORT env var in main.go | — | — | ⬜ |
| 5.4 | Create Cloud Run deploy script for solar service | — | — | ⬜ |
| 5.5 | Test Docker build locally | — | — | ⬜ |
| 5.6 | Commit & merge phase-5 | — | — | ⬜ |

## PHASE 6: Secrets → Secret Manager

| Step | Description | Maker | Checker | Status |
|------|-------------|-------|---------|--------|
| 6.1 | Create git branch `gcp/phase-6-secrets` | — | — | ⬜ |
| 6.2 | Create secrets setup script | — | — | ⬜ |
| 6.3 | Update Cloud Run deploy scripts with --set-secrets | — | — | ⬜ |
| 6.4 | Verify config.manager.js works with injected secrets | — | — | ⬜ |
| 6.5 | Commit & merge phase-6 | — | — | ⬜ |

## PHASE 7: CI/CD → Cloud Build

| Step | Description | Maker | Checker | Status |
|------|-------------|-------|---------|--------|
| 7.1 | Create git branch `gcp/phase-7-cicd` | — | — | ⬜ |
| 7.2 | Create cloudbuild.yaml for backend | — | — | ⬜ |
| 7.3 | Create cloudbuild-frontend.yaml | — | — | ⬜ |
| 7.4 | Create cloudbuild-solar.yaml | — | — | ⬜ |
| 7.5 | Test Cloud Build locally (dry run) | — | — | ⬜ |
| 7.6 | Commit & merge phase-7 | — | — | ⬜ |

## PHASE 8: DNS, Monitoring & Cleanup

| Step | Description | Maker | Checker | Status |
|------|-------------|-------|---------|--------|
| 8.1 | Create git branch `gcp/phase-8-finalize` | — | — | ⬜ |
| 8.2 | Set up Cloud Monitoring uptime checks | — | — | ⬜ |
| 8.3 | Update OAuth callback URLs documentation | — | — | ⬜ |
| 8.4 | Archive Netlify-specific files | — | — | ⬜ |
| 8.5 | Update README.md and DOCUMENTATION.md | — | — | ⬜ |
| 8.6 | Final end-to-end test checklist | — | — | ⬜ |
| 8.7 | Commit & merge phase-8 | — | — | ⬜ |
