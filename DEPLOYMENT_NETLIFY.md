# Apolaki Deployment Guide - Separate Deployables

**Version**: 2.0  
**Updated**: February 26, 2026  
**Status**: Production Ready

## Overview

The Apolaki Solar Platform now supports **separate deployables** for frontend and backend, with the ability to combine them for unified Netlify deployment. Database configuration is handled through the `ConfigManager` class, reading from environment variables at runtime.

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Netlify Deployment                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────┐          ┌──────────────────────┐ │
│  │   Frontend (Vue.js)  │          │  Backend (Node.js)   │ │
│  │   Static Site        │          │  Functions           │ │
│  │   ✓ Built in CI/CD   │          │  ✓ Serverless        │ │
│  │   ✓ CDN delivered    │          │  ✓ Auto-scaling      │ │
│  └──────────────────────┘          └──────────────────────┘ │
│                                                               │
│              ┌────────────────────────────┐                  │
│              │   Managed PostgreSQL       │                  │
│              │   (Neon, Heroku, RDS)      │                  │
│              │   Config via ENV vars      │                  │
│              └────────────────────────────┘                  │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

### 1. Local Development

```bash
# Install dependencies for all packages
npm run setup

# Start full development environment (frontend + backend + database)
npm run dev:full

# Or run components separately:
npm run dev:frontend    # Vue.js on :5173
npm run dev:backend     # Express on :3001
npm run dev:db          # PostgreSQL + Redis in Docker
```

### 2. Build for Deployment

```bash
# Build all components
npm run build

# Or build individually:
npm run build:frontend  # Creates frontend/dist
npm run build:backend   # Installs dependencies
```

### 3. Deploy to Netlify

```bash
# Option A: One-time deploy
npm run deploy:netlify

# Option B: Connect to GitHub and Netlify handles CI/CD
# 1. Push to GitHub
# 2. Netlify automatically builds using netlify.toml
# 3. Set environment variables in Netlify dashboard
```

## Separate Deployables

### Frontend Deployable

**Location**: `./frontend`  
**Type**: Static site (Vue.js 3 + Vite)  
**Output**: `frontend/dist`  
**Framework**: Vue.js 3

```bash
# Build
npm run build --prefix frontend

# Deploy independently to any static host:
# - Netlify (CDN + static hosting)
# - Vercel
# - GitHub Pages
# - AWS S3 + CloudFront
# - CloudFlare Pages
```

**Environment Variables** (Vite build-time):
```bash
# Frontend makes API calls to this URL
VITE_API_URL=http://localhost:3001/api (dev) or /api (Netlify)
VITE_WS_URL=ws://localhost:3001/ws (dev) or /ws (Netlify)
```

### Backend Deployable

**Location**: `./middleware/netlify-db-service`  
**Type**: Node.js Express API  
**Runtime**: Node.js 18+

```bash
# Build (just install dependencies)
npm ci --prefix middleware/netlify-db-service

# Deploy independently to any platform:
# - Netlify Functions (serverless)
# - Heroku (PaaS)
# - Railway
# - AWS Lambda
# - Google Cloud Run
# - DigitalOcean App Platform
```

**Environment Variables** (Runtime):
```bash
# Database (ConfigManager reads at startup)
DATABASE_URL=postgresql://user:pass@host:5432/db
# OR
DB_HOST=...
DB_USER=...
DB_PASSWORD=...
DB_NAME=...

# Secrets
JWT_SECRET=...
JWT_REFRESH_SECRET=...
SESSION_SECRET=...

# URLs
FRONTEND_URL=https://apolaki.com (for CORS)
CORS_ORIGINS=https://apolaki.com
```

## Netlify Combined Deployment

### Setup

1. **Connect Repository**
```bash
# Link to your Netlify site
netlify link

# Or create a new site
netlify sites:create --name apolaki
```

2. **Configure Environment Variables**

Go to Netlify Dashboard → **Site settings** → **Build & deploy** → **Environment**

Add these variables:

```
# Database
DATABASE_URL = postgresql://user:password@neon.tech/apolaki

# Secrets (MUST be generated, not hardcoded)
JWT_SECRET = [run: openssl rand -base64 32]
JWT_REFRESH_SECRET = [run: openssl rand -base64 32]
SESSION_SECRET = [run: openssl rand -base64 32]

# Application
NODE_ENV = production
APP_NAME = Apolaki
FRONTEND_URL = https://apolaki.netlify.app

# CORS (match your Netlify domain)
CORS_ORIGINS = https://apolaki.netlify.app

# Caching
REDIS_ENABLED = false (Netlify doesn't support persistent services)
```

