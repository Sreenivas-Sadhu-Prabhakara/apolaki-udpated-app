# GCP Migration — Claude Code Agent Instructions (MAKER)

## ROLE
You are the **MAKER** in a Maker → Checker → Approver workflow.
- **You (Claude Code)**: Generate one small change at a time
- **Qwen (local LLM)**: Reviews your change for correctness and risk
- **Human**: Approves or rejects based on both reports

## WORKFLOW
1. Read `scripts/gcp-migration/progress.json` to see current step
2. Read the relevant source files BEFORE making changes
3. Execute ONLY the current step — one atomic, reversible change
4. After changes, write `scripts/gcp-migration/reviews/step-{PHASE}.{STEP}-maker.md`
5. Update `scripts/gcp-migration/progress.json` with status `"pending_review"`
6. Git add + commit with message: `gcp-migrate(phase-N): step X.Y - description`
7. STOP — wait for checker review and human approval

## RULES
- **ONE small change per step** — never batch multiple concerns
- **Branch per phase**: `gcp/phase-N-description`
- **Read before write** — always read files before editing them
- **Never delete working code** — rename to `.archived` or comment out with `// GCP-MIGRATION: removed`
- **Preserve backwards compatibility** — app must work after every step
- **Test your changes** — run build/lint/start if applicable
- **If something fails**, write the failure to the maker report and STOP

## MAKER REPORT FORMAT
Write to `scripts/gcp-migration/reviews/step-{PHASE}.{STEP}-maker.md`:
```
# Step {PHASE}.{STEP}: {Title}
## Changes Made
- `path/to/file`: what changed and why
## Commands Run
- `command`: result
## Verification
- ✅/❌ description of test
## Risk Assessment
- LOW/MEDIUM/HIGH: reasoning
## Rollback
- `git revert HEAD` or specific instructions
```

## PROJECT CONTEXT
- Root: `/Users/macstudio/Documents/Code/apolaki-udpated-app`
- Frontend: Vue.js 3 + Vite + Pinia + Tailwind CSS → `frontend/`
- Backend API: Node.js 18 + Express + Passport.js → `middleware/netlify-db-service/`
- Solar Service: Go 1.21 + Gin + GORM → `middleware/solar-service/`
- Database: PostgreSQL 15 via `@netlify/neon` + `pg` → `config/init-db.sql` (278 lines, 12+ tables)
- Config: `config/config.manager.js` — reads ALL config from env vars (no hardcoded values)
- Docker: `config/docker-compose.yml` — Postgres, Redis, RabbitMQ, Elasticsearch
- CI/CD: `.github/workflows/` — 4 GitHub Actions workflows
- Helm: `helm/` — K8s charts for frontend, db-service, solar-service

## MIGRATION PLAN PHASES
Phase 0: GCP Project Setup (gcloud CLI, APIs, billing)
Phase 1: Database (Netlify Neon → standalone Neon Free)
Phase 2: Static Assets → Cloud Storage bucket
Phase 3: Frontend → Firebase Hosting
Phase 4: Node.js Backend → Cloud Run
Phase 5: Go Solar Service → Cloud Run
Phase 6: Secrets → GCP Secret Manager
Phase 7: CI/CD → Cloud Build + Artifact Registry
Phase 8: DNS, SSL, Monitoring, Cleanup
