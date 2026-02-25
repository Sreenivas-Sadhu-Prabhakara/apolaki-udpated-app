# Apolaki Solar Platform

A comprehensive, scalable solar energy management platform with a modern microservices architecture.

## 📁 Project Structure

```
apolaki-updated-app/
├── docs/                          # Documentation
│   ├── ARCHITECTURE.md           # System architecture & design patterns
│   ├── MVP.PRD.md                # MVP product requirements
│   ├── PHASE1.PRD.md             # Phase 1 expansion roadmap
│   └── PHASE2.PRD.md             # Phase 2 strategic vision
│
├── frontend/                      # Vue.js 3 / React frontend
│   ├── src/
│   │   ├── components/           # Reusable UI components
│   │   ├── pages/               # Route pages
│   │   ├── stores/              # State management (Pinia/Zustand)
│   │   ├── services/            # API & business logic
│   │   ├── composables/         # Vue composables
│   │   ├── types/               # TypeScript interfaces
│   │   └── main.ts/jsx          # Entry point
│   ├── assets/
│   │   └── kitchen-sink-ui/     # Design system components & examples
│   ├── public/                  # Static assets
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── package.json
│   └── README.md
│
├── middleware/                    # Go microservices
│   ├── solar-service/           # Solar monitoring & management
│   │   ├── cmd/
│   │   │   └── main.go          # Service entry point
│   │   ├── internal/
│   │   │   ├── domain/          # Domain models
│   │   │   ├── handlers/        # HTTP/gRPC handlers
│   │   │   ├── services/        # Business logic
│   │   │   ├── repositories/    # Data access layer
│   │   │   └── middleware/      # HTTP middleware
│   │   ├── api/
│   │   │   ├── proto/           # Protocol buffers
│   │   │   └── openapi.yaml     # API documentation
│   │   ├── tests/
│   │   ├── Dockerfile
│   │   ├── go.mod
│   │   └── README.md
│   │
│   ├── shared/                  # Shared libraries
│   │   ├── proto/              # Shared Protocol Buffer definitions
│   │   ├── errors/             # Error handling utilities
│   │   └── utils/              # Common utilities
│   │
│   └── api-gateway/            # API Gateway (Kong/Nginx)
│       └── config/
│
├── backend/                      # Database & external services
│   ├── migrations/              # Database migrations
│   ├── seeds/                   # Database seed data
│   └── queries/                 # Stored procedures
│
├── config/                       # Configuration management
│   ├── docker-compose.yml       # Local development stack
│   ├── kubernetes/              # Kubernetes manifests
│   └── env/
│       ├── .env.dev             # Development environment
│       ├── .env.staging         # Staging environment
│       └── .env.prod            # Production environment
│
├── .github/
│   └── workflows/               # CI/CD pipelines
│       ├── build.yml
│       ├── test.yml
│       └── deploy.yml
│
├── README.md                     # Project overview
├── CONTRIBUTING.md              # Contribution guidelines
├── LICENSE                       # MIT License
└── .gitignore
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Go 1.21+
- Docker & Docker Compose
- PostgreSQL 15+

### Development Setup

```bash
# Clone repository
git clone <repo-url>
cd apolaki-updated-app

# Setup frontend
cd frontend
npm install
npm run dev

# Setup middleware (in another terminal)
cd middleware/solar-service
go mod download
go run cmd/main.go

# Setup local services
docker-compose -f config/docker-compose.yml up -d
```

## 📚 Documentation

- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** - System design, microservices structure, scalability patterns
- **[MVP.PRD.md](docs/MVP.PRD.md)** - MVP features, user stories, release plan
- **[PHASE1.PRD.md](docs/PHASE1.PRD.md)** - Phase 1 expansion, team features, analytics
- **[PHASE2.PRD.md](docs/PHASE2.PRD.md)** - Phase 2 vision, multi-domain, AI trading, mobile apps

## 🏗️ Architecture Overview

### Three-Layer Architecture

```
┌─────────────────────────────────┐
│  Frontend Layer (Vue.js/React)  │
│  - Responsive UI                │
│  - Real-time monitoring         │
│  - State management             │
└──────────────┬──────────────────┘
               │ REST/WebSocket/GraphQL
┌──────────────▼──────────────────┐
│  Middleware Layer (Go)          │
│  - Solar Service                │
│  - API Gateway                  │
│  - Authentication               │
└──────────────┬──────────────────┘
               │ gRPC/Direct DB
┌──────────────▼──────────────────┐
│  Backend Layer                  │
│  - PostgreSQL                   │
│  - Redis Cache                  │
│  - Message Queue                │
│  - Elasticsearch                │
└─────────────────────────────────┘
```

## 🎯 Core Features

### MVP (Live)
- ✅ Real-time solar monitoring
- ✅ User authentication
- ✅ Marketplace browsing
- ✅ Financial assessments
- ✅ Contract management
- ✅ Responsive design

### Phase 1 (Q3-Q4 2026)
- Team collaboration
- Advanced analytics
- AI recommendations
- Utility integration
- Provider dashboard
- PWA enhancement

### Phase 2 (Q1-Q2 2027)
- Wind & hydro services
- Energy trading platform
- Mobile native apps
- International expansion
- White-label enterprise
- Advanced AI optimization

## 🛠️ Technology Stack

### Frontend
- **Framework**: Vue.js 3 / React 18+
- **Build**: Vite
- **State**: Pinia / Zustand
- **Styling**: Tailwind CSS
- **HTTP**: Axios

### Middleware
- **Language**: Go 1.21+
- **Framework**: Gin / Echo
- **RPC**: gRPC
- **ORM**: GORM
- **Logging**: Zap

### Backend
- **Database**: PostgreSQL 15+
- **Cache**: Redis
- **Queue**: RabbitMQ / Kafka
- **Search**: Elasticsearch
- **Storage**: S3 / Cloud Storage

## 📊 Project Status

- **Version**: 1.0
- **Status**: MVP Launched
- **Maintainers**: Apolaki Team
- **Last Updated**: February 26, 2026

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📄 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.

## 📞 Support

- **Documentation**: See `/docs` folder
- **Issues**: GitHub Issues
- **Email**: support@apolaki.com

## 🔗 Links

- **Website**: https://apolaki.com
- **Blog**: https://blog.apolaki.com
- **API Docs**: https://api.apolaki.com/docs
- **Status**: https://status.apolaki.com

---

**Built with ❤️ for renewable energy** 🌞
