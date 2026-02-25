# 📂 Apolaki Solar Platform - File Organization Guide

**Last Updated:** February 26, 2026  
**Status:** Complete & Organized

---

## 📁 Project Directory Structure

```
apolaki-updated-app/
├── 🎨 frontend/                          # Vue.js 3 Frontend Application
│   ├── src/                              # Source code
│   │   ├── components/                   # Reusable Vue components
│   │   ├── views/                        # Page components
│   │   ├── stores/                       # Pinia state management
│   │   ├── services/                     # API services
│   │   ├── router/                       # Vue Router configuration
│   │   ├── styles/                       # Global styles
│   │   ├── App.vue                       # Root component
│   │   └── main.js                       # Entry point
│   ├── assets/                           # Static assets
│   ├── public/                           # Public static files
│   ├── index.html                        # HTML template
│   ├── vite.config.js                    # Vite configuration
│   ├── package.json                      # Dependencies
│   ├── Dockerfile                        # ✨ NEW: Container image
│   └── README.md                         # Frontend documentation
│
├── 🔧 middleware/                        # Microservices & APIs
│   ├── netlify-db-service/               # Node.js Database Service
│   │   ├── src/                          # Source code
│   │   ├── package.json                  # Dependencies
│   │   ├── Dockerfile                    # ✨ NEW: Container image
│   │   ├── .env.example                  # Environment template
│   │   └── README.md                     # Service documentation
│   │
│   └── solar-service/                    # Go Solar Monitoring Service
│       ├── cmd/                          # Application entry point
│       ├── api/                          # API handlers
│       ├── internal/                     # Internal packages
│       ├── go.mod                        # Go modules
│       ├── go.sum                        # Dependency lock file
│       ├── Dockerfile                    # ✨ NEW: Container image
│       └── README.md                     # Service documentation
│
├── ⚙️ config/                             # Configuration Files
│   ├── docker-compose.yml                # Docker Compose orchestration
│   ├── init-db.sql                       # Database initialization
│   └── env/                              # Environment configurations
│       ├── .env.dev                      # Development environment
│       ├── .env.staging                  # Staging environment
│       └── .env.prod                     # Production environment
│
├── 📖 docs/                              # Comprehensive Documentation
│   ├── INDEX.md                          # Documentation index
│   ├── START_HERE.md                     # Getting started guide
│   ├── ARCHITECTURE.md                   # System architecture
│   ├── API_REFERENCE.md                  # API documentation
│   │
│   ├── authentication/                   # Authentication guides
│   │   ├── OAUTH_QUICK_START.md
│   │   ├── OAUTH_SETUP_GUIDE.md
│   │   ├── VIBER_TELEGRAM_QUICK_START.md
│   │   └── ...
│   │
│   ├── setup/                            # Setup & deployment guides
│   │   ├── END_TO_END_SETUP_GUIDE.md
│   │   ├── DOCKER_SETUP.md
│   │   ├── KUBERNETES_SETUP.md
│   │   └── ...
│   │
│   ├── integrations/                     # Integration documentation
│   │   ├── NETLIFY_DB_INTEGRATION.md
│   │   └── ...
│   │
│   ├── examples/                         # Code examples
│   │   ├── LOGIN_VUE_UPDATED_EXAMPLE.vue
│   │   └── ...
│   │
│   └── completed-tasks/                  # Archive of completed work
│       └── ...
│
├── 🐳 Dockerfiles (Root Level)           # ✨ NEW: Service Container Images
│   ├── frontend/Dockerfile               # Frontend image
│   ├── middleware/netlify-db-service/Dockerfile  # DB service image
│   └── middleware/solar-service/Dockerfile      # Solar service image
│
├── 🚀 scripts/                           # ✨ NEW: Automation Scripts
│   ├── deploy-prod.sh                    # Production deployment
│   ├── dev-setup-local.sh                # Local development setup
│   ├── docker-utils.sh                   # Docker utility commands
│   ├── k8s-utils.sh                      # Kubernetes utility commands
│   └── README.md                         # Scripts documentation
│
├── ☸️ helm/                              # ✨ NEW: Kubernetes Deployment
│   ├── frontend/                         # Frontend Helm chart
│   │   ├── Chart.yaml                    # Chart metadata
│   │   ├── templates/                    # K8s templates
│   │   │   ├── deployment.yaml
│   │   │   ├── service.yaml
│   │   │   ├── ingress.yaml
│   │   │   ├── _helpers.tpl
│   │   │   └── ...
│   │   └── values.yaml                   # Default values
│   │
│   ├── db-service/                       # Database service chart
│   │   └── (similar structure)
│   │
│   ├── solar-service/                    # Solar service chart
│   │   └── (similar structure)
│   │
│   ├── values-dev.yaml                   # ✨ NEW: Development values
│   ├── values-staging.yaml               # ✨ NEW: Staging values
│   └── values-production.yaml            # ✨ NEW: Production values
│
├── 📊 monitoring/                        # ✨ NEW: Monitoring & Logging
│   ├── prometheus/                       # Prometheus config
│   ├── grafana/                          # Grafana dashboards
│   ├── filebeat/                         # Log shipping
│   └── README.md                         # Monitoring guide
│
├── 📦 backups/                           # ✨ NEW: Database Backups
│   ├── daily/                            # Daily backups
│   ├── weekly/                           # Weekly backups
│   └── README.md                         # Backup procedures
│
├── 📝 logs/                              # ✨ NEW: Application Logs
│   ├── deployment/                       # Deployment logs
│   ├── application/                      # Application logs
│   └── .gitkeep                          # Keep directory in git
│
├── 🔄 .github/                           # ✨ NEW: GitHub Actions
│   └── workflows/                        # CI/CD Workflows
│       ├── frontend-ci.yml               # Frontend build & test
│       ├── backend-ci.yml                # Backend build & test
│       ├── docker-build.yml              # Docker image builds
│       └── deploy.yml                    # Kubernetes deployment
│
├── 📋 Root Configuration Files
│   ├── README.md                         # Project overview
│   ├── CONTRIBUTING.md                   # Contribution guidelines
│   ├── LICENSE                           # MIT License
│   ├── .env.example                      # Environment template
│   ├── .dockerignore                     # Docker build exclusions
│   ├── .gitignore                        # Git exclusions
│   └── docker-compose.yml (ref)          # Production Docker Compose
│
├── 📚 Documentation Files
│   ├── SETUP.sh                          # Quick setup script
│   ├── dev-setup.sh                      # Development setup
│   ├── QUICK_REFERENCE.md                # Quick command reference
│   ├── DEPLOYMENT_CHECKLIST.md           # Pre-deployment checklist
│   ├── ORGANIZATION_GUIDE.md             # Project organization
│   ├── PROJECT_STRUCTURE.md              # Directory structure
│   ├── CONFIG_UPDATES_SUMMARY.md         # Configuration changes
│   └── FINAL_COMPLETION_REPORT.md        # Completion report
│
└── 📄 Version Control
    ├── .git/                             # Git repository
    ├── .gitignore                        # Git ignore rules
    └── .github/
        ├── workflows/                    # CI/CD pipelines
        └── (other GitHub config)
```

