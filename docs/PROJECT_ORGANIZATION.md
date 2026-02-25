# Apolaki Project Organization Guide

## 📂 Complete Directory Structure

```
apolaki-updated-app/
│
├── 📄 README.md                    # Main project overview
├── 📄 CONTRIBUTING.md              # Contribution guidelines
├── 📄 LICENSE                      # MIT License
├── 📄 .gitignore                   # Git ignore rules
│
├── 📁 docs/                        # 📚 DOCUMENTATION FOLDER
│   ├── ARCHITECTURE.md             # System design & patterns
│   ├── MVP.PRD.md                  # MVP requirements (Live)
│   ├── PHASE1.PRD.md               # Phase 1 expansion (Q3-Q4 2026)
│   ├── PHASE2.PRD.md               # Phase 2 vision (Q1-Q2 2027)
│   └── PROJECT_ORGANIZATION.md     # This file
│
├── 📁 frontend/                    # 🎨 FRONTEND LAYER
│   ├── src/                        # Source code
│   │   ├── components/             # Reusable components
│   │   │   ├── dashboard/          # Dashboard components
│   │   │   ├── marketplace/        # Marketplace components
│   │   │   ├── finance/            # Finance components
│   │   │   ├── assessment/         # Assessment components
│   │   │   ├── contracts/          # Contract components
│   │   │   ├── common/             # Common components
│   │   │   └── layout/             # Layout components
│   │   ├── pages/                  # Route pages
│   │   │   ├── Home.vue            # Home page
│   │   │   ├── Dashboard.vue       # Dashboard page
│   │   │   ├── Marketplace.vue     # Marketplace page
│   │   │   ├── Finance.vue         # Finance page
│   │   │   ├── Assessment.vue      # Assessment page
│   │   │   ├── Contracts.vue       # Contracts page
│   │   │   └── About.vue           # About page
│   │   ├── stores/                 # State management
│   │   │   ├── auth.ts
│   │   │   ├── solar.ts
│   │   │   ├── marketplace.ts
│   │   │   ├── contracts.ts
│   │   │   └── finance.ts
│   │   ├── services/               # API & services
│   │   │   ├── api.ts
│   │   │   ├── websocket.ts
│   │   │   └── storage.ts
│   │   ├── composables/            # Vue composables
│   │   ├── types/                  # TypeScript types
│   │   ├── utils/                  # Utilities
│   │   ├── App.vue
│   │   └── main.ts
│   │
│   ├── assets/                     # 🎨 KITCHEN SINK UI
│   │   └── kitchen-sink-ui/        # Design system & examples
│   │       ├── circular_economy_dashboard/
│   │       ├── corporate_solar_dashboard_v1/
│   │       ├── corporate_solar_marketplace_v2/
│   │       ├── design_system_kitchen_sink_v1_1/
│   │       ├── design_system_kitchen_sink_v1_2/
│   │       ├── design_system_kitchen_sink_v1_3/
│   │       ├── design_system_kitchen_sink_v2/
│   │       ├── executive_finance_contracts_v3/
│   │       ├── solar_marketplace_home_dark/
│   │       └── solar_marketplace_home_light/
│   ├── public/                     # Static assets
│   │   ├── index.html
│   │   ├── favicon.ico
│   │   └── robots.txt
│   │
│   ├── vite.config.ts             # Vite configuration
│   ├── tailwind.config.js         # Tailwind CSS config
│   ├── tsconfig.json              # TypeScript config
│   ├── package.json               # Dependencies
│   └── README.md                  # Frontend guide
│
├── 📁 middleware/                  # ⚙️ MIDDLEWARE LAYER (Go Microservices)
│   ├── solar-service/             # Core solar service
│   │   ├── cmd/
│   │   │   └── main.go            # Entry point
│   │   ├── internal/
│   │   │   ├── domain/            # Domain models
│   │   │   │   ├── solar.go
│   │   │   │   ├── marketplace.go
│   │   │   │   ├── contract.go
│   │   │   │   └── finance.go
│   │   │   ├── handlers/          # HTTP/gRPC handlers
│   │   │   ├── services/          # Business logic
│   │   │   ├── repositories/      # Data access
│   │   │   └── middleware/        # HTTP middleware
│   │   ├── api/
│   │   │   ├── proto/             # Protocol buffers
│   │   │   └── openapi.yaml       # API spec
│   │   ├── tests/
│   │   │   ├── unit/
│   │   │   ├── integration/
│   │   │   └── fixtures/
│   │   ├── Dockerfile
│   │   ├── go.mod
│   │   ├── go.sum
│   │   └── README.md
│   │
│   ├── shared/                    # Shared libraries
│   │   ├── proto/                 # Shared protobuf
│   │   ├── errors/                # Error utilities
│   │   └── utils/                 # Common utils
│   │
│   └── api-gateway/               # API Gateway (future)
│       └── config/
│
├── 📁 backend/                     # 🗄️ BACKEND LAYER
│   ├── migrations/                # Database migrations
│   ├── seeds/                     # Seed data
│   └── queries/                   # Stored procedures
│
├── 📁 config/                      # ⚙️ CONFIGURATION
│   ├── docker-compose.yml         # Local dev stack
│   ├── kubernetes/                # K8s manifests
│   └── env/
│       ├── .env.dev               # Development
│       ├── .env.staging           # Staging
│       └── .env.prod              # Production
│
└── 📁 .github/                     # 🔄 CI/CD & GitHub
    └── workflows/
        ├── build.yml
        ├── test.yml
        └── deploy.yml
```

