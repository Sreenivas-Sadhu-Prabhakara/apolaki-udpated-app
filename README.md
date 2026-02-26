# ☀️ Apolaki Solar Platform

> Enterprise-grade solar energy management — monitoring, trading, analytics, and marketplace.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node.js 18+](https://img.shields.io/badge/Node.js-18%2B-brightgreen)](https://nodejs.org/)
[![Go 1.21+](https://img.shields.io/badge/Go-1.21%2B-brightgreen)](https://golang.org/)
[![Docker Ready](https://img.shields.io/badge/Docker-Ready-blue)](https://www.docker.com/)

---

## Quick Start

```bash
git clone <repository-url>
cd apolaki-updated-app

# Frontend
cd frontend && npm install && npm run dev   # http://localhost:5173

# Backend (in a second terminal)
cd middleware/netlify-db-service && npm install && npm start   # http://localhost:3000
```

Full setup details → [docs/SETUP_GUIDE.md](docs/SETUP_GUIDE.md)

---

## Documentation

All docs live in **[`docs/`](docs/)**. Pick the one you need:

| Document | What It Covers |
|----------|---------------|
| [SETUP_GUIDE](docs/SETUP_GUIDE.md) | Prerequisites, install, run locally, env vars, troubleshooting |
| [DEPLOYMENT_GUIDE](docs/DEPLOYMENT_GUIDE.md) | Docker, Kubernetes, Helm, staging → production, rollbacks |
| [ARCHITECTURE](docs/ARCHITECTURE.md) | System design, service boundaries, data flow |
| [API_REFERENCE](docs/API_REFERENCE.md) | REST endpoints, auth, request / response examples |
| [COMPONENTS](docs/COMPONENTS.md) | Vue 3 UI components — Button, Card, Badge, Modal, Alert |
| [OAUTH_SETUP_GUIDE](docs/OAUTH_SETUP_GUIDE.md) | Google, Facebook, Instagram OAuth configuration |
| [VIBER_TELEGRAM_SETUP_GUIDE](docs/VIBER_TELEGRAM_SETUP_GUIDE.md) | Viber & Telegram bot / OAuth setup |
| [CI_CD_PIPELINE](docs/CI_CD_PIPELINE.md) | GitHub Actions workflows, build & deploy automation |
| [MONITORING_LOGGING](docs/MONITORING_LOGGING.md) | Logs, metrics, alerts, Grafana / ELK setup |
| [PRODUCTION_RUNBOOK](docs/PRODUCTION_RUNBOOK.md) | Emergency procedures, incident response, rollback |
| [NETLIFY_DB_INTEGRATION](docs/NETLIFY_DB_INTEGRATION.md) | GORM models, DB connection, solar-service middleware |
| [END_TO_END_SETUP_GUIDE](docs/END_TO_END_SETUP_GUIDE.md) | Detailed walkthrough of every service, start to finish |
| [DOCUMENTATION](docs/DOCUMENTATION.md) | Master reference — architecture, API, DB schema, env vars |

**Product roadmap:**
[MVP PRD](docs/MVP.PRD.md) · [Phase 1](docs/PHASE1.PRD.md) · [Phase 2](docs/PHASE2.PRD.md)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vue.js 3, Vite, Pinia, Tailwind CSS |
| Backend | Node.js 18 + Express (DB service), Go 1.21+ (Solar service) |
| Database | PostgreSQL 15+ |
| Auth | Passport.js — Google, Facebook, Instagram, Viber, Telegram |
| Infra | Docker, Kubernetes, Helm, GitHub Actions |

---

## Project Structure

```text
├── frontend/               Vue.js 3 SPA
│   └── src/
│       ├── components/     Button, Card, Badge, Modal, Alert, OAuthLogin
│       ├── views/          Dashboard, pages
│       ├── stores/         Pinia state
│       ├── services/       API clients
│       └── router/         Vue Router
│
├── middleware/
│   ├── netlify-db-service/ Node.js API + PostgreSQL
│   └── solar-service/      Go microservice
│
├── config/                 docker-compose, env files, init-db.sql
├── scripts/                deploy-prod.sh, dev-setup-local.sh, utilities
├── helm/                   Kubernetes Helm charts (frontend, db-service, solar-service)
├── .github/workflows/      CI/CD pipelines
├── docs/                   ← All documentation lives here
├── README.md               ← You are here
└── CONTRIBUTING.md         Contribution guidelines
```

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for branch conventions, commit format, code style, and PR process.

---

## License

[MIT](LICENSE)
