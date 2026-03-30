# Apolaki Solar Platform — GCP Migration Complete

**Date**: March 30, 2026
**Status**: ✅ All 8 phases complete

---

## Migration Summary

| Phase | Description | Status | Branch |
|-------|-------------|--------|--------|
| 0 | GCP Project Setup | ✅ Complete | `gcp/phase-0-setup` |
| 1 | Database Migration | ✅ Complete | `gcp/phase-1-database` |
| 2 | Static Assets → Cloud Storage | ✅ Complete | `gcp/phase-2-assets` |
| 3 | Frontend → Firebase Hosting | ✅ Complete | `gcp/phase-3-frontend` |
| 4 | Node.js Backend → Cloud Run | ✅ Complete | `gcp/phase-4-backend` |
| 5 | Go Solar Service → Cloud Run | ✅ Complete | `gcp/phase-5-solar` |
| 6 | Secrets → Secret Manager | ✅ Complete | `gcp/phase-6-secrets` |
| 7 | CI/CD → Cloud Build | ✅ Complete | `gcp/phase-7-cicd` |
| 8 | DNS, Monitoring, Cleanup & Tests | ✅ Complete | `gcp/phase-8-finalize` |

---

## GCP Resources

| Resource | Name | Region |
|----------|------|--------|
| Project | `apolaki-478302` | — |
| Artifact Registry | `apolaki-repo` | `us-central1` |
| Secret Manager | 20 secrets defined | automatic |
| Cloud Storage | `apolaki-assets` | `us-central1` |

---

## Deploy Commands

```bash
# Backend (Node.js → Cloud Run)
./scripts/gcp-migration/deploy-backend.sh

# Solar Service (Go → Cloud Run)
./scripts/gcp-migration/deploy-solar.sh

# Frontend (Vue.js → Firebase Hosting)
./scripts/gcp-migration/deploy-frontend.sh

# Upload assets to Cloud Storage
./scripts/gcp-migration/upload-assets.sh

# Setup secrets in Secret Manager
./scripts/gcp-migration/setup-secrets-gcp.sh --env-file config/env/.env.gcp
```

---

## Testing Commands

```bash
# Run ALL migration checks (bash, no server needed)
./scripts/gcp-migration/validate-migration.sh

# Run infrastructure file tests (mocha, no server needed)
cd tests && npm run test:infra

# Run API migration tests (requires running server)
cd tests && npm run test:migration

# Run both infra + API tests
cd tests && npm run test:gcp

# Run smoke tests
cd tests && npm run test:smoke
```

---

## Key Files Created/Modified

### New Files

| File | Purpose |
|------|---------|
| `cloudbuild.yaml` | Cloud Build: DB Service |
| `cloudbuild-frontend.yaml` | Cloud Build: Frontend |
| `cloudbuild-solar.yaml` | Cloud Build: Solar Service |
| `firebase.json` | Firebase Hosting config |
| `.firebaserc` | Firebase project binding |
| `config/env/.env.gcp` | GCP environment template |
| `config/gcs-cors.json` | Cloud Storage CORS config |
| `scripts/gcp-migration/deploy-backend.sh` | Deploy backend to Cloud Run |
| `scripts/gcp-migration/deploy-solar.sh` | Deploy solar service to Cloud Run |
| `scripts/gcp-migration/deploy-frontend.sh` | Deploy frontend to Firebase |
| `scripts/gcp-migration/upload-assets.sh` | Upload assets to GCS |
| `scripts/gcp-migration/setup-secrets-gcp.sh` | Secret Manager setup |
| `scripts/gcp-migration/setup-monitoring.sh` | Monitoring guidance |
| `scripts/gcp-migration/validate-migration.sh` | Migration validation (33 checks) |
| `tests/api/gcp-migration.test.js` | API migration tests |
| `tests/api/gcp-infra.test.js` | Infrastructure file tests (54 tests) |
| `middleware/netlify-db-service/.dockerignore` | Docker build exclusions |
| `archived/netlify.toml.archived` | Archived Netlify config |

### Modified Files

| File | Change |
|------|--------|
| `middleware/netlify-db-service/src/db.js` | Provider pattern (neon + pg) |
| `middleware/netlify-db-service/src/server.js` | Removed Netlify/Lambda, added Cloud Run |
| `middleware/netlify-db-service/package.json` | Swapped @netlify/neon → @neondatabase/serverless |
| `middleware/netlify-db-service/Dockerfile` | Cloud Run compatible |
| `middleware/solar-service/cmd/main.go` | PORT env var support |
| `config/config.manager.js` | Already GCP-compatible (no changes needed) |
| `frontend/.env.production` | GCP URLs |
| `tests/api/health.test.js` | Updated for new service name |
| `tests/package.json` | Added test:infra, test:migration, test:gcp scripts |

---

## Monthly Cost: $0.00

All services within GCP Free Tier limits. Budget alert set at $20/month.

---

## Future Migration Guide

To migrate this project to another cloud provider in the future:

1. **Run `validate-migration.sh`** to confirm current state
2. **Review `config/env/.env.gcp`** — all env vars are documented
3. **The key abstraction is `config/config.manager.js`** — it reads everything from `process.env`, so any cloud provider that injects env vars will work
4. **Database: `db.js` supports both Neon and standard `pg`** — set `DB_PROVIDER=pg` for any PostgreSQL
5. **Secrets: stored in GCP Secret Manager** — export with `gcloud secrets versions access latest --secret=NAME`
6. **Docker images work anywhere** — Cloud Run, ECS, K8s, Railway, Fly.io, etc.
7. **Frontend is a static SPA** — deploy to any CDN (Vercel, Cloudflare Pages, S3, etc.)
