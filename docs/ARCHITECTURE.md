# Apolaki Solar Platform - Architecture Documentation

## Overview

Apolaki is a comprehensive solar energy management platform built with a modern, scalable microservices architecture. The platform enables users to monitor solar installations, manage energy production, explore solar marketplaces, and handle contracts and financing.

## Architecture Pattern

**Event-Driven Microservices Architecture** with clear separation of concerns:
- **Frontend Layer**: Reactive framework (Vue.js/React)
- **Middleware Layer**: Go-based microservices
- **Backend Layer**: Database and external service integrations

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Layer (Vue/React)               │
│  ┌──────────────┬──────────────┬──────────────────────────┐ │
│  │   Dashboard  │  Marketplace │  Finance & Contracts    │ │
│  │  Monitoring  │  Solar Options│  Assessment Tools      │ │
│  └──────────────┴──────────────┴──────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
                            ↓ (REST/GraphQL APIs)
┌──────────────────────────────────────────────────────────────┐
│              Middleware Layer (Go Microservices)             │
│  ┌──────────────────────────────────────────────────────────┐│
│  │  Solar Service (Domain-driven, expandable)              ││
│  │  ├─ Monitoring & Analytics                              ││
│  │  ├─ Marketplace Management                              ││
│  │  ├─ Contract Management                                 ││
│  │  └─ Finance & Assessment                                ││
│  └──────────────────────────────────────────────────────────┘│
│  ┌──────────────────────────────────────────────────────────┐│
│  │  Service Mesh / API Gateway                             ││
│  │  ├─ Authentication & Authorization                      ││
│  │  ├─ Rate Limiting & Circuit Breaking                    ││
│  │  └─ Request/Response Transformation                     ││
│  └──────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────┘
                            ↓ (gRPC/REST)
┌──────────────────────────────────────────────────────────────┐
│                Backend Layer                                 │
│  ┌──────────────┬──────────────┬──────────────────────────┐ │
│  │   Database   │   Cache      │  Message Queue           │ │
│  │  PostgreSQL  │   Redis      │  RabbitMQ/Kafka         │ │
│  └──────────────┴──────────────┴──────────────────────────┘ │
│  ┌──────────────┬──────────────┬──────────────────────────┐ │
│  │  File Storage│  Search      │  Monitoring              │ │
│  │  S3/Cloud    │  Elasticsearch│  Prometheus/ELK         │ │
│  └──────────────┴──────────────┴──────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

## Frontend Layer

**Technology Stack:**
- Framework: Vue.js 3 (Composition API) or React 18+
- Build Tool: Vite
- State Management: Pinia (Vue) or Zustand (React)
- UI Framework: Tailwind CSS + Custom Design System
- HTTP Client: Axios/Fetch API
- Real-time: WebSocket for live monitoring

**Directory Structure:**
```
frontend/
├── src/
│   ├── components/
│   │   ├── dashboard/
│   │   ├── marketplace/
│   │   ├── finance/
│   │   ├── assessment/
│   │   ├── contracts/
│   │   ├── common/
│   │   └── layout/
│   ├── pages/
│   │   ├── Home.vue
│   │   ├── Dashboard.vue
│   │   ├── Marketplace.vue
│   │   ├── Finance.vue
│   │   ├── Assessment.vue
│   │   ├── Contracts.vue
│   │   └── About.vue
│   ├── stores/
│   │   ├── auth.ts
│   │   ├── solar.ts
│   │   ├── marketplace.ts
│   │   ├── contracts.ts
│   │   └── finance.ts
│   ├── services/
│   │   ├── api.ts
│   │   ├── websocket.ts
│   │   └── storage.ts
│   ├── composables/
│   │   ├── useAuth.ts
│   │   ├── useSolar.ts
│   │   └── useFetch.ts
│   ├── utils/
│   │   ├── constants.ts
│   │   ├── formatters.ts
│   │   └── validators.ts
│   ├── types/
│   │   └── index.ts
│   ├── App.vue
│   └── main.ts
├── assets/
│   ├── kitchen-sink-ui/
│   │   ├── circular_economy_dashboard/
│   │   ├── corporate_solar_dashboard_v1/
│   │   ├── corporate_solar_marketplace_v2/
│   │   ├── design_system_kitchen_sink_v*/
│   │   ├── executive_finance_contracts_v3/
│   │   └── solar_marketplace_home_*/
│   ├── images/
│   ├── icons/
│   └── styles/
├── public/
│   ├── index.html
│   ├── favicon.ico
│   └── robots.txt
├── vite.config.ts
├── tailwind.config.js
├── package.json
└── README.md
```