3. **Deploy**

```bash
# Automatic: Push to GitHub, Netlify deploys automatically
git push origin main

# Manual: Deploy specific directory
npm run build:netlify
netlify deploy --prod
```

### How Netlify Routes Work

**netlify.toml** handles routing:

```toml
[build]
publish = "frontend/dist"           # Static site output
functions = ".../netlify/functions" # Backend functions

[[redirects]]
from = "/api/*"
to = "/.netlify/functions/api"      # Route API calls to functions
status = 200

[[redirects]]
from = "/*"
to = "/index.html"                  # SPA fallback
status = 200
```

This means:
- `/` → `frontend/dist/index.html` (frontend)
- `/api/*` → `.netlify/functions/api` (backend)
- `/api/users` → Backend handles it
- `/users` → Frontend handles it (Vue Router)

## ConfigManager: Centralized Configuration

### How It Works

```javascript
// src/server.js
import { configManager } from '../../config/config.manager.js';

// Initialize from environment variables
configManager.initialize();

// Validate (throws errors if invalid)
configManager.validate();

// Use configuration
const dbConfig = configManager.getPoolConfig();
const jwtSecret = configManager.get('jwt.secret');
const corsOrigins = configManager.get('cors.origin');
```

### No More Hardcoded Values

❌ **BEFORE** (Hardcoded):
```javascript
const db = {
  host: 'localhost',
  user: 'apolaki_user',
  password: 'apolaki_pass'  // ❌ NEVER DO THIS!
};
```

✅ **AFTER** (ConfigManager):
```javascript
const db = configManager.getPoolConfig(); // Reads from environment
```

### Supported Configuration Sources

1. **Environment Variables** (`.env` file or platform variables)
2. **Platform Variables** (Netlify, Heroku, AWS, etc.)
3. **Runtime Configuration** (for testing)

```bash
# .env.local (git-ignored)
DATABASE_URL=postgresql://...
JWT_SECRET=generated-secret
JWT_REFRESH_SECRET=generated-secret

# OR Netlify Dashboard (encrypted)
# Never commit secrets to git!
```

## Database Configuration

### Local Development

Use individual parameters:

```bash
# .env.local
DB_HOST=localhost
DB_PORT=5432
DB_USER=apolaki_user
DB_PASSWORD=apolaki_pass
DB_NAME=apolaki_db
DB_SSL=false
```

**Start database:**
```bash
npm run dev:db
```

### Production (Netlify)

Use connection string:

```bash
# Set in Netlify dashboard (or via CLI):
DATABASE_URL=postgresql://user:password@neon.tech:5432/apolaki

# OR use individual parameters:
DB_HOST=neon.tech
DB_USER=user
DB_PASSWORD=password
DB_NAME=apolaki
DB_SSL=true  # Always use SSL in production
```

### Supported Databases

- **Netlify Neon** (Recommended for Netlify)
- **Heroku Postgres**
- **AWS RDS PostgreSQL**
- **DigitalOcean Managed Databases**
- **Local PostgreSQL** (development)

## Deployment Scenarios

### Scenario 1: Local Development

```bash
# Everything local
npm run dev:full

# Runs:
# - PostgreSQL + Redis in Docker (localhost:5432, :6379)
# - Vue.js dev server (localhost:5173)
# - Express backend (localhost:3001)
```

### Scenario 2: Backend on Netlify + Database on Neon

```bash
# 1. Create Neon project at https://neon.tech
# 2. Copy connection string to Netlify environment

# 3. Deploy
npm run build:netlify
netlify deploy --prod

# 4. Check logs
netlify logs
```

### Scenario 3: Backend on Heroku + Frontend on Netlify

```bash
# Backend on Heroku
heroku create apolaki-api
heroku config:set DATABASE_URL=...
heroku config:set JWT_SECRET=...
git push heroku main

# Frontend on Netlify
VITE_API_URL=https://apolaki-api.herokuapp.com/api npm run build --prefix frontend
# Deploy frontend/dist to Netlify
```

### Scenario 4: Self-Hosted Docker

```bash
# Build Docker images
npm run docker:build

# Start all services
npm run docker:up

# View logs
npm run docker:logs

# Stop
npm run docker:down
```

