# Apolaki Solar Platform — Current State Assessment

**Date**: March 30, 2026  
**Purpose**: Comprehensive state assessment prior to GCP Free Tier migration

---

## 1. CURRENT ARCHITECTURE STATE

### 1.1 System Overview

Apolaki is an **enterprise-grade Solar Energy Management Platform** with:
- Real-time solar installation monitoring
- Financial assessment & ROI calculations
- Digital marketplace for solar products
- Contract management & e-signatures
- Multi-provider OAuth authentication (Google, Facebook, Instagram, Viber, Telegram)

### 1.2 Technology Stack

| Layer | Technology | Current State |
|-------|-----------|---------------|
| **Frontend** | Vue.js 3 + Vite + Pinia + Tailwind CSS | ✅ Production-ready SPA |
| **Backend API** | Node.js 18 + Express (DB Service) | ✅ Running, Netlify Functions compatible |
| **Backend Microservice** | Go 1.21 + Gin (Solar Service) | ✅ Dockerized, gRPC/REST capable |
| **Database** | PostgreSQL 15+ | ✅ Full schema with 12+ tables |
| **Cache** | Redis 7 | ⚠️ Optional, configured in docker-compose |
| **Message Queue** | RabbitMQ 3.12 | ⚠️ Optional, configured in docker-compose |
| **Search** | Elasticsearch 8.11 | ⚠️ Optional, configured in docker-compose |
| **Auth** | Passport.js (JWT + OAuth2) | ✅ Google, Facebook, Instagram, Viber, Telegram |
| **File Storage** | AWS S3 (configured but may not be active) | ⚠️ Env vars present, needs migration |

### 1.3 Current Deployment Target
- **Frontend**: Netlify Static (CDN) — `netlify.toml` present
- **Backend**: Netlify Functions (serverless) — `serverless-http` wrapper
- **Database**: Netlify Neon (managed PostgreSQL) — `@netlify/neon` dependency
- **CI/CD**: GitHub Actions (4 workflows: frontend-ci, backend-ci, deploy, docker-build)
- **Container Orchestration**: Helm charts + K8s ready (but targeting Netlify currently)

### 1.4 Service Inventory

| Service | Port | Docker Image | Size/Notes |
|---------|------|-------------|------------|
| Frontend (Vue.js SPA) | 5173 (dev) / 3000 (prod) | `node:18-alpine` + `serve` | ~2.2MB built dist |
| DB Service (Node.js API) | 3001 | `node:18-alpine` | Express + Passport + pg |
| Solar Service (Go) | 8080 | `golang:1.21-alpine` → `alpine` | Gin + GORM + gRPC |
| PostgreSQL | 5432 | `postgres:15-alpine` | 12+ tables, pgcrypto, pg_trgm |
| Redis | 6379 | `redis:7-alpine` | Sessions & caching (optional) |
| RabbitMQ | 5672/15672 | `rabbitmq:3.12-management-alpine` | Message queue (optional) |
| Elasticsearch | 9200 | `elasticsearch:8.11.0` | Search & analytics (optional) |

### 1.5 Database Schema (12 Tables)

| Table | Purpose | Key Relations |
|-------|---------|---------------|
| `users` | User accounts | Primary entity |
| `oauth_providers` | OAuth links | → users |
| `sessions` | Auth sessions | → users |
| `audit_logs` | Security audit trail | → users |
| `solar_installations` | Solar panel installations | → users |
| `monitoring_data` | Real-time sensor data | → solar_installations |
| `performance_data` | Daily performance metrics | → solar_installations |
| `maintenance_log` | Maintenance records | → solar_installations |
| `contracts` | User contracts | → users |
| `assessments` | Solar assessments | → users |
| `marketplace_products` | Product catalog | Standalone |
| `finance` | Financial transactions | → users |
| `break_glass_sessions` | Emergency admin access | → users |

### 1.6 Static Assets Inventory

| Asset Category | Size | Location |
|---------------|------|----------|
| Kitchen Sink UI mockups | ~2.4MB | `frontend/assets/Kitchen-sink-ui/` |
| Total frontend assets | ~4.7MB | `frontend/assets/` |
| Public folder | ~164KB | `frontend/public/` |
| Built dist | ~2.2MB | `frontend/dist/` |
| Design prompt details | varies | `frontend/assets/design-prompt-details` |

### 1.7 Environment Variables (Categorized)

| Category | Count | GCP Equivalent |
|----------|-------|---------------|
| App Config | 6 | Cloud Run env vars |
| Database (PostgreSQL) | 6 | Cloud SQL connection string |
| Redis | 4 | Memorystore or Cloud Run env |
| RabbitMQ | 5 | Cloud Pub/Sub |
| JWT Auth | 4 | Secret Manager |
| OAuth Providers | 8 | Secret Manager |
| Viber/Telegram Bots | 6 | Secret Manager |
| AWS/S3 | 4 | → Cloud Storage |
| SMTP | 4 | Cloud Functions / SendGrid |
| Monitoring | 3 | Cloud Monitoring |

### 1.8 Configuration System

The `ConfigManager` pattern (`config/config.manager.js`) reads all configuration from environment variables at startup — **no hardcoded values**. This is a major advantage for GCP migration as we only need to change env vars, not code.

---

## 2. DEPENDENCIES & RISKS

### 2.1 Hard Dependencies (Must Migrate)
1. **PostgreSQL 15** — Core data store, 12+ tables with pgcrypto extensions
2. **Node.js 18 Runtime** — Express API server
3. **Go 1.21 Runtime** — Solar microservice
4. **Netlify Neon** (`@netlify/neon`) — Current DB driver, needs replacement with standard `pg`