## Middleware Layer - Go Microservices

**Technology Stack:**
- Language: Go 1.21+
- Web Framework: Gin or Echo
- RPC: gRPC for service-to-service communication
- Database ORM: GORM
- Configuration: Viper
- Logging: Zap
- Tracing: Jaeger
- Testing: Testify, GoMock

**Service Structure:**
```
middleware/
├── solar-service/
│   ├── cmd/
│   │   └── main.go                 # Entry point
│   ├── internal/
│   │   ├── domain/                 # Domain models
│   │   │   ├── solar.go
│   │   │   ├── marketplace.go
│   │   │   ├── contract.go
│   │   │   └── finance.go
│   │   ├── handlers/               # HTTP/gRPC handlers
│   │   │   ├── solar.go
│   │   │   ├── marketplace.go
│   │   │   ├── contract.go
│   │   │   └── finance.go
│   │   ├── services/               # Business logic
│   │   │   ├── solar_service.go
│   │   │   ├── marketplace_service.go
│   │   │   ├── contract_service.go
│   │   │   └── finance_service.go
│   │   ├── repositories/           # Data access
│   │   │   ├── solar_repo.go
│   │   │   ├── marketplace_repo.go
│   │   │   ├── contract_repo.go
│   │   │   └── finance_repo.go
│   │   ├── middleware/             # HTTP middleware
│   │   │   ├── auth.go
│   │   │   ├── logging.go
│   │   │   ├── cors.go
│   │   │   └── error_handler.go
│   │   ├── config/
│   │   │   └── config.go
│   │   └── utils/
│   │       ├── logger.go
│   │       └── errors.go
│   ├── api/
│   │   ├── proto/                  # Protocol Buffer definitions
│   │   │   └── solar_service.proto
│   │   └── openapi.yaml            # OpenAPI/Swagger spec
│   ├── tests/
│   │   ├── unit/
│   │   ├── integration/
│   │   └── fixtures/
│   ├── go.mod
│   ├── go.sum
│   ├── Dockerfile
│   └── README.md
├── api-gateway/                    # (Future: Kong/Nginx)
│   └── config/
└── shared/                         # Shared libraries
    ├── proto/
    ├── errors/
    └── utils/
```

**Domain-Driven Design (DDD):**

The solar-service uses Domain-Driven Design principles for maximum scalability:

1. **Solar Domain** - Core energy monitoring and analytics
   - Installation monitoring
   - Real-time data streaming
   - Energy production analytics
   - Performance metrics

2. **Marketplace Domain** - Solar product ecosystem
   - Product catalog
   - Provider management
   - Search & filtering
   - Ratings & reviews

3. **Contract Domain** - Agreement management
   - Contract templates
   - Signature workflows
   - Compliance tracking
   - Audit logs

4. **Finance Domain** - Billing and assessment
   - Assessment tools
   - Pricing models
   - Payment processing
   - ROI calculations

## Backend Layer

**Technology Stack:**
- Database: PostgreSQL 15+ (Primary)
- Cache: Redis (Session, Cache, Real-time data)
- Message Queue: RabbitMQ/Kafka (Event streaming)
- Search: Elasticsearch (Full-text search, analytics)
- File Storage: AWS S3 / Google Cloud Storage
- Monitoring: Prometheus + Grafana
- Logging: ELK Stack (Elasticsearch, Logstash, Kibana)

**Database Schema Highlights:**
```
Core Tables:
- users (authentication & authorization)
- installations (solar systems)
- monitoring_data (real-time metrics)
- marketplace_products
- contracts
- assessments
- transactions (finance)
- audit_logs
```

## Cross-Cutting Concerns

### Authentication & Authorization
- JWT tokens with refresh mechanism
- Role-Based Access Control (RBAC)
- OAuth2 integration support
- API Key management for service-to-service

### API Gateway
- Request routing
- Rate limiting (token bucket algorithm)
- Circuit breaking
- Request/response transformation
- Protocol conversion (REST ↔ gRPC)

### Observability
- **Logging**: Structured logging with correlation IDs
- **Metrics**: Prometheus exporters for all services
- **Tracing**: Distributed tracing with Jaeger
- **Alerts**: Alert rules for critical issues

