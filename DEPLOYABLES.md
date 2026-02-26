# Apolaki Separate Deployables Architecture

**Version**: 2.0  
**Status**: Production Ready  
**Last Updated**: February 26, 2026

## Overview

The Apolaki Solar Platform now uses **separate, independently deployable frontend and backend packages** that can be:

1. **Deployed independently** to different services
2. **Combined for Netlify** deployment as a full-stack application
3. **Configured dynamically** through environment variables (no hardcoded values)

This document provides a quick reference for the new deployment architecture.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                  Apolaki Solar Platform v2.0                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────────────┐  ┌─────────────────────────┐   │
│  │   Frontend Deployable       │  │  Backend Deployable     │   │
│  ├─────────────────────────────┤  ├─────────────────────────┤   │
│  │ Location: ./frontend        │  │ Location: ./middleware/ │   │
│  │ Type: Vue.js 3 + Vite       │  │           netlify-db-   │   │
│  │ Output: frontend/dist       │  │           service       │   │
│  │ Port: 5173 (dev)            │  │ Type: Node.js Express   │   │
│  │                             │  │ Port: 3001 (dev)        │   │
│  │ Deploy to:                  │  │ Deploy to:              │   │
│  │ • Netlify (CDN)             │  │ • Netlify Functions     │   │
│  │ • Vercel                    │  │ • Heroku                │   │
│  │ • CloudFlare Pages          │  │ • AWS Lambda            │   │
│  │ • GitHub Pages              │  │ • Railway               │   │
│  │ • Any static host           │  │ • Any Node host         │   │
│  └─────────────────────────────┘  └─────────────────────────┘   │
│                    ↓                          ↓                   │
│           ┌─────────────────────────────────────────────┐        │
│           │  Combined Netlify Deployment               │        │
│           │  (Both packages deployed together)         │        │
│           └─────────────────────────────────────────────┘        │
│                           ↓                                      │
│           ┌─────────────────────────────────────────────┐        │
│           │  PostgreSQL Database (External)            │        │
│           │  • Netlify Neon                            │        │
│           │  • AWS RDS                                 │        │
│           │  • Heroku Postgres                         │        │
│           │  • DigitalOcean                            │        │
│           └─────────────────────────────────────────────┘        │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Key Features

### ✅ Separate Deployables

**Frontend** (`./frontend`):
- Vue.js 3 with Composition API
- Vite build tool
- Static site (HTML/CSS/JS)
- CDN-friendly
- No server required

**Backend** (`./middleware/netlify-db-service`):
- Node.js 18+ Express API
- Stateless (auto-scaling friendly)
- Database abstraction layer
- OAuth + JWT authentication
- WebSocket support

### ✅ Centralized Configuration

All configuration comes from **environment variables** through the `ConfigManager` class:

```javascript
import { configManager } from '../../config/config.manager.js';

// Initialize from process.env
configManager.initialize();

// Validate configuration
configManager.validate();

// Get configuration (never hardcoded!)
const dbConfig = configManager.getPoolConfig();
const jwtSecret = configManager.get('jwt.secret');
```

**Benefits**:
- No hardcoded secrets or URLs
- Different config per environment (dev/staging/prod)
- Runtime validation with helpful error messages
- Supports any deployment platform (Netlify, Heroku, AWS, etc.)

### ✅ Netlify Combined Deployment

`netlify.toml` combines both packages:

```toml
[build]
publish = "frontend/dist"              # Frontend output
functions = ".../netlify/functions"   # Backend functions

[[redirects]]
from = "/api/*"
to = "/.netlify/functions/api"        # Route API to functions

[[redirects]]
from = "/*"
to = "/index.html"                    # SPA fallback
```

## File Structure

```
apolaki-updated-app/
├── netlify.toml                    ⭐ Netlify configuration
├── package.json                    ⭐ Monorepo scripts
├── ENVIRONMENT_VARIABLES.md        📖 Variable reference
├── DEPLOYMENT_NETLIFY.md           📖 Deployment guide
├── DEPLOYMENT_CHECKLIST.md         📋 Pre-deployment checklist
├── config/
│   ├── config.manager.js           ⭐ Centralized config
│   └── deployment.config.js        📖 Deployment scenarios
├── frontend/                       🎨 Frontend deployable
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── vite.config.js
│   └── dist/                       (generated on build)
└── middleware/netlify-db-service/  🔌 Backend deployable
    ├── src/
    ├── package.json
    ├── .netlify/
    │   └── functions/
    │       └── handler.js          ⭐ Netlify entry point
    └── schema.sql
```