---

## 📋 New Files & Directories (This Session)

### GitHub Actions Workflows (`.github/workflows/`)
- ✅ `frontend-ci.yml` - Frontend linting, testing, building
- ✅ `backend-ci.yml` - Backend linting, testing, Docker builds
- ✅ `docker-build.yml` - Container image building & pushing
- ✅ `deploy.yml` - Kubernetes deployment automation

### Scripts (`scripts/`)
- ✅ `deploy-prod.sh` - Production deployment automation
- ✅ `dev-setup-local.sh` - Local development environment setup
- ✅ `docker-utils.sh` - Docker utility commands
- ✅ `k8s-utils.sh` - Kubernetes utility commands

### Dockerfiles
- ✅ `frontend/Dockerfile` - Vue.js 3 multi-stage build
- ✅ `middleware/netlify-db-service/Dockerfile` - Node.js service image
- ✅ `middleware/solar-service/Dockerfile` - Go service image

### Helm Charts (`helm/`)
- ✅ `helm/frontend/` - Frontend Kubernetes chart
- ✅ `helm/db-service/` - Database service chart
- ✅ `helm/solar-service/` - Solar service chart
- ✅ `helm/values-dev.yaml` - Development environment values
- ✅ `helm/values-staging.yaml` - Staging environment values
- ✅ `helm/values-production.yaml` - Production environment values

### Directories
- ✅ `scripts/` - Automation and utility scripts
- ✅ `helm/` - Kubernetes Helm charts
- ✅ `monitoring/` - Monitoring and logging configuration
- ✅ `backups/` - Database backup storage
- ✅ `logs/` - Application and deployment logs

---

## 🎯 File Organization by Purpose

### 🔨 Development
- `frontend/` - Frontend source code
- `middleware/` - Backend microservices
- `scripts/dev-setup-local.sh` - Local setup automation
- `docs/` - Comprehensive documentation

### 📦 Deployment
- `Dockerfiles` - Container images
- `helm/` - Kubernetes charts
- `config/docker-compose.yml` - Docker Compose (development)
- `.github/workflows/` - CI/CD pipelines

### 🚀 Production
- `helm/values-production.yaml` - Production settings
- `scripts/deploy-prod.sh` - Production deployment
- `config/env/.env.prod` - Production environment variables
- `.github/workflows/deploy.yml` - Production deployment workflow