## 🎯 Layer Responsibilities

### Frontend Layer (Vue.js 3)
- **Purpose**: User interface & interaction
- **Tech**: Vue 3, Vite, Tailwind CSS, Pinia
- **Responsibilities**:
  - Rendering UI components
  - State management
  - API communication
  - Real-time updates (WebSocket)
  - User authentication
  - Responsive design

### Middleware Layer (Go Microservices)
- **Purpose**: Business logic & API orchestration
- **Tech**: Go, Gin/Echo, gRPC, PostgreSQL
- **Responsibilities**:
  - API endpoints
  - Authentication/Authorization
  - Business logic
  - Data validation
  - Inter-service communication
  - Error handling

**Current Services:**
- `solar-service` - Core solar monitoring, marketplace, contracts, finance

**Future Services:**
- `wind-service` - Wind energy (Phase 2)
- `hydro-service` - Hydro energy (Phase 2)
- `grid-service` - Grid management (Phase 2)
- `trading-service` - Energy trading (Phase 2)
- `analytics-service` - Advanced analytics (Phase 1+)

### Backend Layer
- **Purpose**: Data persistence & external integrations
- **Tech**: PostgreSQL, Redis, RabbitMQ, Elasticsearch, S3
- **Responsibilities**:
  - Data storage
  - Caching
  - Message queuing
  - Search indexing
  - File storage
  - Backup & recovery

## 📊 Technology Stack

| Layer | Component | Technology |
|-------|-----------|-----------|
| **Frontend** | Framework | Vue.js 3 |
| | Build | Vite |
| | State | Pinia |
| | Styling | Tailwind CSS |
| | HTTP | Axios |
| **Middleware** | Language | Go 1.21+ |
| | Framework | Gin/Echo |
| | RPC | gRPC |
| | ORM | GORM |
| | Logging | Zap |
| **Backend** | Database | PostgreSQL 15+ |
| | Cache | Redis |
| | Queue | RabbitMQ/Kafka |
| | Search | Elasticsearch |
| | Storage | AWS S3 |

## 🚀 Development Workflow

### 1. Setting Up Locally

```bash
# Clone the repository
git clone <repo-url>
cd apolaki-updated-app

# Start backend services
docker-compose -f config/docker-compose.yml up -d

# Setup frontend
cd frontend
npm install
npm run dev

# Setup middleware (in another terminal)
cd middleware/solar-service
go mod download
go run cmd/main.go
```

### 2. Development Cycle

```bash
# Create feature branch
git checkout -b feature/your-feature

# Make changes in appropriate layer
# - Frontend: modify src/ files
# - Middleware: modify internal/ files
# - Backend: create migrations

# Test your changes
npm run test              # Frontend
go test ./...            # Middleware

# Commit with clear messages
git commit -m "feat(layer): description"

# Push and create PR
git push origin feature/your-feature
```

### 3. API Communication

**Frontend → Middleware:**
- REST API at `/api/v1/*`
- WebSocket at `/ws/*`
- JSON request/response

**Middleware → Backend:**
- Direct PostgreSQL queries (GORM)
- Redis for caching
- RabbitMQ for async events

## 🌐 API Structure

```
/api/v1/
├── /auth/
│   ├── POST /register
│   ├── POST /login
│   └── POST /refresh
├── /installations/
│   ├── GET / (list)
│   ├── POST / (create)
│   ├── GET /{id}
│   ├── PUT /{id}
│   └── DELETE /{id}
├── /monitoring/
│   ├── GET /{id}/current
│   ├── GET /{id}/daily
│   └── GET /{id}/monthly
├── /marketplace/
│   ├── GET /products
│   ├── GET /products/{id}
│   └── GET /providers
├── /assessment/
│   ├── POST /calculate
│   └── GET /{id}
├── /contracts/
│   ├── GET / (list)
│   ├── GET /{id}
│   └── POST /{id}/sign
└── /users/
    ├── GET /profile
    └── PUT /profile
```

## 🔄 Data Flow

### Example: Real-Time Monitoring Update

