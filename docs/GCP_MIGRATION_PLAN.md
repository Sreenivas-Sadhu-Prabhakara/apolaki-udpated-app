# Apolaki Solar Platform — GCP Free Tier Migration Plan

**Date**: March 30, 2026
**Pre-requisite**: Read [GCP_MIGRATION_STATE.md](GCP_MIGRATION_STATE.md) first

---

## HIGH-LEVEL MIGRATION OVERVIEW

```
PHASE 0: GCP Project Setup & Prerequisites
    ↓
PHASE 1: Database Migration (PostgreSQL → Neon/Supabase Free)
    ↓
PHASE 2: Static Assets → Google Cloud Storage Bucket + CDN
    ↓
PHASE 3: Frontend → Cloud Storage Static Website Hosting
    ↓
PHASE 4: Node.js Backend → Cloud Run (Containerized)
    ↓
PHASE 5: Go Solar Service → Cloud Run (Containerized)
    ↓
PHASE 6: Secrets & Config → Secret Manager
    ↓
PHASE 7: CI/CD → Cloud Build + Artifact Registry
    ↓
PHASE 8: DNS, SSL, Monitoring & Cleanup
    ↓
DONE ✅
```

---

## PHASE 0: GCP Project Setup & Prerequisites

**Goal**: Create GCP project, enable APIs, install tools, set billing alerts

### Steps