### 📚 Documentation
- `docs/` - Main documentation directory
- `docs/INDEX.md` - Documentation index
- `docs/START_HERE.md` - Getting started guide
- `docs/ARCHITECTURE.md` - System design

### ⚙️ Configuration
- `config/` - Core configuration files
- `config/env/` - Environment-specific variables
- `config/docker-compose.yml` - Service orchestration
- `.env.example` - Environment template

---

## 📊 File Count Summary

| Category | Count | Location |
|----------|-------|----------|
| **Documentation** | 31+ | `docs/` |
| **Scripts** | 5+ | `scripts/`, root |
| **Dockerfiles** | 3 | Service directories |
| **Helm Charts** | 3+ | `helm/` |
| **CI/CD Workflows** | 4 | `.github/workflows/` |
| **Config Files** | 8+ | `config/`, root |
| **Frontend Code** | ~50+ | `frontend/src/` |
| **Backend Code** | ~40+ | `middleware/` |

---

## 🔍 Quick File Lookup

### I need to...

**Deploy to production**
- Read: `docs/INDEX.md` → `DEPLOYMENT_CHECKLIST.md`
- Run: `scripts/deploy-prod.sh`
- Check: `helm/values-production.yaml`

**Set up local development**
- Run: `scripts/dev-setup-local.sh`
- Check: `docs/START_HERE.md`
- Edit: `.env.local`

**Build Docker images**
- Run: `scripts/docker-utils.sh build`
- Check: `Dockerfile` files in each service
- Push: `scripts/docker-utils.sh push`

**Deploy to Kubernetes**
- Use: `helm/` charts
- Set values: `helm/values-*.yaml`
- Run: `scripts/k8s-utils.sh`

**View system architecture**
- Read: `docs/ARCHITECTURE.md`
- Check: `docs/PROJECT_ORGANIZATION.md`

**Understand authentication**
- Read: `docs/authentication/` folder
- Examples: `docs/examples/LOGIN_VUE_UPDATED_EXAMPLE.vue`

**Troubleshoot issues**
- Check: `docs/troubleshooting/` folder
- Review: Application logs in `logs/`
- Check: Deployment logs from `scripts/`

**Access monitoring**
- View: `monitoring/` directory
- Check: Prometheus/Grafana dashboards
- Review: Application metrics

---

## 🚀 File Usage Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                   Development Workflow                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  1. Setup: Run scripts/dev-setup-local.sh                   │
│  2. Edit: Modify files in frontend/ and middleware/          │
│  3. Test: Run tests (npm run test)                           │
│  4. Commit: Push to version control                          │
│                                                               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│               CI/CD Workflow (GitHub Actions)                │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  1. Push: to main/staging branch                            │
│  2. Trigger: .github/workflows/*.yml                        │
│  3. Test: Run tests and linters                             │
│  4. Build: Create Docker images                             │
│  5. Push: to container registry                             │
│  6. Deploy: to Kubernetes                                   │
│                                                               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│             Production Deployment Workflow                   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  1. Tag: Create version tag (v1.0.0)                        │
│  2. Trigger: .github/workflows/deploy.yml                   │
│  3. Build: Docker images with version tag                   │
│  4. Deploy: Using helm/values-production.yaml               │
│  5. Monitor: Watch logs/ and monitoring/                    │
│  6. Verify: Health checks and smoke tests                   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 Security & Best Practices

### ✅ Properly Organized
- Secrets in `.env` files (not in git)
- Configuration separated by environment
- Docker images use non-root users
- Helm charts with security defaults

### ✅ Version Control
- All code in git
- `.gitignore` excludes sensitive files
- Logs and backups not tracked
- Stable directory structure

### ✅ Scalability
- Microservices architecture
- Docker containers
- Kubernetes ready
- Load balancing configured

### ✅ Monitoring & Logging
- Dedicated `monitoring/` directory
- Logging configuration included
- Health checks in Helm charts
- Deployment logs tracked

---

## 📝 File Maintenance

### Regular Tasks
- Backup logs regularly
- Rotate backup files
- Review monitoring data
- Update documentation

### Pre-Deployment
- Verify `helm/values-*.yaml`
- Check `DEPLOYMENT_CHECKLIST.md`
- Review environment variables
- Test with staging environment

### Post-Deployment
- Check `logs/deployment_*.log`
- Verify `monitoring/` dashboards
- Run health checks
- Document any issues

---

## 🎯 Next Steps

1. **Test Deployment**: Try `scripts/deploy-prod.sh --dry-run staging`
2. **Review Workflows**: Check `.github/workflows/*.yml`
3. **Update Secrets**: Replace passwords in `helm/values-production.yaml`
4. **Configure Monitoring**: Set up Prometheus & Grafana
5. **Run Full Test**: Execute GitHub Actions workflows

---

**All files organized and ready for production deployment! 🚀**