### Security
- HTTPS/TLS encryption
- CORS configuration
- Input validation & sanitization
- SQL injection prevention (parameterized queries)
- Rate limiting per user/API key
- OWASP compliance

## Communication Patterns

### Frontend ↔ Middleware
- **HTTP/REST**: Primary for CRUD operations
- **WebSocket**: Real-time monitoring data updates
- **GraphQL**: (Optional) Complex queries and mutations

### Middleware ↔ Backend
- **gRPC**: For synchronous service-to-service calls
- **Message Queue**: For asynchronous event processing
- **Direct Database**: ORM for data access

## Scalability Strategy

### Horizontal Scaling
1. **Stateless Services**: All Go services are stateless
2. **Load Balancing**: Nginx/Kubernetes for distribution
3. **Database Replication**: Master-slave PostgreSQL setup
4. **Cache Coordination**: Redis Cluster for distributed caching

### Vertical Scaling
- Optimized database queries with indexing
- Connection pooling
- Caching strategies (Redis)
- Asynchronous processing for heavy operations

### Future Expansion
**Multi-Domain Architecture:**
- Adding Wind Service (similar structure to Solar Service)
- Hydro Service for water energy
- Grid Management Service
- Carbon Tracking Service
- Each domain maintains its own database (Database per Service pattern)

## Deployment Strategy

### Container Orchestration
- Docker for containerization
- Kubernetes for orchestration
- Helm charts for configuration management

### CI/CD Pipeline
```
Code Push → GitHub Actions → Build → Test → 
Registry → Deploy to Dev → Deploy to Staging → 
Approval → Deploy to Production
```

### Environments
- Development (local/dev cluster)
- Staging (pre-production)
- Production (multi-region ready)

## Error Handling & Resilience

### Circuit Breaker Pattern
- Prevent cascading failures
- Auto-recovery mechanisms
- Fallback responses

### Retry Strategy
- Exponential backoff
- Jitter for distributed systems
- Max retry limits

### Timeout Management
- Service-level timeouts
- Request-level timeouts
- Connection timeouts

## Testing Strategy

### Unit Tests
- Minimum 80% code coverage
- Mock external dependencies
- Test all business logic

### Integration Tests
- Database integration
- API endpoint testing
- Service-to-service communication

### E2E Tests
- User workflow validation
- Critical path testing
- Performance benchmarks

## Performance Targets

- API Response Time: < 200ms (p95)
- Dashboard Load: < 3 seconds
- Real-time Update Latency: < 500ms
- Database Query: < 100ms (p95)
- Throughput: 10,000 requests/second
- Availability: 99.95% uptime

## Monitoring & Alerting

### Key Metrics
- Request latency (p50, p95, p99)
- Error rates by service
- CPU/Memory utilization
- Database connection pool status
- Message queue depth
- Cache hit ratio

### Alerts
- Service down (critical)
- High error rate (warning)
- Latency SLA breach (warning)
- Database performance degradation (warning)

## Data Flow Example: Solar Monitoring

```
1. Hardware Device → Transmits data every 5 minutes
2. API Gateway → Routes to solar-service
3. Solar Service → Validates & stores in PostgreSQL
4. Cache → Updates Redis for real-time access
5. Message Queue → Publishes MonitoringDataUpdated event
6. Analytics Service → Processes for insights
7. WebSocket → Sends update to connected frontend clients
8. Frontend → Updates Dashboard in real-time
9. Elasticsearch → Indexes for historical search
10. Prometheus → Scrapes metrics
```

## Security Checklist

- [ ] HTTPS/TLS for all communications
- [ ] JWT token validation on every request
- [ ] SQL parameterized queries
- [ ] Input validation on all endpoints
- [ ] Rate limiting per user/IP
- [ ] CORS properly configured
- [ ] Secrets management (HashiCorp Vault)
- [ ] Database encryption at rest
- [ ] Backup & disaster recovery
- [ ] Security scanning in CI/CD
- [ ] Penetration testing
- [ ] Regular security audits

## References & Technologies

- **Framework Docs**: [Gin](https://gin-gonic.com/), [Echo](https://echo.labstack.com/)
- **gRPC**: https://grpc.io/
- **PostgreSQL**: https://www.postgresql.org/
- **Redis**: https://redis.io/
- **Kubernetes**: https://kubernetes.io/
- **Docker**: https://www.docker.com/

---

**Document Version**: 1.0  
**Last Updated**: February 26, 2026  
**Author**: Architecture Team
