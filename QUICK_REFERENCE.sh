#!/bin/bash
# Apolaki Deployment & Configuration Quick Reference Card
# Print this out and keep it at your desk during development and deployment!

echo "
╔════════════════════════════════════════════════════════════════════════════╗
║                  APOLAKI DEPLOYMENT QUICK REFERENCE v2.0                   ║
╚════════════════════════════════════════════════════════════════════════════╝

📚 DOCUMENTATION
  • DEPLOYABLES.md ......................... Overview & architecture
  • ENVIRONMENT_VARIABLES.md ............... All config variables
  • DEPLOYMENT_NETLIFY.md ................. Netlify deployment guide
  • DEPLOYMENT_CHECKLIST.md ............... Pre-deployment tasks
  • config/config.manager.js .............. Configuration management
  • config/deployment.config.js ........... Deployment scenarios

═══════════════════════════════════════════════════════════════════════════════

🚀 QUICK START

Local Development:
  npm run setup              # Install all dependencies
  npm run dev:full           # Run everything (frontend + backend + DB)

Building:
  npm run build              # Build all components
  npm run build:frontend     # Build frontend only
  npm run build:backend      # Install backend deps

Testing:
  npm run test               # Run all tests
  npm run lint               # Run linting

Netlify Deployment:
  netlify link               # Connect to Netlify site
  netlify deploy --prod      # Deploy to production

═══════════════════════════════════════════════════════════════════════════════

⚙️  CONFIGURATION (ConfigManager)

Location: config/config.manager.js

Never Hardcode:
  ❌ const secret = 'my-secret'
  ✅ const secret = configManager.get('jwt.secret')

Read from Environment:
  • DATABASE_URL or DB_HOST/USER/PASSWORD/NAME
  • JWT_SECRET (generate: openssl rand -base64 32)
  • JWT_REFRESH_SECRET
  • SESSION_SECRET
  • FRONTEND_URL
  • CORS_ORIGINS
  • NODE_ENV (development/production)

Check Docs: ENVIRONMENT_VARIABLES.md

═══════════════════════════════════════════════════════════════════════════════

📦 SEPARATE DEPLOYABLES

Frontend (./frontend):
  • Vue.js 3 + Vite
  • Output: frontend/dist
  • Deploy to: Netlify, Vercel, CloudFlare, GitHub Pages, S3
  • Build: npm run build:frontend
  • Dev: npm run dev:frontend (port 5173)

Backend (./middleware/netlify-db-service):
  • Node.js Express API
  • Deploy to: Netlify Functions, Heroku, AWS Lambda, Railway
  • Build: npm run build:backend
  • Dev: npm run dev:backend (port 3001)

Database (External):
  • PostgreSQL
  • Configure via DATABASE_URL or DB_* environment variables
  • Local dev: PostgreSQL in Docker
  • Production: Netlify Neon, AWS RDS, Heroku Postgres, etc.

═══════════════════════════════════════════════════════════════════════════════

🌐 NETLIFY DEPLOYMENT STEPS

1. Link to Netlify:
     netlify link

2. Set Environment Variables (Netlify Dashboard):
     DATABASE_URL = postgresql://user:password@host:5432/dbname
     JWT_SECRET = (generate: openssl rand -base64 32)
     JWT_REFRESH_SECRET = (generate: openssl rand -base64 32)
     SESSION_SECRET = (generate: openssl rand -base64 32)
     NODE_ENV = production
     FRONTEND_URL = https://apolaki.netlify.app
     CORS_ORIGINS = https://apolaki.netlify.app

3. Deploy:
     npm run build:netlify
     netlify deploy --prod

4. Verify:
     • Frontend loads at root URL
     • API works at /api/health
     • Check logs: netlify logs

═══════════════════════════════════════════════════════════════════════════════

🔧 ENVIRONMENT SETUP

Development (.env.local):
  DB_HOST=localhost
  DB_PORT=5432
  DB_USER=apolaki_user
  DB_PASSWORD=apolaki_pass
  DB_NAME=apolaki_db
  DB_SSL=false
  JWT_SECRET=dev-secret-change-in-production
  JWT_REFRESH_SECRET=dev-secret-change-in-production
  SESSION_SECRET=dev-secret-change-in-production
  FRONTEND_URL=http://localhost:5173
  CORS_ORIGINS=http://localhost:5173
  NODE_ENV=development