## Quick Start

### Development

```bash
# 1. Install all dependencies
npm run setup

# 2. Start everything (frontend + backend + database)
npm run dev:full

# Or run individually:
npm run dev:frontend    # Vue.js on :5173
npm run dev:backend     # Express on :3001
npm run dev:db          # PostgreSQL in Docker
```

### Local Building

```bash
# Build all components
npm run build

# Or individually:
npm run build:frontend
npm run build:backend
```

### Netlify Deployment

```bash
# 1. Link to Netlify
netlify link

# 2. Set environment variables (Netlify Dashboard)
DATABASE_URL=postgresql://...
JWT_SECRET=generated-secret

# 3. Deploy
netlify deploy --prod

# Or automatic: Push to GitHub, Netlify deploys automatically
```

## Environment Variables

### Database (ConfigManager reads at startup)

```bash
# Option A: Connection string (production recommended)
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Option B: Individual parameters (development)
DB_HOST=localhost
DB_USER=apolaki_user
DB_PASSWORD=apolaki_pass
DB_NAME=apolaki_db
```

### Secrets (Generated, never hardcoded)

```bash
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)
SESSION_SECRET=$(openssl rand -base64 32)
```

### URLs

```bash
# Frontend: Build-time (Vite)
VITE_API_URL=http://localhost:3001/api (dev) or /api (netlify)
VITE_WS_URL=ws://localhost:3001/ws (dev) or /ws (netlify)

# Backend: Runtime
FRONTEND_URL=http://localhost:5173 (dev) or https://apolaki.netlify.app (prod)
CORS_ORIGINS=http://localhost:5173 (dev) or https://apolaki.netlify.app (prod)
```

See **[ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md)** for complete reference.

## Deployment Options

### Option 1: Everything on Netlify (Recommended for MVP)

✅ **Pros**:
- Single platform (simple CI/CD)
- Free tier available
- No server management
- Built-in CDN and SSL
- Auto-scaling

❌ **Cons**:
- Function timeout limit (10 seconds)
- Limited background jobs
- Vendor lock-in

**Deploy**:
```bash
netlify link
# Set DATABASE_URL and secrets in Netlify dashboard
netlify deploy --prod
```

### Option 2: Frontend on Netlify, Backend on Heroku

✅ **Pros**:
- Flexible backend (Heroku for persistent services)
- Better for long-running tasks
- Good for scaling

❌ **Cons**:
- Two platforms to manage
- More complex CI/CD

**Deploy**:
```bash
# Backend on Heroku
heroku create apolaki-api
heroku config:set DATABASE_URL=...
git push heroku main

# Frontend on Netlify with API URL
VITE_API_URL=https://apolaki-api.herokuapp.com/api \
  npm run build:frontend
# Deploy frontend/dist to Netlify
```

### Option 3: Self-Hosted Docker

✅ **Pros**:
- Full control
- Run anywhere
- Any configuration

❌ **Cons**:
- Infrastructure management
- More complex deployment
- Need DevOps expertise

**Deploy**:
```bash
npm run docker:build
npm run docker:up
```

### Option 4: Frontend CDN + Backend Kubernetes

✅ **Pros**:
- Scalable backend
- Global CDN frontend
- Production-grade

❌ **Cons**:
- Complex infrastructure
- High learning curve
- Operational overhead

**Deploy**:
```bash
# Frontend → Netlify/Vercel/CloudFlare
npm run build:frontend

# Backend → Kubernetes
helm install apolaki helm/
```

## Separate Deployment Workflows

### Deploy Frontend Only

```bash
# Changes to frontend only, no backend changes
npm run build:frontend

# Upload frontend/dist to CDN or Netlify
# (API endpoint remains unchanged)
```

### Deploy Backend Only

