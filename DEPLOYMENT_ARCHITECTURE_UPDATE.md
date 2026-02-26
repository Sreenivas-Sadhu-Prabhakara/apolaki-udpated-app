# Deployment Architecture Update — Summary

**Date**: February 26, 2026  
**Status**: Implemented  
**Scope**: Architecture, Agents, and Constitution documents updated

## Overview

The Apolaki Solar Platform now has a **comprehensive separation of deployables** with **configurable database settings** (no hardcoding). All governance documents have been updated to reflect these architectural changes.

---

## Key Changes

### 1. Separate Deployables Architecture

The system is now organized into **three independently deployable units**:

#### Frontend Deployable (`frontend/`)
- **Technology**: Vue.js 3 + Vite
- **Deployment**: Netlify Static, Vercel, AWS S3 + CloudFront, or Docker
- **Independence**: Deploys without touching backend
- **Configuration**: API endpoint URL (environment variable only)

#### Backend Deployable (`middleware/`)
- **Technology**: Go (solar-service) + Node.js (db-service)
- **Deployment**: Netlify Functions, Docker, Kubernetes, or traditional servers
- **Independence**: Deploys without touching frontend
- **Configuration**: Via ConfigManager (see below)

#### Data Layer (External Services)
- **Technology**: PostgreSQL, Redis, S3, Message Queues
- **Configuration**: Connection strings injected at backend startup
- **Shared**: Both frontend and backend use the same data services

### 2. Configuration Management System (★ NEW)

**Zero-hardcoding policy**: All database and service settings are loaded at application startup via **ConfigManager**, never hardcoded in code.

#### Configuration Hierarchy

```
Priority 1: Environment Variables (Netlify platform vars, Docker env)
Priority 2: Vault Services (AWS Secrets Manager, HashiCorp Vault)
Priority 3: Config Files (.env.local, config.yaml — dev only, Git-excluded)
Priority 4: Hard defaults (only for non-sensitive, non-required settings)
```

#### What Cannot Be Hardcoded

- Database host, port, user, password
- Cache connection strings
- JWT signing keys / secrets
- API keys to external services
- Feature flag values

#### Startup Validation

ConfigManager validates all required settings at startup and **fails fast**:

```javascript
const config = await ConfigManager.load();  // Throws if required settings missing
// If we reach here, config is guaranteed valid
```

### 3. Netlify Combined Deployment

A **single `netlify.toml`** orchestrates both frontend and backend:

```toml
[build]
  command = "npm run build:all"           # Build frontend + backend
  publish = "frontend/dist"               # Frontend static assets

[[functions]]
  directory = "middleware/netlify-db-service/functions"
  node_bundler = "esbuild"

# ALL SECRETS in Netlify Dashboard → Build & Deploy → Environment
# NO SECRETS IN THIS FILE
```

**Environment Variables** (set in Netlify Dashboard):

```
DATABASE_HOST
DATABASE_PORT
DATABASE_USER
DATABASE_PASSWORD (from vault)
REDIS_HOST
JWT_SECRET (from vault)
```

### 4. Same Code, Different Config

The **same Docker image** runs in development, staging, and production with different environment variables:

```
Docker Image (built once)
  ↓
Deploy to Development:   env vars = localhost
Deploy to Staging:       env vars = staging-db.internal
Deploy to Production:    env vars = prod-db.internal
```

This ensures **zero environment-specific bugs** — code never changes between environments.

---

## Documents Updated

### `docs/ARCHITECTURE.md`

**New Sections:**
- Updated "Architecture Pattern" diagram to show separate deployables
- Added "Separate Deployables Architecture" section with:
  - Frontend Deployable details
  - Backend Deployable details
  - Data Layer configuration details
  - ConfigManager pattern explanation
- Updated "Deployment Strategy" with:
  - Separate deployables architecture
  - Configuration Management system
  - Netlify combined deployment process
  - Environment isolation strategy

**Key Addition**: The "Deployment Strategy" now includes the **ConfigManager pattern** with priority-based configuration loading and startup validation.

### `AGENTS.md`

**New Sections:**
- `Section 2.3`: Updated Node.js middleware rules to require ConfigManager usage
- `Section 2.4`: **NEW** "Configuration Management" with:
  - Rules for no hardcoding
  - ConfigManager architecture
  - Service constructor injection pattern
  - Startup validation pattern
  - Netlify environment variables setup
- `Section 3`: **NEW** "Deployment & Build Configuration Agent Rules" with:
  - Separate deployables principles
  - Build configuration rules for frontend and backend
  - Netlify combined deployment checklist
  - Environment variables policy
  - Container configuration guidelines

**Key Addition**: Agents are now required to use ConfigManager and forbidden from hardcoding any configuration.

### `CONSTITUTION.md`

**New Section:**
- `Article V`: **NEW** "Deployment & Configuration Architecture" with:
  - Separate Deployables Principle
  - Configuration Management — Zero Hardcoding Policy
  - ConfigManager Pattern specification
  - Configuration Priority hierarchy
  - Environment Isolation strategy
  - Netlify Combined Deployment process
  - No Secrets in Version Control rules
  - Database Migrations strategy

**Key Addition**: The Constitution now makes configuration management and deployment architecture **immutable law** that governs all code changes.

---

## Configuration Management Details

### ConfigManager Pattern

