# Apolaki Solar Platform - Master Documentation

## Quick Navigation

- **Getting Started?** → See [SETUP_GUIDE.md](SETUP_GUIDE.md)
- **Deploying Code?** → See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
- **Building UI?** → See [COMPONENTS.md](COMPONENTS.md)
- **Need Details?** → See section below

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Project Structure](#project-structure)
5. [Backend Services](#backend-services)
6. [Frontend Application](#frontend-application)
7. [Database](#database)
8. [API Reference](#api-reference)
9. [Authentication](#authentication)
10. [Monitoring & Troubleshooting](#monitoring--troubleshooting)

---

## Project Overview

### What is Apolaki Solar?

Apolaki Solar Platform is a comprehensive web-based application for managing solar energy installations, monitoring systems, conducting solar assessments, and facilitating solar product marketplace transactions.

### Key Features

- **Installation Management**: Create and manage solar installations
- **Real-time Monitoring**: Track system performance and energy generation
- **Solar Assessment**: Calculate solar potential for properties
- **Marketplace**: Browse and purchase solar products
- **User Management**: OAuth-based authentication with Google, GitHub, Viber, Telegram
- **Analytics Dashboard**: Performance metrics and KPIs
- **API-driven**: RESTful APIs for all services

### Target Users

- Solar installers and engineers
- Property owners considering solar
- Solar product retailers
- System administrators

---

## Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Vue.js 3)                   │
│  ─ Dashboard, Installations, Monitoring, Assessment      │
│  ─ Marketplace, User Profile, Settings                   │
└──────────────────────┬──────────────────────────────────┘
                       │ (HTTP/HTTPS)
        ┌──────────────┼──────────────┐
        │              │              │
    ┌───▼────┐  ┌──────▼──────┐  ┌───▼────────┐
    │Database│  │  API Server │  │   Solar    │
    │Service │  │  (Node.js)  │  │   Service  │
    │(Netlify)   │             │  │    (Go)    │
    └────────┘  └─────────────┘  └────────────┘
        │              │              │
    PostgreSQL    Express.js      External APIs
```

### Services

1. **Frontend**: Vue.js 3 SPA with Vite
2. **Database Service**: Node.js middleware with PostgreSQL
3. **Solar Service**: Go microservice for calculations
4. **Authentication**: OAuth 2.0 (Google, GitHub, Viber, Telegram)

---

## Technology Stack

### Frontend
- **Framework**: Vue.js 3 (Composition API)
- **Build Tool**: Vite 5
- **State Management**: Pinia
- **HTTP Client**: Axios
- **Styling**: CSS3 + Tailwind utilities
- **Node.js**: >= 18.0.0

### Backend
- **Runtime**: Node.js 18+ (Database Service)
- **Framework**: Express.js
- **Language**: Go (Solar Service)
- **Database**: PostgreSQL 14+
- **ORM**: pg-promise or direct SQL

### Infrastructure
- **Containerization**: Docker
- **Orchestration**: Kubernetes + Helm
- **CI/CD**: GitHub Actions
- **Cloud**: AWS / Digital Ocean / Self-hosted
- **Monitoring**: Prometheus + Grafana (optional)

### Development Tools
- **Package Manager**: npm
- **Version Control**: Git
- **Code Quality**: ESLint
- **Testing**: Vitest, Jest
- **Documentation**: Markdown

---

## Project Structure

```
apolaki-updated-app/
├── frontend/                    # Vue.js 3 application
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── views/              # Page-level components
│   │   ├── stores/             # Pinia state stores
│   │   ├── services/           # API services
│   │   ├── router/             # Vue Router config
│   │   ├── styles/             # Global styles
│   │   ├── App.vue             # Root component
│   │   └── main.js             # Entry point
│   ├── public/                 # Static assets
│   ├── package.json
│   ├── vite.config.js
│   └── Dockerfile
│
├── middleware/
│   ├── netlify-db-service/     # Database API service (Node.js)
│   │   ├── src/
│   │   │   ├── db.js           # Database connection
│   │   │   ├── server.js       # Express server
│   │   │   ├── routes/         # API routes
│   │   │   └── middleware/     # Custom middleware
│   │   ├── package.json
│   │   ├── .env.example
│   │   └── Dockerfile
│   │
│   └── solar-service/          # Solar calculations (Go)
│       ├── main.go
│       ├── handlers/
│       └── Dockerfile
│
├── config/                     # Configuration files
│   ├── docker-compose.yml
│   ├── env/
│   │   ├── .env.dev
│   │   ├── .env.staging
│   │   ├── .env.prod
│   │   └── .env.example
│   └── init-db.sql             # Database schema
│
├── scripts/                    # Automation & utilities
│   ├── deploy-prod.sh          # Production deployment
│   ├── dev-setup-local.sh      # Local dev setup
│   ├── docker-utils.sh         # Docker commands
│   ├── k8s-utils.sh            # Kubernetes commands
│   └── README.md
│
├── helm/                       # Kubernetes Helm charts
│   ├── frontend/
│   ├── db-service/
│   ├── solar-service/
│   ├── values-dev.yaml
│   ├── values-staging.yaml
│   ├── values-production.yaml
│   └── README.md
│
├── .github/workflows/          # CI/CD pipelines
│   ├── frontend-ci.yml
│   ├── backend-ci.yml
│   ├── docker-build.yml
│   └── deploy.yml
│
├── docs/                       # Detailed documentation
├── DOCUMENTATION.md            # This file
├── SETUP_GUIDE.md             # Setup instructions
├── DEPLOYMENT_GUIDE.md        # Deployment procedures
├── COMPONENTS.md              # UI components reference
└── README.md
```

---

## Backend Services

### Database Service (Node.js + Express)

**Purpose**: RESTful API for database operations  
**Port**: 3000 (development)  
**Documentation**: See [SETUP_GUIDE.md - Database Service](SETUP_GUIDE.md#database-service)

**Key Endpoints**:
- `POST /api/users` - Create user
- `GET /api/users/:id` - Get user
- `POST /api/installations` - Create installation
- `GET /api/installations` - List installations
- `GET /api/installations/:id` - Get installation details

**Database**: PostgreSQL

### Solar Service (Go)

**Purpose**: Solar calculations and assessments  
**Port**: 8080 (development)  
**Language**: Go

**Key Features**:
- Solar potential calculations
- Roof analysis
- Energy generation forecasts
- System sizing recommendations

---

## Frontend Application

### Architecture

The frontend is a single-page application (SPA) built with Vue 3 and Vite.

**Key Components**:
- **Dashboard**: Overview of installations and metrics
- **Installations**: CRUD operations for solar systems
- **Monitoring**: Real-time system monitoring
- **Assessment**: Solar potential calculator
- **Marketplace**: Product browsing and purchasing
- **Authentication**: Google OAuth login

**State Management**: Pinia stores for user and installation data

**Routing**: Vue Router with protected routes

### Development

```bash
cd frontend
npm install
npm run dev           # Start dev server on port 5173
npm run build         # Production build
npm run preview       # Preview production build
npm run lint          # Code quality check
npm run test          # Run unit tests
```

---

## Database

### Schema Overview

```sql
-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  oauth_provider VARCHAR(50),
  oauth_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Installations table
CREATE TABLE installations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  name VARCHAR(255),
  address TEXT,
  capacity DECIMAL(10,2),
  status VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- (See config/init-db.sql for complete schema)
```

### Connection

**Host**: localhost (development)  
**Port**: 5432  
**Database**: apolaki  
**User**: apolaki_user  

---

## API Reference

### Base URL
- Development: `http://localhost:3000`
- Staging: `https://api-staging.apolaki.com`
- Production: `https://api.apolaki.com`

### Authentication

All endpoints except login/signup require bearer token:

```
Authorization: Bearer <JWT_TOKEN>
```

### Key Endpoints

#### Users
- `POST /api/users` - Create user
- `GET /api/users/:id` - Get user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

#### Installations
- `GET /api/installations` - List user's installations
- `POST /api/installations` - Create installation
- `GET /api/installations/:id` - Get installation details
- `PUT /api/installations/:id` - Update installation
- `DELETE /api/installations/:id` - Delete installation

#### Assessments
- `POST /api/assessments` - Create solar assessment
- `GET /api/assessments/:id` - Get assessment results

---

## Authentication

### OAuth 2.0 Providers

Supported:
- Google OAuth 2.0
- GitHub OAuth 2.0
- Viber OAuth
- Telegram OAuth

### Flow

1. User clicks "Login with [Provider]"
2. Redirected to provider's login page
3. User authorizes application
4. Redirected back with authorization code
5. Backend exchanges code for access token
6. User created/updated in database
7. JWT token issued to frontend
8. Frontend stores token in localStorage

### Implementation

See detailed guides:
- OAuth Setup: [SETUP_GUIDE.md - Authentication](SETUP_GUIDE.md#authentication)
- Components Reference: [COMPONENTS.md](COMPONENTS.md)

---

## Monitoring & Troubleshooting

### Common Issues

#### Database Connection Failed
1. Check PostgreSQL is running: `pg_isready`
2. Verify credentials in `.env` file
3. Check database exists: `psql -l`
4. Check user permissions

**Solution**: See [DEPLOYMENT_GUIDE.md - Troubleshooting](DEPLOYMENT_GUIDE.md#troubleshooting)

#### API Returns 401 Unauthorized
1. Check JWT token is valid
2. Verify token in Authorization header
3. Check token hasn't expired

**Solution**: Refresh token or re-login

#### Frontend Won't Load
1. Check frontend dev server is running
2. Verify port 5173 is accessible
3. Check browser console for errors
4. Clear browser cache

**Solution**: `npm run dev` in frontend directory

### Logs

- **Frontend**: Browser DevTools Console
- **Backend**: `logs/app.log` or Docker logs
- **Database**: PostgreSQL logs
- **Docker**: `docker logs <container_name>`

### Health Checks

```bash
# Frontend
curl http://localhost:5173

# Backend API
curl http://localhost:3000/health

# Database
psql -U apolaki_user -d apolaki -c "SELECT 1"
```

---

## Environment Variables

### Frontend (.env.local)
```env
VITE_API_URL=http://localhost:3000
VITE_APP_NAME=Apolaki Solar Platform
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

### Backend (.env)
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/apolaki
NODE_ENV=development
JWT_SECRET=your-jwt-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

---

## Deployment

### Quick Deploy

For detailed deployment instructions, see [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)

```bash
# Production deployment
./scripts/deploy-prod.sh production v1.0.0

# Staging deployment
./scripts/deploy-prod.sh staging latest

# Check status
./scripts/k8s-utils.sh status production
```

---

## Support & Resources

### Documentation Files

| File | Purpose |
|------|---------|
| [SETUP_GUIDE.md](SETUP_GUIDE.md) | Installation & configuration |
| [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) | Deployment & operations |
| [COMPONENTS.md](COMPONENTS.md) | UI components reference |
| [DOCUMENTATION.md](DOCUMENTATION.md) | This file |

### Key Scripts

| Script | Purpose |
|--------|---------|
| `scripts/dev-setup-local.sh` | Local development setup |
| `scripts/deploy-prod.sh` | Production deployment |
| `scripts/docker-utils.sh` | Docker commands |
| `scripts/k8s-utils.sh` | Kubernetes commands |

### External Resources

- [Vue.js Documentation](https://vuejs.org)
- [Express.js Guide](https://expressjs.com)
- [PostgreSQL Manual](https://www.postgresql.org/docs)
- [Docker Documentation](https://docs.docker.com)
- [Kubernetes Docs](https://kubernetes.io/docs)

---

## Getting Help

1. **Check logs**: `logs/`, Docker logs, or browser DevTools
2. **Read documentation**: Check SETUP_GUIDE.md or DEPLOYMENT_GUIDE.md
3. **Review examples**: See code comments and documentation
4. **Run diagnostics**: `./scripts/k8s-utils.sh events production`

---

## Contributing

### Development Workflow

1. Create feature branch: `git checkout -b feature/my-feature`
2. Make changes and test locally
3. Commit with clear messages: `git commit -m "feat: add new feature"`
4. Push to branch: `git push origin feature/my-feature`
5. Create pull request for review

### Code Style

- Frontend: Follow Vue.js style guide
- Backend: Follow Node.js best practices
- Database: Normalized schema design
- Comments: Use JSDoc for functions

### Testing

- Frontend: Unit tests with Vitest
- Backend: Unit and integration tests
- Database: Test with real data

---

**Last Updated**: February 26, 2026  
**Version**: 1.0.0  
**Status**: Production-Ready