```bash
# Changes to backend only, no frontend changes
npm run build:backend

# Deploy to Netlify Functions, Heroku, or other platform
# (Frontend code remains unchanged)
```

### Deploy Both

```bash
# Changes to both frontend and backend
npm run build:all

# Deploy to Netlify (combines both)
netlify deploy --prod
```

## Configuration Management

### ConfigManager Class

Located in `config/config.manager.js`:

```javascript
// Initialize from environment variables
configManager.initialize();

// Validate (throws helpful errors)
configManager.validate();

// Get individual values
configManager.get('database.host');
configManager.get('jwt.secret');

// Get sections
configManager.getSection('database');

// Get all configuration
configManager.getAll();

// Check environment
configManager.isDevelopment();
configManager.isProduction();

// Log safe configuration (no secrets)
configManager.logConfig();
```

### Never Hardcode

❌ **Wrong**:
```javascript
const db = {
  host: 'localhost',
  password: 'apolaki_pass'  // ❌ Secret in code!
};
```

✅ **Right**:
```javascript
const db = configManager.getPoolConfig(); // Reads from environment
```

## Documentation

| Document | Purpose |
|----------|---------|
| [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md) | Complete variable reference |
| [DEPLOYMENT_NETLIFY.md](./DEPLOYMENT_NETLIFY.md) | Netlify deployment guide |
| [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) | Pre-deployment checklist |
| [config/deployment.config.js](./config/deployment.config.js) | Deployment scenarios |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | System architecture |
| [docs/API_REFERENCE.md](./docs/API_REFERENCE.md) | API endpoints |

## Package Scripts

```bash
# Development
npm run dev              # Run all (frontend + backend)
npm run dev:frontend    # Frontend only
npm run dev:backend     # Backend only
npm run dev:db          # Database (Docker)
npm run dev:full        # Everything

# Building
npm run build            # Build all
npm run build:frontend  # Frontend only
npm run build:backend   # Backend only
npm run build:netlify   # For Netlify deployment

# Testing
npm run test            # Test all
npm run test:frontend   # Frontend tests
npm run test:backend    # Backend tests

# Linting
npm run lint            # Lint all
npm run lint:frontend   # Frontend linting

# Docker
npm run docker:build    # Build images
npm run docker:up       # Start services
npm run docker:down     # Stop services

# Database
npm run db:init         # Initialize database
npm run db:seed         # Seed test data

# Deployment
npm run deploy:netlify  # Deploy to Netlify
```

## Troubleshooting

### "Database configuration incomplete"

```bash
# Set DATABASE_URL
export DATABASE_URL=postgresql://user:password@host:5432/dbname

# OR individual parameters
export DB_HOST=localhost
export DB_USER=apolaki_user
export DB_PASSWORD=apolaki_pass
export DB_NAME=apolaki_db
```

### CORS errors

```bash
# Check CORS_ORIGINS includes your frontend URL
export CORS_ORIGINS=http://localhost:5173

# For Netlify:
export CORS_ORIGINS=https://apolaki.netlify.app
```

### API returns 502

Check Netlify function logs:
```bash
netlify logs
```

### Build fails

```bash
# Test build locally
npm run build:netlify

# Check logs
netlify logs --function=api
```

See **[DEPLOYMENT_NETLIFY.md](./DEPLOYMENT_NETLIFY.md)** for more troubleshooting.

## Next Steps

1. **Review** [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md) for all configuration options
2. **Read** [DEPLOYMENT_NETLIFY.md](./DEPLOYMENT_NETLIFY.md) for detailed deployment steps
3. **Check** [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) before going live
4. **Test** locally: `npm run dev:full`
5. **Build** for Netlify: `npm run build:netlify`
6. **Deploy**: `netlify deploy --prod`

## Support

For questions or issues:
- Check [DEPLOYMENT_NETLIFY.md](./DEPLOYMENT_NETLIFY.md) troubleshooting section
- Review [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md) configuration reference
- See [docs/](./docs/) for architecture and API reference

---

**Version**: 2.0  
**Last Updated**: February 26, 2026  
**Status**: Production Ready  
**Maintainer**: Apolaki Development Team
