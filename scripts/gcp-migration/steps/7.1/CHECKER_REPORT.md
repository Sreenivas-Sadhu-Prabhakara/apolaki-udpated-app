# Phase 7 — CI/CD → Cloud Build + Artifact Registry

## Maker Output

### Files Created

| File | Purpose |
|------|---------|
| `cloudbuild.yaml` | DB Service: build → push → deploy to Cloud Run |
| `cloudbuild-frontend.yaml` | Frontend: npm build → deploy to Firebase Hosting |
| `cloudbuild-solar.yaml` | Solar Service: build → push → deploy to Cloud Run |

### Files Modified

| File | Change |
|------|--------|
| `scripts/gcp-migration/deploy-backend.sh` | Added `--set-secrets` flag |
| `scripts/gcp-migration/deploy-solar.sh` | Added `--set-secrets` and `--set-env-vars` flags |

### Files Archived

| File | Reason |
|------|--------|
| `.github/workflows/deploy.yml` | Targeted AWS EKS/Helm, no longer relevant |
| `.github/workflows/docker-build.yml` | Targeted GHCR, replaced by Artifact Registry |

### Kept (still useful)

- `.github/workflows/backend-ci.yml` — lint/test (platform-agnostic)
- `.github/workflows/frontend-ci.yml` — lint/test (platform-agnostic)

### Checker Review

- All YAML validated with Python yaml.safe_load
- Artifact Registry repo `apolaki-repo` already exists
- Image tags use `$SHORT_SHA` (unique per commit) + `latest`
- `--set-secrets` flags match Phase 6 secret names
- Cloud Build free tier: 120 min/day (sufficient)
- No secrets in cloudbuild YAML — all injected via Secret Manager

### Status: READY FOR APPROVAL