```
1. Hardware Device
   ↓ (5-minute interval)
2. API Endpoint: POST /api/v1/installations/{id}/data
   ↓
3. Solar Service (Go)
   ├─ Validate input
   ├─ Store in PostgreSQL
   ├─ Update Redis cache
   └─ Publish to RabbitMQ
   ↓
4. Event Processors
   ├─ Analytics service
   ├─ Elasticsearch indexing
   └─ Notification service
   ↓
5. Frontend Clients (WebSocket)
   ├─ GET current data from Redis
   ├─ Real-time update via WebSocket
   └─ Update dashboard UI
```

## 📁 File Organization Principles

### Component Location Rules

**Frontend:**
- Page-level components → `src/pages/`
- Reusable components → `src/components/{feature}/`
- Shared utilities → `src/composables/` or `src/utils/`
- API calls → `src/services/api.ts`
- Types → `src/types/index.ts`

**Middleware:**
- Domain models → `internal/domain/`
- API handlers → `internal/handlers/`
- Business logic → `internal/services/`
- Database access → `internal/repositories/`
- Utilities → `internal/utils/`

**Configuration:**
- Local dev → `config/docker-compose.yml`
- Environment vars → `config/env/.env.*`
- Kubernetes → `config/kubernetes/`

## 🔐 Security Zones

```
┌─────────────────────────────────────┐
│ Public Zone (No Auth Required)      │
│ - Landing page                      │
│ - Login/Register pages              │
│ - Public API docs                   │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│ Authenticated Zone (JWT Required)   │
│ - Dashboard                         │
│ - Monitoring data                   │
│ - Marketplace                       │
│ - Contracts                         │
│ - Assessment tool                   │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│ Admin Zone (Special Permissions)    │
│ - System configuration              │
│ - User management                   │
│ - Provider management               │
│ - Analytics dashboards              │
└─────────────────────────────────────┘
```

## 🧪 Testing Strategy

### Test Locations

```
frontend/
└── src/
    └── __tests__/
        ├── unit/
        ├── integration/
        └── fixtures/

middleware/solar-service/
└── tests/
    ├── unit/
    ├── integration/
    └── fixtures/
```

### Test Commands

```bash
# Frontend
npm run test              # Run tests
npm run test:ui          # UI test runner

# Middleware
go test ./...            # Run all tests
go test -v ./...         # Verbose
go test -cover ./...     # Coverage
```

## 📚 Documentation

### Where to Find Information

| Topic | Location |
|-------|----------|
| System Architecture | `docs/ARCHITECTURE.md` |
| MVP Features | `docs/MVP.PRD.md` |
| Phase 1 Roadmap | `docs/PHASE1.PRD.md` |
| Phase 2 Vision | `docs/PHASE2.PRD.md` |
| Contribution Guide | `CONTRIBUTING.md` |
| Frontend Guide | `frontend/README.md` |
| Middleware Guide | `middleware/solar-service/README.md` |

## 🎨 Design System

The kitchen-sink-ui folder contains:
- **Circular Economy Dashboard** - Sustainability metrics
- **Corporate Solar Dashboard v1** - Business monitoring
- **Corporate Solar Marketplace v2** - Product catalog
- **Design System Kitchen Sink** - Component library
- **Executive Finance Contracts** - Financial & legal UI
- **Solar Marketplace Home** - Landing pages (dark/light)

Use these as reference for component design and user interface patterns.

## 🚢 Deployment

### Development
```bash
docker-compose -f config/docker-compose.yml up
```

### Staging
- Uses `config/kubernetes/` manifests
- Connects to staging database & services
- Environment: `config/env/.env.staging`

### Production
- Multi-region Kubernetes deployment
- Environment: `config/env/.env.prod`
- CI/CD via GitHub Actions

## 🎓 Onboarding Checklist

- [ ] Read `README.md` (project overview)
- [ ] Read `docs/ARCHITECTURE.md` (system design)
- [ ] Clone repository
- [ ] Setup local development environment
- [ ] Run `docker-compose up` for backend services
- [ ] Start frontend dev server
- [ ] Start middleware service
- [ ] Read relevant PRD (MVP/Phase 1/Phase 2)
- [ ] Make first code contribution
- [ ] Open pull request with clear description

## ❓ FAQ

**Q: Where do I add a new feature?**
A: Create components in `frontend/src/components/`, endpoints in middleware `internal/handlers/`, and update API routes.

**Q: How do I run just the backend services?**
A: `docker-compose -f config/docker-compose.yml up`

**Q: Where are the API specifications?**
A: See `middleware/solar-service/api/openapi.yaml` and `docs/API_REFERENCE.md`

**Q: How do I debug a Go service?**
A: Use `dlv debug ./cmd/main.go` or VS Code debugger with Go extension.

**Q: Where should database migrations go?**
A: Create SQL files in `backend/migrations/` with timestamp prefix.

## 📞 Support

- **Questions?** Check the `/docs` folder
- **Issues?** Create a GitHub Issue
- **Contributions?** See `CONTRIBUTING.md`

---

**Last Updated**: February 26, 2026  
**Version**: 1.0  
**Maintainers**: Apolaki Team
