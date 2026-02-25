# ☀️ Apolaki Solar Platform

> A comprehensive, enterprise-grade solar energy management platform with advanced monitoring, trading, and analytics capabilities.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js 18+](https://img.shields.io/badge/Node.js-18%2B-brightgreen)](https://nodejs.org/)
[![Go 1.21+](https://img.shields.io/badge/Go-1.21%2B-brightgreen)](https://golang.org/)
[![Docker Ready](https://img.shields.io/badge/Docker-Ready-blue)](https://www.docker.com/)

## 🎯 Quick Navigation

**New to this project?** 👉 Start with [docs/START_HERE.md](docs/START_HERE.md)

**Looking for documentation?** 👉 See [docs/INDEX.md](docs/INDEX.md)

---

## ✨ Key Features

- **☀️ Solar Monitoring** - Real-time performance tracking and analytics
- **💹 Energy Trading** - Peer-to-peer and grid trading capabilities
- **📊 Advanced Analytics** - Predictive maintenance and yield forecasting
- **🔐 OAuth Integration** - Google, Facebook, and Instagram authentication
- **💬 Multi-Channel Chat** - Viber and Telegram integration for customer support
- **📱 Responsive Design** - Modern, accessible UI for all devices
- **🚀 Scalable Architecture** - Microservices with Docker & Kubernetes

---

## 📦 Tech Stack

**Frontend**

- Vue.js 3 - Reactive UI framework
- Vite - Lightning-fast build tool
- Pinia - State management
- Tailwind CSS - Utility-first styling

**Backend & Services**

- Go 1.21+ - High-performance microservices
- PostgreSQL 15+ - Reliable database
- Protocol Buffers - Efficient RPC communication
- Docker & Kubernetes - Container orchestration

**Authentication & Integrations**

- Passport.js - OAuth authentication
- Viber API - Messaging integration
- Telegram Bot API - Messaging integration

---

## 📁 Project Structure

```
apolaki-updated-app/
├── docs/                    # 📖 Comprehensive Documentation
│   ├── START_HERE.md       # ⭐ Start here (5 min)
│   ├── INDEX.md            # 📋 Documentation index
│   ├── ARCHITECTURE.md     # 🏗️ System architecture
│   ├── MVP.PRD.md          # 🎯 MVP requirements
│   ├── PHASE1.PRD.md       # Phase 1 roadmap
│   ├── PHASE2.PRD.md       # Phase 2 roadmap
│   ├── authentication/     # 🔐 Auth guides
│   ├── setup/              # ⚙️ Setup & deployment
│   ├── integrations/       # 🔌 Integration docs
│   ├── examples/           # 💡 Code examples
│   └── completed-tasks/    # ✅ Archived reports
│
├── frontend/               # 🎨 Vue.js 3 Frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── views/
│   │   ├── stores/
│   │   ├── services/
│   │   ├── router/
│   │   ├── styles/
│   │   ├── App.vue
│   │   └── main.js
│   ├── assets/
│   │   └── stitch/         # Design system components
│   ├── public/             # Static assets
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── README.md
│
├── middleware/             # 🔧 Microservices & APIs
│   ├── netlify-db-service/ # Database service
│   └── solar-service/      # Solar monitoring service
│
├── config/                 # ⚙️ Configuration files
│   ├── docker-compose.yml
│   ├── env/
│   │   ├── .env.dev
│   │   ├── .env.staging
│   │   └── .env.prod
│   └── kubernetes/
│
├── .github/
│   └── workflows/          # CI/CD pipelines
│
├── README.md               # This file
├── CONTRIBUTING.md         # Contribution guidelines
├── LICENSE                 # MIT License
├── SETUP.sh                # Quick setup script
└── .gitignore
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18.0.0 or higher
- npm or yarn package manager
- Go 1.21+ (for microservices)
- Docker & Docker Compose (for containerized development)
- PostgreSQL 15+ (for database)

### Quick Start (5 minutes)

**Clone the repository**

```bash
git clone <repository-url>
cd apolaki-updated-app
```

**Frontend Setup**

```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173` in your browser.

**Middleware/Backend Setup**

```bash
cd ../middleware/netlify-db-service
npm install
npm start
```

**Configure Environment Variables**

```bash
cp config/env/.env.dev config/env/.env.local
# Edit .env.local with your credentials
```

---

## 📖 Documentation

### For Different Roles

| Role | Start Here | Time |
| --- | --- | --- |
| 👨‍💻 Developer | [docs/START_HERE.md](docs/START_HERE.md) | 5 min |
| 🏗️ DevOps/Infra | [docs/setup/END_TO_END_SETUP_GUIDE.md](docs/setup/END_TO_END_SETUP_GUIDE.md) | 30 min |
| 🔐 Auth Setup | [docs/authentication/OAUTH_QUICK_START.md](docs/authentication/OAUTH_QUICK_START.md) | 10 min |
| 📊 Product Manager | [docs/MVP.PRD.md](docs/MVP.PRD.md) | 20 min |
| 🏛️ Architect | [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | 30 min |

### Complete Documentation Index

👉 **[docs/INDEX.md](docs/INDEX.md)** - Full documentation map with all guides, tutorials, and references.

---

## 🔐 Authentication Features

### OAuth Login (Google, Facebook, Instagram)

- [Quick Start Guide](docs/authentication/OAUTH_QUICK_START.md)
- [Complete Setup Guide](docs/authentication/OAUTH_SETUP_GUIDE.md)
- [Implementation Details](docs/authentication/OAUTH_IMPLEMENTATION_SUMMARY.md)

### Viber & Telegram Integration

- [Quick Start Guide](docs/authentication/VIBER_TELEGRAM_QUICK_START.md)
- [Complete Setup Guide](docs/authentication/VIBER_TELEGRAM_SETUP_GUIDE.md)
- [Implementation Details](docs/authentication/VIBER_TELEGRAM_IMPLEMENTATION_SUMMARY.md)

---

## 🛠️ Development

### Install Dependencies

```bash
# Frontend
cd frontend && npm install

# Middleware
cd middleware/netlify-db-service && npm install

# Solar service (if using Go)
cd middleware/solar-service && go mod download
```

### Run Development Server

```bash
# Frontend (from frontend/)
npm run dev

# Backend (from middleware/netlify-db-service/)
npm start
```

### Build for Production

```bash
# Frontend
npm run build

# Docker
docker-compose -f config/docker-compose.yml up
```

### Testing

```bash
# Frontend tests
npm test
npm run test:ui

# Linting & Type checking
npm run lint
npm run type-check
```

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on:

- Code style and standards
- Commit message format
- Pull request process
- Testing requirements
- Documentation standards

---

## 📊 Project Status

| Component | Status | Version |
| --- | --- | --- |
| Frontend | ✅ Active | 1.0.0 |
| Middleware | ✅ Active | 1.0.0 |
| Auth (OAuth) | ✅ Complete | 1.0.0 |
| Auth (Viber/Telegram) | ✅ Complete | 1.0.0 |
| Database Service | ✅ Complete | 1.0.0 |

---

## 🐛 Troubleshooting

Having issues? Check the [documentation index](docs/INDEX.md) for:

- Authentication troubleshooting
- Database connection issues
- Deployment guides
- Common error solutions

---

## 📞 Support & Community

- 📖 **Documentation**: [docs/INDEX.md](docs/INDEX.md)
- 🐛 **Bug Reports**: Create an issue on GitHub
- 💬 **Discussions**: Use GitHub Discussions
- 📧 **Email**: [Your contact email]

---

## 📜 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

Special thanks to all contributors and the open-source community for their support and amazing tools.

---

**[📖 View Full Documentation](docs/INDEX.md)** • **[🚀 Quick Start Guide](docs/START_HERE.md)** • **[⚙️ Setup Guide](docs/setup/END_TO_END_SETUP_GUIDE.md)**

Built with ❤️ for the solar energy community.
