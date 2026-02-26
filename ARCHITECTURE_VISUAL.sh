#!/bin/bash
# Visual Architecture Guide for Apolaki Separate Deployables
# Display this in terminal for quick reference

cat << 'EOF'

╔════════════════════════════════════════════════════════════════════════════╗
║                   APOLAKI ARCHITECTURE OVERVIEW v2.0                       ║
║                     Separate Deployables + ConfigManager                   ║
╚════════════════════════════════════════════════════════════════════════════╝

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                        DEPLOYMENT ARCHITECTURE                             ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

                          🌐 USER'S BROWSER
                                 │
                ┌────────────────┼────────────────┐
                │                                 │
         ┌──────▼────────┐            ┌──────────▼────────┐
         │  CDN / Static │            │   API Requests    │
         │   (HTML/CSS)  │            │    /api/*         │
         └───────┬────────┘            └──────────┬────────┘
                 │                                │
         ┌───────▼──────────────────────────────▼────────┐
         │          NETLIFY (Combined Platform)         │
         ├───────────────────────────────────────────────┤
         │                                               │
         │  ┌─────────────────────┐  ┌─────────────────┐│
         │  │  Frontend (Static)  │  │ Backend (Func)  ││
         │  ├─────────────────────┤  ├─────────────────┤│
         │  │ • Vue.js 3 + Vite   │  │ • Node.js Expr. ││
         │  │ • dist/ directory   │  │ • Serverless    ││
         │  │ • CDN delivered     │  │ • Auto-scaling  ││
         │  │ • No server needed  │  │ .netlify/func/  ││
         │  │                     │  │                 ││
         │  │ Built from:         │  │ Built from:     ││
         │  │ ./frontend          │  │ ./middleware/   ││
         │  │                     │  │ netlify-db-svc  ││
         │  └─────────────────────┘  └─────────────────┘│
         │                                               │
         └──────────────────────┬──────────────────────┘
                                │
                    ┌───────────┴───────────┐
                    │                       │
         ┌──────────▼──────────┐  ┌────────▼─────────────┐
         │  Configuration      │  │ PostgreSQL Database  │
         │  (Environment Vars) │  │                      │
         │  • DATABASE_URL     │  │ • Neon (Netlify)     │
         │  • JWT_SECRET       │  │ • AWS RDS            │
         │  • FRONTEND_URL     │  │ • Heroku Postgres    │
         │  • CORS_ORIGINS     │  │ • DigitalOcean       │
         │  • NODE_ENV         │  │ • Self-hosted        │
         │  (ConfigManager     │  │                      │
         │   reads at startup) │  │ (External service)   │
         └─────────────────────┘  └──────────────────────┘


┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                       CONFIGURATION FLOW                                   ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

┌─────────────────────────────────────────────────────────────────────────┐
│                        ConfigManager Initialization                      │
└─────────────────────────────────────────────────────────────────────────┘

  1. START APPLICATION
     │
     └──> import { configManager } from '../../config/config.manager.js'
          │
          └──> configManager.initialize()
               │
               ├──> Read all process.env variables
               │
               ├──> Build configuration object:
               │    • database
               │    • redis
               │    • rabbitmq
               │    • jwt
               │    • app
               │    • cors
               │    • oauth
               │    • services
               │    • logging
               │    • session
               │
               ├──> configManager.validate()
               │    ├──> Check database config complete
               │    ├──> Check JWT secrets are set (production)
               │    └──> Throw helpful errors if invalid
               │
               └──> configManager.logConfig()
                    └──> Log safe info (no secrets exposed)

  2. USE CONFIGURATION
     │
     └──> configManager.get('database.host')
          configManager.getPoolConfig()
          configManager.getAll()
          etc.

  ⚠️  NEVER use: process.env.DATABASE_URL, process.env.JWT_SECRET
  ✅  ALWAYS use: configManager.get('database.*'), configManager.get('jwt.secret')


┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                    LOCAL DEVELOPMENT SETUP                                ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│  TERMINAL 1  │         │  TERMINAL 2  │         │  TERMINAL 3  │
│              │         │              │         │              │
│ npm run      │         │ npm run      │         │ npm run      │
│ dev:db       │         │ dev:frontend │         │ dev:backend  │
│              │         │              │         │              │
│ ↓            │         │ ↓            │         │ ↓            │
│              │         │              │         │              │
│ PostgreSQL   │◄────────►│ Vue.js Dev   │         │ Express API  │
│ + Redis      │ (http)   │ Server       │◄────────┤ on :3001     │
│ on :5432     │         │ on :5173     │(http)   │              │
│ + RabbitMQ   │         │              │         │              │
│ on :5672     │         │ Hot reload   │         │ Nodemon      │
│              │         │ works        │         │ auto-reload  │
└──────────────┘         └──────────────┘         └──────────────┘


┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                  SEPARATE DEPLOYMENT SCENARIOS                            ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

SCENARIO 1: Frontend-Only Deployment
────────────────────────────────────
Changes only in ./frontend? Deploy frontend independently!

  npm run build:frontend
  └─> frontend/dist/

  Upload frontend/dist to:
  • Netlify (CDN)
  • Vercel
  • CloudFlare Pages
  • GitHub Pages
  • AWS S3 + CloudFront

  ✓ Backend stays unchanged
  ✓ Database stays unchanged
  ✓ No need to rebuild/redeploy backend


SCENARIO 2: Backend-Only Deployment
────────────────────────────────────
Changes only in ./middleware/netlify-db-service? Deploy backend independently!

  npm run build:backend
  └─> Installs dependencies

  Deploy to:
  • Netlify Functions (rebuild only)
  • Heroku
  • AWS Lambda
  • Railway
  • DigitalOcean App Platform

  ✓ Frontend stays unchanged
  ✓ No need to rebuild/redeploy frontend
  ✓ Configuration via environment variables


SCENARIO 3: Combined Deployment (Full Stack)
─────────────────────────────────────────────
Changes in both frontend AND backend? Deploy together to Netlify.

  npm run build:netlify
  └─> Builds frontend + installs backend deps

  netlify deploy --prod
  └─> Deploys both to Netlify

  ✓ Frontend: Served as static site
  ✓ Backend: Deployed as functions
  ✓ Automatic CI/CD via GitHub


┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                    REQUEST ROUTING (PRODUCTION)                           ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

User Request: https://apolaki.netlify.app/dashboard
                                           └─────────┘
                                         Path: /dashboard

  Netlify Routing (netlify.toml rules):
  ├─ Is /dashboard a built file? NO
  ├─ Is /dashboard an API? NO (/api/*)
  └─ Default SPA rule → Serve /index.html

  Frontend loads → Vue Router handles /dashboard


User Request: https://apolaki.netlify.app/api/users
                                           └────────┘
                                         Path: /api/users

  Netlify Routing (netlify.toml rules):
  ├─ Is /api/users a built file? NO
  ├─ Matches redirect rule: /api/* → /.netlify/functions/api
  └─> Route to backend function

  Backend processes request → Returns JSON


User Request: https://apolaki.netlify.app/style.css
                                           └─────────┘
                                         Path: /style.css

  Netlify Routing:
  ├─ Is /style.css a built file? YES
  └─> Serve from frontend/dist/style.css (CDN cached)


┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                        ENVIRONMENT VARIABLES                              ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

Development (.env.local):
  ├─ DB_HOST=localhost                    (ConfigManager reads)
  ├─ DB_USER=apolaki_user                 (ConfigManager reads)
  ├─ DB_PASSWORD=apolaki_pass             (ConfigManager reads)
  ├─ DB_NAME=apolaki_db                   (ConfigManager reads)
  ├─ JWT_SECRET=dev-secret-...            (ConfigManager reads)
  ├─ FRONTEND_URL=http://localhost:5173   (ConfigManager reads)
  └─ ...

Production (Netlify Dashboard):
  ├─ DATABASE_URL=postgresql://...        (ConfigManager reads)
  ├─ JWT_SECRET=[generated]               (ConfigManager reads)
  ├─ JWT_REFRESH_SECRET=[generated]       (ConfigManager reads)
  ├─ SESSION_SECRET=[generated]           (ConfigManager reads)
  ├─ FRONTEND_URL=https://apolaki.netlify.app
  ├─ CORS_ORIGINS=https://apolaki.netlify.app
  ├─ NODE_ENV=production
  └─ ...

ConfigManager NEVER exposes secrets in logs!


┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                        FILE STRUCTURE SUMMARY                             ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

apolaki-updated-app/
│
├── 📄 netlify.toml ..................... Netlify deployment config
├── 📄 package.json ..................... Monorepo scripts
│
├── 📖 DEPLOYABLES.md ................... Quick overview (START HERE)
├── 📖 ENVIRONMENT_VARIABLES.md ......... Configuration reference
├── 📖 DEPLOYMENT_NETLIFY.md ............ Detailed deployment guide
├── 📖 DEPLOYMENT_CHECKLIST.md .......... Pre-deployment checklist
├── 📖 QUICK_REFERENCE.sh .............. Developer quick ref
├── 📖 IMPLEMENTATION_SUMMARY.md ........ What was created
├── 📖 ARCHITECTURE_VISUAL.sh ........... This file!
│
├── config/
│   ├── ⭐ config.manager.js ........... Centralized configuration
│   ├── 📄 deployment.config.js ........ Deployment scenarios
│   └── docker-compose.yml
│
├── frontend/ ........................... 🎨 FRONTEND DEPLOYABLE
│   ├── src/
│   │   ├── App.vue
│   │   ├── main.js
│   │   ├── components/
│   │   ├── views/
│   │   ├── stores/
│   │   └── services/
│   ├── public/
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── dist/ ........................... (Generated on build)
│       ├── index.html
│       ├── assets/
│       └── ...
│
└── middleware/netlify-db-service/ ..... 🔌 BACKEND DEPLOYABLE
    ├── src/
    │   ├── server.js ................... Updated with ConfigManager
    │   ├── db.js
    │   ├── auth/
    │   ├── routes/
    │   ├── services/
    │   └── ...
    ├── package.json
    ├── schema.sql
    ├── .netlify/
    │   └── functions/
    │       └── handler.js ............. Netlify entry point
    └── Dockerfile


═════════════════════════════════════════════════════════════════════════════

KEY TAKEAWAYS:

✅ Frontend and Backend are independently deployable
✅ Configuration is centralized via ConfigManager (no hardcoded values)
✅ Can deploy frontend only, backend only, or both together
✅ Works with Netlify, Heroku, AWS, and any platform
✅ Environment variables set at runtime (not build time for backend)
✅ Database configuration is flexible (connection string or individual params)
✅ Security-first: Secrets never exposed in logs or code
✅ Validation on startup catches configuration errors early

═════════════════════════════════════════════════════════════════════════════

START HERE:
1. Read DEPLOYABLES.md (quick overview)
2. Read ENVIRONMENT_VARIABLES.md (understand configuration)
3. Run npm run dev:full (test locally)
4. Read DEPLOYMENT_NETLIFY.md (deployment steps)
5. Check DEPLOYMENT_CHECKLIST.md (before going live)

═════════════════════════════════════════════════════════════════════════════

EOF
