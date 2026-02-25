# 🚀 Apolaki Solar Platform - Complete Build & Deployment Guide

## Table of Contents

1. [Quick Start](#quick-start)
2. [Prerequisites](#prerequisites)
3. [Local Development](#local-development)
4. [Building Services](#building-services)
5. [Docker Deployment](#docker-deployment)
6. [Kubernetes Deployment](#kubernetes-deployment)
7. [Troubleshooting](#troubleshooting)

---

## Quick Start

### 5-Minute Setup (Development)

```bash
cd /Users/macstudio/Documents/Code/apolaki-udpated-app

# 1. Build all services
bash scripts/build.sh all

# 2. Start frontend
cd frontend && npm start

# 3. Start database service
cd ../middleware/netlify-db-service && npm start

# 4. Visit http://localhost:3000
```

---

## Prerequisites

### Required Tools

| Tool | Version | Purpose | Download |
|------|---------|---------|----------|
| Node.js | 18.0.0+ | JavaScript runtime | [nodejs.org](https://nodejs.org/) |
| npm | 9.0.0+ | Package manager | Included with Node.js |
| Git | 2.30.0+ | Version control | [git-scm.com](https://git-scm.com/) |

### Optional Tools (for Docker/Kubernetes)

| Tool | Version | Purpose | Download |
|------|---------|---------|----------|
| Docker | 24.0.0+ | Containerization | [docker.com](https://www.docker.com/) |
| Docker Compose | 2.0.0+ | Multi-container orchestration | [docker.com](https://www.docker.com/) |
| kubectl | 1.28.0+ | Kubernetes CLI | [kubernetes.io](https://kubernetes.io/) |
| Helm | 3.12.0+ | Kubernetes package manager | [helm.sh](https://helm.sh/) |

---

## Local Development

### Setup Steps

#### 1. Clone Repository

```bash
git clone <repository-url>
cd apolaki-updated-app
```

#### 2. Install Dependencies

**Frontend:**
```bash
cd frontend
npm install
```

**Database Service:**
```bash
cd ../middleware/netlify-db-service
npm install
```

**Solar Service (Go):**
```bash
cd ../middleware/solar-service
go mod download
```

#### 3. Configure Environment

```bash
# Copy example environment file
cp .env.example .env.local

# Edit with your configuration
nano .env.local
```

#### 4. Start Development Services

**Terminal 1 - Frontend:**
```bash
cd frontend
npm run dev
# Runs on http://localhost:5173
```

**Terminal 2 - Database Service:**
```bash
cd middleware/netlify-db-service
npm start
# Runs on http://localhost:3001
```

**Terminal 3 - Solar Service (optional):**
```bash
cd middleware/solar-service
go run ./cmd/main.go
# Runs on http://localhost:8080
```

---

## Building Services

### Using Build Script

```bash
# Build all services
bash scripts/build.sh all

# Build specific service
bash scripts/build.sh frontend
bash scripts/build.sh backend
bash scripts/build.sh solar-service

# Clean build artifacts
bash scripts/build.sh clean
```

### Manual Build

**Frontend:**
```bash
cd frontend
npm install
npm run build
# Output: frontend/dist/
```

**Database Service:**
```bash
cd middleware/netlify-db-service
npm install
npm run build --if-present
```

**Solar Service:**
```bash
cd middleware/solar-service
go build -o bin/solar-service ./cmd/main.go
```

---

## Docker Deployment

### Prerequisites

```bash
# Install Docker Desktop
# https://www.docker.com/products/docker-desktop

# Verify installation
docker --version
docker-compose --version
```

### Build Docker Images

```bash
# Navigate to project root
cd /Users/macstudio/Documents/Code/apolaki-udpated-app

# Build using docker-compose
docker-compose -f config/docker-compose.yml build

# Or build individual services
docker build -t apolaki-frontend:latest -f frontend/Dockerfile frontend/
docker build -t apolaki-db-service:latest -f middleware/netlify-db-service/Dockerfile middleware/netlify-db-service/
docker build -t apolaki-solar-service:latest -f middleware/solar-service/Dockerfile middleware/solar-service/
```

### Run Containers

```bash
# Start all services
docker-compose -f config/docker-compose.yml up -d

# View logs
docker-compose -f config/docker-compose.yml logs -f

# Stop services
docker-compose -f config/docker-compose.yml down

# Remove volumes (WARNING: deletes data)
docker-compose -f config/docker-compose.yml down -v
```

### Access Services

| Service | URL | Port |
|---------|-----|------|
| Frontend | http://localhost:3000 | 3000 |
| Database Service | http://localhost:3001 | 3001 |
| Solar Service | http://localhost:8080 | 8080 |
| PostgreSQL | localhost:5432 | 5432 |
| Redis | localhost:6379 | 6379 |
| RabbitMQ UI | http://localhost:15672 | 15672 |
| Elasticsearch | http://localhost:9200 | 9200 |

---

## Kubernetes Deployment

### Prerequisites

```bash
# Install kubectl
brew install kubectl

# Install Helm
brew install helm

# Install Docker Desktop with Kubernetes enabled
# Or use AWS EKS, Google GKE, Azure AKS

# Verify cluster connection
kubectl cluster-info
```

### Deploy with Helm

```bash
cd /Users/macstudio/Documents/Code/apolaki-udpated-app

# Add Helm repository (if needed)
helm repo add apolaki oci://your-registry
helm repo update

# Development deployment
helm upgrade --install apolaki ./helm/frontend \
  --namespace development \
  --create-namespace \
  --values helm/values-dev.yaml

# Staging deployment
helm upgrade --install apolaki ./helm/frontend \
  --namespace staging \
  --create-namespace \
  --values helm/values-staging.yaml

# Production deployment
helm upgrade --install apolaki ./helm/frontend \
  --namespace production \
  --create-namespace \
  --values helm/values-production.yaml

# Check deployment status
kubectl get deployments -n production
kubectl get pods -n production
kubectl get svc -n production
```

### Using Deployment Script

```bash
# Deploy to staging
bash scripts/deploy.sh staging v1.0.0

# Deploy to production
bash scripts/deploy.sh production v1.0.0 --confirm

# Dry run
DRY_RUN=true bash scripts/deploy.sh staging v1.0.0
```

---

## Build Output Locations

### Frontend Build
```
frontend/dist/
├── index.html
├── assets/
│   ├── js/
│   ├── css/
│   └── fonts/
└── config/
```

### Backend Binaries
```
build/
├── solar-service          # Go binary
└── db-service/            # Node.js service
```

### Docker Images
```
apolaki-frontend:latest
apolaki-db-service:latest
apolaki-solar-service:latest
```

---

## Troubleshooting

### Frontend Issues

**Port 5173 already in use:**
```bash
# Find and kill process
lsof -ti:5173 | xargs kill -9

# Or use different port
npm run dev -- --port 3000
```

**Module not found:**
```bash
# Clear node_modules and reinstall
rm -rf frontend/node_modules
npm install
```

**Build fails:**
```bash
# Check Node version
node --version  # Should be 18.0.0+

# Clear npm cache
npm cache clean --force
npm install
```

### Backend Issues

**Database connection failed:**
```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Verify connection string in .env.local
cat .env.local | grep DATABASE_URL
```

**Port conflicts:**
```bash
# List all listening ports
lsof -i -P -n

# Kill specific process
kill -9 <PID>
```

### Docker Issues

**Image build fails:**
```bash
# Check Docker daemon
docker ps

# View build logs
docker build --progress=plain .

# Rebuild without cache
docker build --no-cache .
```

**Container won't start:**
```bash
# Check logs
docker logs <container-id>

# Inspect container
docker inspect <container-id>

# Run with interactive shell
docker run -it <image-id> /bin/sh
```

---

## Monitoring & Logs

### View Application Logs

**Frontend:**
```bash
cd frontend && npm run dev
# Logs in console
```

**Database Service:**
```bash
cd middleware/netlify-db-service
npm start
# Logs in console
```

**Docker Logs:**
```bash
# All services
docker-compose -f config/docker-compose.yml logs

# Specific service
docker-compose -f config/docker-compose.yml logs postgres

# Follow logs
docker-compose -f config/docker-compose.yml logs -f
```

**Kubernetes Logs:**
```bash
# Pod logs
kubectl logs -n production deployment/apolaki-frontend

# Follow logs
kubectl logs -n production deployment/apolaki-frontend -f

# Previous pod logs (crashed)
kubectl logs -n production deployment/apolaki-frontend --previous
```

---

## Performance Optimization

### Frontend
- Enable gzip compression
- Minify CSS/JS (automatic in production build)
- Use CDN for static assets
- Lazy load images and components

### Backend
- Connection pooling
- Redis caching
- Database query optimization
- Load balancing

### Docker
- Multi-stage builds (reduces image size)
- Minimize layers
- Use .dockerignore
- Alpine base images

### Kubernetes
- Resource limits and requests
- Horizontal Pod Autoscaling (HPA)
- Vertical Pod Autoscaling (VPA)
- Pod Disruption Budgets

---

## Security Best Practices

### Environment Variables
- Never commit `.env` files
- Use `.env.example` for templates
- Use secret management (Vault, AWS Secrets Manager)
- Rotate credentials regularly

### Container Security
- Use minimal base images
- Run as non-root user
- Regular vulnerability scanning
- Keep dependencies updated

### Kubernetes Security
- Network policies
- Pod security policies
- RBAC (Role-Based Access Control)
- Secrets encryption at rest

---

## Next Steps

1. **Start Development** → Follow [Local Development](#local-development)
2. **Deploy to Docker** → Follow [Docker Deployment](#docker-deployment)
3. **Deploy to Kubernetes** → Follow [Kubernetes Deployment](#kubernetes-deployment)
4. **Monitor & Debug** → See [Monitoring & Logs](#monitoring--logs)
5. **Read Documentation** → See `docs/INDEX.md`

---

## Support & Resources

- 📖 [Documentation Index](docs/INDEX.md)
- 🐛 [Troubleshooting Guide](docs/troubleshooting/)
- 🔧 [Configuration Guide](docs/setup/)
- 🚀 [Deployment Guide](docs/deployment/)
- 💻 [Development Guide](docs/guides/)

---

**Last Updated:** February 26, 2026  
**Status:** ✅ Complete and Ready for Deployment