## Troubleshooting

### "Database configuration incomplete"

**Cause**: Missing database configuration

**Solution**:
```bash
# Set DATABASE_URL
export DATABASE_URL=postgresql://user:password@host:5432/dbname

# OR set individual parameters
export DB_HOST=localhost
export DB_USER=apolaki_user
export DB_PASSWORD=apolaki_pass
export DB_NAME=apolaki_db
```

### "JWT_SECRET must be set to a secure value"

**Cause**: Using development default in production

**Solution**:
```bash
# Generate strong secret
export JWT_SECRET=$(openssl rand -base64 32)
export JWT_REFRESH_SECRET=$(openssl rand -base64 32)
```

### CORS Error: "Not allowed by Access-Control-Allow-Origin"

**Cause**: Frontend URL not in `CORS_ORIGINS`

**Solution**:
```bash
# For Netlify:
export CORS_ORIGINS=https://apolaki.netlify.app

# For local dev:
export CORS_ORIGINS=http://localhost:5173
```

### API requests fail with 404

**Cause**: `VITE_API_URL` incorrectly configured

**Solution**:
```bash
# For Netlify (API proxied through netlify.toml):
VITE_API_URL=/api

# For local dev:
VITE_API_URL=http://localhost:3001/api
```

### Database connection timeout

**Cause**: Database not running or connection string wrong

**Solution**:
```bash
# Test connection
psql $DATABASE_URL

# Or with individual parameters:
psql -h $DB_HOST -U $DB_USER -d $DB_NAME
```

## Environment Variables Reference

See **[ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md)** for complete reference.

Key variables:

```bash
# Database (ConfigManager reads these)
DATABASE_URL or DB_HOST/DB_USER/DB_PASSWORD/DB_NAME
DB_SSL=true (production)

# Secrets (generated, never hardcoded)
JWT_SECRET
JWT_REFRESH_SECRET
SESSION_SECRET

# URLs
FRONTEND_URL (for CORS)
CORS_ORIGINS (comma-separated)

# Frontend build-time (Vite)
VITE_API_URL
VITE_WS_URL

# Environment
NODE_ENV=production
```

## CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Netlify

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm run build:netlify
      - uses: netlify/actions/cli@master
        with:
          args: deploy --prod
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          JWT_SECRET: ${{ secrets.JWT_SECRET }}
          JWT_REFRESH_SECRET: ${{ secrets.JWT_REFRESH_SECRET }}
```

## Performance & Scaling

### Frontend Optimization

- ✅ Built as static site (CDN-friendly)
- ✅ Lazy-loaded components
- ✅ Code splitting enabled
- ✅ Minified & compressed

**Netlify handles**: Caching, compression, CDN distribution

### Backend Optimization

- ✅ Serverless (auto-scaling on Netlify)
- ✅ Connection pooling (configurable via `DB_POOL_MAX`)
- ✅ Stateless design (scales horizontally)
- ✅ Environment-based configuration

**For high traffic**:
```bash
# Increase connection pool
DB_POOL_MAX=20
DB_POOL_MIN=5
```

## Security Checklist

- [ ] Never commit `.env` files to git
- [ ] Generate strong secrets: `openssl rand -base64 32`
- [ ] Use `DATABASE_URL` (not individual params) in production
- [ ] Enable `DB_SSL=true` in production
- [ ] Set `SESSION_SECURE=true` for HTTPS
- [ ] Restrict `CORS_ORIGINS` (never use `*` in production)
- [ ] Use Netlify's environment variable encryption
- [ ] Rotate secrets regularly
- [ ] Monitor logs for errors

## Related Documentation

- [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md) - Complete variable reference
- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) - System architecture
- [docs/API_REFERENCE.md](./docs/API_REFERENCE.md) - API endpoints
- [AGENTS.md](./AGENTS.md) - AI agent guidelines (for development)

## Summary

| Aspect | Local Dev | Netlify |
|--------|-----------|---------|
| Frontend | `npm run dev:frontend` | Built → CDN |
| Backend | `npm run dev:backend` | Functions (serverless) |
| Database | Docker (local) | Managed (Neon) |
| Config | `.env.local` | Netlify dashboard |
| API URL | `http://localhost:3001/api` | `/api` (proxied) |
| Deploy | `npm run dev:full` | `netlify deploy --prod` |

---

**Last Updated**: February 26, 2026  
**Version**: 2.0  
**Status**: Production Ready