```javascript
// Example: ConfigManager.js
class ConfigManager {
  static async load() {
    return {
      database: {
        host: process.env.DATABASE_HOST,      // Required
        port: parseInt(process.env.DATABASE_PORT),
        user: process.env.DATABASE_USER,
        password: process.env.DATABASE_PASSWORD,
        name: process.env.DATABASE_NAME,
      },
      cache: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
      security: {
        jwtSecret: process.env.JWT_SECRET,   // Required
        bcryptCost: parseInt(process.env.BCRYPT_COST || '12'),
      },
    };
  }
  
  static validate(config) {
    if (!config.database.host) throw new Error('DATABASE_HOST required');
    if (!config.database.password) throw new Error('DATABASE_PASSWORD required');
    if (!config.security.jwtSecret) throw new Error('JWT_SECRET required');
    // ... more validation
  }
}
```

### Service Injection

```javascript
// Services receive config in constructor
class AuthService {
  constructor(config, repository) {
    this.jwtSecret = config.security.jwtSecret;  // From config, not env
    this.repository = repository;
  }
}

// Startup
const config = await ConfigManager.load();
const authService = new AuthService(config, userRepo);
```

### Netlify Environment Variables

Set in **Netlify Dashboard → Site Settings → Build & Deploy → Environment**:

```
DATABASE_HOST = production-db.example.com
DATABASE_PORT = 5432
DATABASE_USER = app_user
DATABASE_PASSWORD = [from AWS Secrets Manager]
DATABASE_NAME = apolaki_production
REDIS_HOST = production-redis.example.com
JWT_SECRET = [from AWS Secrets Manager]
BCRYPT_COST = 12
NODE_ENV = production
```

---

## Deployment Workflow

### Development

```bash
# .env.local (Git-ignored)
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=app_user
DATABASE_PASSWORD=password
# ...

npm run dev                    # Starts with local .env.local
```

### Staging

```bash
# Netlify Dashboard env vars
# → Automatic deploy on push to staging branch

# Build process:
npm run build:all            # Builds frontend + backend
# ConfigManager loads from Netlify env vars
# Frontend uses VITE_API_URL from Netlify
# Backend uses DATABASE_HOST, etc. from Netlify
```

### Production

```bash
# Netlify Dashboard env vars (from vault)
# → Manual approval required before deploy

# Same build process, different env vars
# Zero code changes between staging and production
```

---

## Migration Guide

### For Existing Code

If you have hardcoded configuration:

```javascript
// OLD ❌
const DB_HOST = 'localhost';
const dbConfig = {
  host: process.env.DB_HOST || DB_HOST,
};

// NEW ✅
const config = await ConfigManager.load();
const dbConfig = {
  host: config.database.host,  // Injected, required
};
```

### For New Services

When creating a new service:

```javascript
// Always accept config in constructor
class NewService {
  constructor(config) {
    this.config = config;
    // Use this.config.* throughout
  }
}

// At startup
const newService = new NewService(config);
```

---

## Testing Configuration

### Unit Tests

```javascript
// Pass mock config to services
const mockConfig = {
  database: { host: 'mock-db', ... },
  security: { jwtSecret: 'test-secret' },
};

const service = new AuthService(mockConfig, mockRepository);
expect(service.generateToken()).toBeDefined();
```

### Integration Tests

```javascript
// Use .env.test (Git-ignored) for test config
process.env.DATABASE_HOST = 'test-db';
process.env.JWT_SECRET = 'test-secret';

const config = await ConfigManager.load();
const testApp = await setupApp(config);
```

---

## Security Implications

### Before (Hardcoded Config)

- ❌ Secrets in code or .env files in git
- ❌ Same credentials for dev/test/prod
- ❌ Env-specific bugs (code differs per environment)
- ❌ No way to rotate secrets without code change

### After (ConfigManager)

- ✅ Secrets ONLY in vault/platform env vars
- ✅ Same code, different secrets per environment
- ✅ Zero env-specific bugs (config is the only difference)
- ✅ Secrets can be rotated without code change
- ✅ Failed startup if required secrets missing (fail-fast)

---

## Rollback Plan

If ConfigManager changes cause issues:

1. **Revert to previous version** of middleware code
2. **Same environment variables apply** (backward compatible)
3. **Zero impact to frontend** (independent deployables)
4. **Database remains consistent** (config-agnostic)

---

## Next Steps

1. **Review**: Read all three updated documents:
   - `docs/ARCHITECTURE.md` — System design
   - `AGENTS.md` — Code generation guidelines
   - `CONSTITUTION.md` — Governance law

2. **Implement**: ConfigManager is already created in `config/config.manager.js`

3. **Migrate**: Update existing services to use ConfigManager (gradual)

4. **Enforce**: CI/CD rejects hardcoded credentials (via pre-commit hooks)

5. **Deploy**: Use `netlify.toml` for single-command Netlify deployment

---

## FAQ

**Q: Can I still use `.env` files in development?**  
A: Yes, `.env.local` (Git-ignored) works fine for development. ConfigManager reads environment variables, which can come from `.env` files via `dotenv`.

**Q: What if a required configuration is missing?**  
A: ConfigManager throws an error at startup and exits with code 1. Application never runs with missing config.

**Q: Can different microservices have different ConfigManagers?**  
A: Yes. Each service can extend ConfigManager to add service-specific settings. Base settings (DB, cache) are shared.

**Q: How do we rotate secrets?**  
A: Update the value in vault (AWS Secrets Manager, HashiCorp Vault) or Netlify Dashboard. Redeploy or restart the service. No code change needed.

**Q: What about feature flags and runtime configuration?**  
A: Feature flags should be stored in a database or feature flag service (e.g., LaunchDarkly). ConfigManager handles infrastructure config only.

---

## Related Documents

- `docs/ARCHITECTURE.md` — Full system architecture
- `AGENTS.md` — AI agent guidelines (updated)
- `CONSTITUTION.md` — Project governance (updated)
- `config/config.manager.js` — ConfigManager implementation
- `netlify.toml` — Netlify deployment configuration
- `ENVIRONMENT_VARIABLES.md` — Detailed env var documentation