- [ ] **0.1** Create a GCP account (if new, you get $300 free credits for 90 days)
- [ ] **0.2** Create a new GCP project: `apolaki-solar`
- [ ] **0.3** Set up billing with $0 budget alert (you won't be charged on free tier)
- [ ] **0.4** Install Google Cloud CLI (`gcloud`)
- [ ] **0.5** Authenticate: `gcloud auth login`
- [ ] **0.6** Set project: `gcloud config set project apolaki-solar`
- [ ] **0.7** Enable required APIs:
  - Cloud Run API
  - Cloud Build API
  - Artifact Registry API
  - Cloud Storage API
  - Secret Manager API
  - Cloud Monitoring API
  - IAM API
- [ ] **0.8** Create Artifact Registry repository for Docker images
- [ ] **0.9** Install Docker (if not already installed)

### Files Created/Modified

None — this is infrastructure setup only.

### Estimated Time: 30 minutes

---

## PHASE 1: Database Migration

**Goal**: Move from Netlify Neon to a free-tier PostgreSQL provider accessible from GCP

### Strategy Decision

| Option | Cost | Storage | Pros | Cons |
|--------|------|---------|------|------|
| **Neon Free** | $0 | 0.5GB | Already using Neon via Netlify | Need standalone account |
| **Supabase Free** | $0 | 500MB | Full Postgres + Auth + REST | Extra features we may not need |
| **Cloud SQL** | ~$7/mo | 10GB | Native GCP, low latency | Not free |
| **AlloyDB Omni** | $0 (on Cloud Run) | Limited | Google's Postgres-compatible | Complex setup |

**Recommended**: **Neon Free Tier** (standalone) — minimal code changes since we already use `@netlify/neon`

### Steps

- [ ] **1.1** Create a standalone Neon account at neon.tech
- [ ] **1.2** Create a new Neon project: `apolaki-solar`
- [ ] **1.3** Get the connection string: `postgresql://user:pass@host/dbname?sslmode=require`
- [ ] **1.4** Run `init-db.sql` against the new Neon database to create schema
- [ ] **1.5** Seed marketplace products (from init-db.sql INSERT statements)
- [ ] **1.6** Update `middleware/netlify-db-service/src/db.js`:
  - Replace `@netlify/neon` import with standard `pg` Pool (or keep neon serverless driver)
  - Update connection to use `DATABASE_URL` env var pointing to Neon
- [ ] **1.7** Update `middleware/netlify-db-service/package.json`:
  - Remove `@netlify/neon` dependency (if switching to standard `pg`)
  - Or add `@neondatabase/serverless` for Neon's own driver
- [ ] **1.8** Test locally with new connection string
- [ ] **1.9** Run seed scripts to populate demo data

### Files Modified

- `middleware/netlify-db-service/src/db.js`
- `middleware/netlify-db-service/package.json`
- New: `config/env/.env.gcp`

### Estimated Time: 1-2 hours

---

## PHASE 2: Static Assets → Google Cloud Storage

**Goal**: Host all static assets (images, UI mockups, design files) on GCS bucket

### Steps

- [ ] **2.1** Create a Cloud Storage bucket: `apolaki-solar-assets`
  ```
  gsutil mb -p apolaki-solar -l us-central1 gs://apolaki-solar-assets
  ```
- [ ] **2.2** Set bucket to public-read for web assets:
  ```
  gsutil iam ch allUsers:objectViewer gs://apolaki-solar-assets
  ```
- [ ] **2.3** Upload `frontend/assets/Kitchen-sink-ui/` to bucket
- [ ] **2.4** Upload `frontend/public/` static files to bucket
- [ ] **2.5** Configure CORS on bucket for frontend access
- [ ] **2.6** Update frontend code to reference GCS URLs for assets
  - Change asset imports from relative paths to `https://storage.googleapis.com/apolaki-solar-assets/...`
- [ ] **2.7** Optional: Set up Cloud CDN in front of the bucket for caching
- [ ] **2.8** Test asset loading from GCS URLs

### Files Modified

- Frontend Vue components that reference assets
- `frontend/vite.config.js` (add asset base URL config)
- New: `scripts/upload-assets-gcs.sh`

### Estimated Time: 1 hour

---

## PHASE 3: Frontend → Cloud Storage Static Website

**Goal**: Host the Vue.js SPA build output on Cloud Storage as a static website

### Steps

- [ ] **3.1** Create a separate bucket for the frontend: `apolaki-solar-frontend`
  ```
  gsutil mb -p apolaki-solar -l us-central1 gs://apolaki-solar-frontend
  ```
- [ ] **3.2** Configure bucket for static website hosting:
  ```
  gsutil web set -m index.html -e index.html gs://apolaki-solar-frontend
  ```
- [ ] **3.3** Set public read access
- [ ] **3.4** Update `frontend/.env.production`:
  ```
  VITE_API_URL=https://api-apolaki-xxxxx.run.app/api
  VITE_ASSET_BASE_URL=https://storage.googleapis.com/apolaki-solar-assets
  ```
- [ ] **3.5** Build frontend: `cd frontend && npm run build`
- [ ] **3.6** Upload dist to bucket:
  ```
  gsutil -m rsync -r -d frontend/dist gs://apolaki-solar-frontend
  ```
- [ ] **3.7** Set cache headers for hashed assets (immutable) and no-cache for index.html
- [ ] **3.8** Test the static website URL
- [ ] **3.9** Optional: Put Cloud Load Balancer + CDN in front for custom domain + HTTPS

### Alternative: Firebase Hosting (simpler, free)

Firebase Hosting offers 10GB storage, automatic HTTPS, custom domains, and SPA routing out of the box:
- [ ] **3.A** `npm install -g firebase-tools`
- [ ] **3.B** `firebase init hosting` → set `frontend/dist` as public dir, SPA = yes
- [ ] **3.C** `firebase deploy --only hosting`

**Recommendation**: Use Firebase Hosting for the frontend (simpler SPA routing, free SSL, easy custom domain). Use Cloud Storage bucket for raw assets only.

### Files Created/Modified

- New: `firebase.json`
- New: `.firebaserc`
- `frontend/.env.production`
- New: `scripts/deploy-frontend-gcp.sh`

### Estimated Time: 1 hour

---

## PHASE 4: Node.js Backend → Cloud Run

**Goal**: Deploy the Express DB Service as a containerized Cloud Run service

### Steps

- [ ] **4.1** Update `middleware/netlify-db-service/Dockerfile` for Cloud Run:
  - Ensure it listens on `PORT` env var (Cloud Run injects this)
  - Remove Netlify-specific function detection
- [ ] **4.2** Update `middleware/netlify-db-service/src/server.js`:
  - Remove Netlify Lambda detection (`LAMBDA_TASK_ROOT`, `AWS_LAMBDA_FUNCTION_NAME`)
  - Always start as Express server (Cloud Run expects a listening HTTP server)
  - Read `PORT` from `process.env.PORT` (Cloud Run default: 8080)
- [ ] **4.3** Remove `serverless-http` dependency from `package.json`
- [ ] **4.4** Remove `@netlify/neon` references (done in Phase 1)
- [ ] **4.5** Build and push Docker image:
  ```
  gcloud builds submit --tag us-central1-docker.pkg.dev/apolaki-solar/apolaki/db-service:latest \
    middleware/netlify-db-service/
  ```
- [ ] **4.6** Deploy to Cloud Run:
  ```
  gcloud run deploy apolaki-db-service \
    --image us-central1-docker.pkg.dev/apolaki-solar/apolaki/db-service:latest \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated \
    --memory 256Mi \
    --cpu 1 \
    --min-instances 0 \
    --max-instances 2 \
    --port 3001 \
    --set-env-vars NODE_ENV=production \
    --set-secrets DATABASE_URL=DATABASE_URL:latest,JWT_SECRET=JWT_SECRET:latest
  ```
- [ ] **4.7** Note the Cloud Run URL: `https://apolaki-db-service-xxxxx.run.app`
- [ ] **4.8** Update frontend `VITE_API_URL` to point to this URL
- [ ] **4.9** Update OAuth callback URLs in Google/Facebook/Instagram developer consoles
- [ ] **4.10** Test all API endpoints via Cloud Run URL

### Files Modified

- `middleware/netlify-db-service/Dockerfile`
- `middleware/netlify-db-service/src/server.js`
- `middleware/netlify-db-service/package.json`
- New: `middleware/netlify-db-service/.dockerignore` (update)

### Estimated Time: 2-3 hours

---

## PHASE 5: Go Solar Service → Cloud Run

**Goal**: Deploy the Go microservice as a second Cloud Run service

### Steps

- [ ] **5.1** Verify `middleware/solar-service/Dockerfile` works (already production-ready)
- [ ] **5.2** Update Go service to read `PORT` from env (Cloud Run requirement)
- [ ] **5.3** Build and push Docker image:
  ```
  gcloud builds submit --tag us-central1-docker.pkg.dev/apolaki-solar/apolaki/solar-service:latest \
    middleware/solar-service/
  ```
- [ ] **5.4** Deploy to Cloud Run:
  ```
  gcloud run deploy apolaki-solar-service \
    --image us-central1-docker.pkg.dev/apolaki-solar/apolaki/solar-service:latest \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated \
    --memory 128Mi \
    --cpu 1 \
    --min-instances 0 \
    --max-instances 2 \
    --port 8080 \
    --set-env-vars APP_ENV=production \
    --set-secrets DATABASE_URL=DATABASE_URL:latest
  ```
- [ ] **5.5** Note the Cloud Run URL for the solar service
- [ ] **5.6** Update the DB Service to call the Solar Service via its Cloud Run URL (service-to-service)
- [ ] **5.7** Test solar-specific endpoints

### Files Modified

- `middleware/solar-service/cmd/main.go` (ensure PORT env var)
- `middleware/solar-service/Dockerfile` (minor tweaks if needed)

### Estimated Time: 1-2 hours

---

## PHASE 6: Secrets & Configuration → Secret Manager

**Goal**: Store all sensitive config in GCP Secret Manager instead of env files

### Steps

- [ ] **6.1** Create secrets in GCP Secret Manager:
  ```
  # Database
  gcloud secrets create DATABASE_URL --replication-policy="automatic"
  echo -n "postgresql://..." | gcloud secrets versions add DATABASE_URL --data-file=-
  
  # JWT
  gcloud secrets create JWT_SECRET --replication-policy="automatic"
  gcloud secrets create JWT_REFRESH_SECRET --replication-policy="automatic"
  
  # OAuth
  gcloud secrets create OAUTH_GOOGLE_CLIENT_ID --replication-policy="automatic"
  gcloud secrets create OAUTH_GOOGLE_CLIENT_SECRET --replication-policy="automatic"
  gcloud secrets create OAUTH_FACEBOOK_CLIENT_ID --replication-policy="automatic"
  gcloud secrets create OAUTH_FACEBOOK_CLIENT_SECRET --replication-policy="automatic"
  
  # Bot tokens
  gcloud secrets create VIBER_BOT_TOKEN --replication-policy="automatic"
  gcloud secrets create TELEGRAM_BOT_TOKEN --replication-policy="automatic"
  ```
- [ ] **6.2** Grant Cloud Run service accounts access to secrets:
  ```
  gcloud secrets add-iam-policy-binding DATABASE_URL \
    --member="serviceAccount:PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"
  ```
- [ ] **6.3** Update Cloud Run deployments to use `--set-secrets` flag
- [ ] **6.4** Update `config/config.manager.js` to optionally read from Secret Manager
  (Not required — Cloud Run injects secrets as env vars, so ConfigManager works as-is)
- [ ] **6.5** Verify no secrets in code, env files, or Docker images

### Files Created

- New: `scripts/setup-secrets-gcp.sh` (automation script)

### Estimated Time: 1 hour

---

## PHASE 7: CI/CD → Cloud Build + Artifact Registry

**Goal**: Replace GitHub Actions → Netlify deploy with Cloud Build → Cloud Run deploy

### Steps

- [ ] **7.1** Create Artifact Registry repository:
  ```
  gcloud artifacts repositories create apolaki \
    --repository-format=docker \
    --location=us-central1
  ```
- [ ] **7.2** Create `cloudbuild.yaml` for the DB Service:
  ```yaml
  steps:
    - name: 'gcr.io/cloud-builders/docker'
      args: ['build', '-t', 'us-central1-docker.pkg.dev/$PROJECT_ID/apolaki/db-service:$SHORT_SHA', 'middleware/netlify-db-service/']
    - name: 'gcr.io/cloud-builders/docker'
      args: ['push', 'us-central1-docker.pkg.dev/$PROJECT_ID/apolaki/db-service:$SHORT_SHA']
    - name: 'gcr.io/cloud-builders/gcloud'
      args: ['run', 'deploy', 'apolaki-db-service', '--image', 'us-central1-docker.pkg.dev/$PROJECT_ID/apolaki/db-service:$SHORT_SHA', '--region', 'us-central1']
  ```
- [ ] **7.3** Create `cloudbuild-frontend.yaml` for frontend builds:
  ```yaml
  steps:
    - name: 'node:18'
      entrypoint: 'bash'
      args: ['-c', 'cd frontend && npm ci && npm run build']
    - name: 'gcr.io/cloud-builders/gsutil'
      args: ['-m', 'rsync', '-r', '-d', 'frontend/dist', 'gs://apolaki-solar-frontend']
  ```
- [ ] **7.4** Create Cloud Build triggers:
  - On push to `main` → deploy to production
  - On push to `develop` → deploy to staging (optional)
- [ ] **7.5** Connect GitHub repository to Cloud Build
- [ ] **7.6** Update GitHub Actions workflows (deprecate or keep as backup)
- [ ] **7.7** Test the full CI/CD pipeline

### Files Created

- New: `cloudbuild.yaml`
- New: `cloudbuild-frontend.yaml`
- New: `cloudbuild-solar.yaml`

### Estimated Time: 2 hours

---

## PHASE 8: DNS, SSL, Monitoring & Cleanup

**Goal**: Configure custom domain, HTTPS, monitoring, and remove Netlify config

### Steps

- [ ] **8.1** Map custom domain to Cloud Run services (if applicable):
  ```
  gcloud run domain-mappings create --service apolaki-db-service --domain api.apolaki.com --region us-central1
  ```
- [ ] **8.2** Set up Firebase Hosting custom domain for frontend (automatic SSL)
- [ ] **8.3** Configure Cloud Monitoring:
  - Set up uptime checks for Cloud Run services
  - Create alerting policies for errors and latency
  - Set budget alerts at $0, $1, $5 thresholds
- [ ] **8.4** Update all OAuth provider callback URLs:
  - Google Cloud Console → OAuth credentials → Authorized redirect URIs
  - Facebook Developer → App Settings → Valid OAuth Redirect URIs
  - Instagram → same as Facebook
  - Viber → Bot webhook URL
  - Telegram → Bot webhook URL via BotFather
- [ ] **8.5** Clean up Netlify-specific files (archive, don't delete):
  - `netlify.toml` → `netlify.toml.archived`
  - Netlify-specific deploy scripts
  - `@netlify/neon` references
- [ ] **8.6** Update all documentation:
  - `README.md` — update Quick Start and deployment sections
  - `docs/DEPLOYMENT_GUIDE.md` — add GCP section
  - `DOCUMENTATION.md` — update deployment architecture
- [ ] **8.7** Final end-to-end testing:
  - [ ] Frontend loads from Firebase Hosting / Cloud Storage
  - [ ] Assets load from Cloud Storage bucket
  - [ ] API calls route to Cloud Run
  - [ ] OAuth login flows work with new callback URLs
  - [ ] Database operations work via Neon
  - [ ] Solar service endpoints respond

### Estimated Time: 2-3 hours

---

## COST SUMMARY (Monthly)

| Service | Usage | Cost |
|---------|-------|------|
| Cloud Run (DB Service) | ~50K requests/month | $0.00 (within free tier) |
| Cloud Run (Solar Service) | ~20K requests/month | $0.00 (within free tier) |
| Cloud Storage (Assets) | ~5MB stored, ~1GB egress | $0.00 (within free tier) |
| Cloud Storage (Frontend) | ~3MB stored, ~1GB egress | $0.00 (within free tier) |
| Firebase Hosting (alternative) | ~3MB, ~100MB/day | $0.00 (within free tier) |
| Neon PostgreSQL | ~100MB data | $0.00 (free tier) |
| Secret Manager | ~15 secrets | $0.00 (6 free active versions) |
| Artifact Registry | ~200MB images | $0.00 (500MB free) |
| Cloud Build | ~10 builds/day | $0.00 (120 min/day free) |
| Cloud Monitoring | Basic metrics | $0.00 (free for GCP services) |
| **TOTAL** | | **$0.00/month** |

---

## EXECUTION ORDER & DEPENDENCIES

```
Phase 0 ──→ Phase 1 ──→ Phase 4 ──→ Phase 5
                │              │
                ↓              ↓
           Phase 2 ──→ Phase 3 ──→ Phase 6 ──→ Phase 7 ──→ Phase 8
```

- **Phase 0** must be first (project setup)
- **Phase 1** (database) must be before Phase 4/5 (backend services need DB)
- **Phase 2** (assets) can run parallel with Phase 1
- **Phase 3** (frontend) needs Phase 2 (asset URLs) and Phase 4 (API URL)
- **Phase 4 & 5** (backend services) need Phase 1 (database)
- **Phase 6** (secrets) should be done alongside Phase 4/5
- **Phase 7** (CI/CD) comes after all services are deployed manually
- **Phase 8** (DNS/monitoring) is final polish

---

## READY TO START?

**Say "Let's do Phase 0" and we'll begin step by step.**

Each phase will include:
1. Exact terminal commands to run
2. Code changes with diffs
3. Verification steps
4. Troubleshooting tips

We'll go one phase at a time, verifying everything works before moving on.