Production (Netlify Dashboard):
  DATABASE_URL=postgresql://...
  JWT_SECRET=(openssl rand -base64 32)
  JWT_REFRESH_SECRET=(openssl rand -base64 32)
  SESSION_SECRET=(openssl rand -base64 32)
  FRONTEND_URL=https://apolaki.netlify.app
  CORS_ORIGINS=https://apolaki.netlify.app
  NODE_ENV=production
  DB_SSL=true

═══════════════════════════════════════════════════════════════════════════════

🐛 COMMON ISSUES & SOLUTIONS

Database Connection Failed:
  Problem: Can't connect to database
  Check:   psql \$DATABASE_URL
  Fix:     Verify DATABASE_URL is correct
           Check if database is running
           Check firewall allows connection

CORS Error:
  Problem: 'Not allowed by Access-Control-Allow-Origin'
  Fix:     Add frontend URL to CORS_ORIGINS
           export CORS_ORIGINS=https://your-site.netlify.app
           Redeploy

API Returns 502:
  Problem: Backend function error
  Check:   netlify logs
  Fix:     Look for configuration/database errors
           Verify environment variables are set

Frontend Can't Find API:
  Problem: fetch('/api/...') fails
  Check:   echo \$VITE_API_URL
  Fix:     For Netlify: VITE_API_URL=/api
           For local: VITE_API_URL=http://localhost:3001/api
           Rebuild frontend

Build Fails:
  Problem: npm run build:netlify fails
  Check:   npm run build:netlify (run locally to debug)
  Fix:     Check error messages
           Verify all dependencies are installed
           Check environment variables in Netlify

═══════════════════════════════════════════════════════════════════════════════

📋 PRE-DEPLOYMENT CHECKLIST

Code Quality:
  □ npm run test      (tests pass)
  □ npm run lint      (no linting errors)
  □ npm run build     (builds successfully locally)

Configuration:
  □ No hardcoded secrets in code
  □ No localhost URLs in production code
  □ .env files are in .gitignore
  □ All variables documented in ENVIRONMENT_VARIABLES.md

Database:
  □ Database is accessible
  □ Connection string is valid
  □ All migrations have run
  □ Database backups are configured

Security:
  □ JWT secrets are generated (not default values)
  □ Session secret is generated
  □ CORS origins are specific (not '*')
  □ SSL is enabled (DB_SSL=true in production)
  □ HTTPS is enforced

Netlify:
  □ All environment variables are set
  □ Build command is correct
  □ Publish directory is 'frontend/dist'
  □ Node.js version is 18.x

═══════════════════════════════════════════════════════════════════════════════

🎯 DEPLOYMENT WORKFLOW

Standard Deployment:
  1. Make code changes
  2. Test locally: npm run dev:full
  3. Commit and push: git push origin main
  4. Netlify builds automatically (via netlify.toml)
  5. Verify deployment at https://apolaki.netlify.app

Manual Deployment:
  1. npm run build:netlify
  2. netlify deploy --prod

Rollback:
  1. git revert <commit-hash>
  2. git push origin main
  3. Netlify redeploys automatically

Separate Deployments:
  Frontend only: npm run build:frontend
  Backend only:  npm run build:backend

═══════════════════════════════════════════════════════════════════════════════

💾 DATABASE QUICK REFERENCE

Local Development:
  Start:    npm run dev:db
  Connect:  psql -h localhost -U apolaki_user -d apolaki_db
  Seed:     npm run db:seed
  Init:     npm run db:init

Production (Netlify):
  Type:     PostgreSQL (managed)
  Options:  • Netlify Neon
           • AWS RDS
           • Heroku Postgres
           • DigitalOcean
  Config:   DATABASE_URL environment variable
  SSL:      Always use (DB_SSL=true)

═══════════════════════════════════════════════════════════════════════════════

🔐 GENERATE SECRETS (Required for Production)

JWT Secret:
  openssl rand -base64 32

Refresh Secret:
  openssl rand -base64 32

Session Secret:
  openssl rand -base64 32

Never commit these to git! Set in Netlify dashboard.

═══════════════════════════════════════════════════════════════════════════════

📞 SUPPORT

Documentation:
  • DEPLOYABLES.md .......................... Quick overview
  • ENVIRONMENT_VARIABLES.md ................ All variables
  • DEPLOYMENT_NETLIFY.md ................... Detailed guide
  • DEPLOYMENT_CHECKLIST.md ................. Pre-deployment
  • config/config.manager.js ................ Configuration
  • docs/API_REFERENCE.md ................... API endpoints
  • docs/ARCHITECTURE.md .................... System design

Commands:
  npm run help (see all available scripts)

═══════════════════════════════════════════════════════════════════════════════

Version: 2.0 | Updated: February 26, 2026 | Status: Production Ready
"