### 2.2 Soft Dependencies (Can Skip on Free Tier)
1. **Redis** — Can defer; use in-memory sessions initially
2. **RabbitMQ** — Can defer; use synchronous calls initially
3. **Elasticsearch** — Can defer; use PostgreSQL `pg_trgm` for search
4. **Monitoring (Prometheus/Grafana)** — Use GCP Cloud Monitoring instead

### 2.3 Netlify-Specific Code to Migrate
- `@netlify/neon` package in db-service → replace with standard `pg` pool
- `serverless-http` wrapper → not needed on Cloud Run (direct Express)
- `netlify.toml` configuration → replace with GCP equivalents
- Lambda/Netlify environment detection in `server.js` → Cloud Run detection
- Netlify Functions directory structure → standard Express server

### 2.4 Risks
| Risk | Severity | Mitigation |
|------|----------|------------|
| Free tier PostgreSQL limits (storage) | Medium | Cloud SQL has no free tier; use Neon free or Supabase free, OR use Cloud SQL with $0 spend alerts |
| Go microservice memory on Cloud Run | Low | Free tier allows 2M requests/month |
| Static asset serving costs | Low | Cloud Storage free tier = 5GB storage + 1GB egress/month |
| OAuth callback URLs need updating | Low | Update all providers with new GCP URLs |
| Cold starts on Cloud Run | Medium | Minimum instances = 0 on free tier |

---

## 3. GCP FREE TIER LIMITS (as of 2026)

| GCP Service | Free Tier Allowance | Our Usage |
|-------------|-------------------|-----------|
| **Cloud Run** | 2M requests/month, 360K GB-sec, 180K vCPU-sec | Backend API + Go service |
| **Cloud Storage** | 5GB Standard, 1GB egress/month | Static assets, frontend dist |
| **Cloud SQL (PostgreSQL)** | ❌ No free tier (use alternatives) | Database |
| **Artifact Registry** | 500MB storage | Docker images |
| **Secret Manager** | 6 active secret versions, 10K access ops | OAuth secrets, JWT keys |
| **Cloud Build** | 120 build-min/day | CI/CD |
| **Cloud Monitoring** | Free for GCP services | Metrics & alerts |
| **Firebase Hosting** | 10GB storage, 360MB/day transfer | Alternative for frontend |
| **Memorystore (Redis)** | ❌ No free tier | Skip or use Cloud Run in-memory |
| **Cloud Pub/Sub** | 10GB/month | Replacement for RabbitMQ |

### PostgreSQL Free Tier Strategy

Since Cloud SQL has **no free tier**, we have options:
1. **Option A**: Use **AlloyDB Omni** or Cloud SQL with budget alerts ($0 threshold)
2. **Option B**: Use **Neon Free Tier** (0.5GB storage, 1 project) — external managed Postgres
3. **Option C**: Run PostgreSQL **inside Cloud Run** with Cloud Storage volume (not recommended for production)
4. **Option D**: Use **Supabase Free Tier** (500MB, 2 projects) — external managed Postgres

**Recommendation**: Option B (Neon) or D (Supabase) for truly $0 cost. Use Cloud SQL if willing to accept ~$7/month for smallest instance.

---

## 4. CURRENT STATE SUMMARY

```
┌─────────────────────────────────────────────────────────┐
│                    CURRENT STATE                         │
│                                                          │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐ │
│  │   Netlify    │  │  Netlify     │  │   Netlify      │ │
│  │   Static     │  │  Functions   │  │   Neon DB      │ │
│  │   (Vue SPA)  │  │  (Node.js)   │  │  (PostgreSQL)  │ │
│  └─────────────┘  └──────────────┘  └────────────────┘ │
│                                                          │
│  Go Solar Service: Dockerized but deployment unknown     │
│  Redis/RabbitMQ/ES: Docker Compose only (dev)            │
│  Assets: Embedded in frontend build (~4.7MB)             │
│  CI/CD: GitHub Actions → Netlify                         │
└─────────────────────────────────────────────────────────┘

                        ↓ MIGRATE TO ↓

┌─────────────────────────────────────────────────────────┐
│                    TARGET STATE (GCP)                     │
│                                                          │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐ │
│  │   Cloud      │  │  Cloud Run   │  │   Neon/Supa-   │ │
│  │   Storage    │  │  (Node.js +  │  │   base Free    │ │
│  │   + CDN      │  │   Go svc)    │  │  (PostgreSQL)  │ │
│  │   (Vue SPA)  │  │              │  │                │ │
│  └─────────────┘  └──────────────┘  └────────────────┘ │
│                                                          │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐ │
│  │   Secret     │  │  Cloud Build │  │   Cloud        │ │
│  │   Manager    │  │  (CI/CD)     │  │   Monitoring   │ │
│  └─────────────┘  └──────────────┘  └────────────────┘ │
│                                                          │
│  ┌─────────────┐  ┌──────────────┐                      │
│  │   Artifact   │  │  Cloud       │                      │
│  │   Registry   │  │  Pub/Sub     │                      │
│  │   (Docker)   │  │  (optional)  │                      │
│  └─────────────┘  └──────────────┘                      │
└─────────────────────────────────────────────────────────┘
```

---

*This document was generated by analyzing the full project structure, package.json files, Dockerfiles, docker-compose.yml, environment variables, database schema, architecture docs, and deployment configuration.*
