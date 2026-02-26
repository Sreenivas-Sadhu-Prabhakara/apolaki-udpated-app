# Environment Variables Configuration Guide

## Overview

This document describes all environment variables used in the Apolaki Solar Platform. Environment variables are **NOT** hardcoded in the application - they are read at runtime through the `ConfigManager` class.

## Quick Start

### For Local Development
```bash
# Copy template
cp .env.example .env.local

# Edit .env.local with your values
nano .env.local

# Source before running
source .env.local
npm run dev
```

### For Netlify Deployment
Set variables in your Netlify dashboard:
1. Go to **Site settings** → **Build & deploy** → **Environment**
2. Add environment variables (shown below)
3. Trigger a new deploy

### For Docker
```bash
# Copy and edit
cp .env.example .env

# Run with docker-compose
docker-compose -f config/docker-compose.yml up
```

## Database Configuration

### Option 1: Connection String (Recommended for Production)

Use a single `DATABASE_URL` environment variable:

```bash
# PostgreSQL
DATABASE_URL=postgresql://user:password@host:5432/database_name

# Netlify Neon
DATABASE_URL=postgresql://user:password@host.neon.tech/database_name

# Amazon RDS
DATABASE_URL=postgresql://user:password@rds-instance.region.rds.amazonaws.com:5432/database_name

# Heroku Postgres
DATABASE_URL=postgresql://user:password@ec2-instance.compute-1.amazonaws.com:5432/database_name
```

### Option 2: Individual Parameters (Recommended for Development)

```bash
DB_HOST=localhost
DB_PORT=5432
DB_USER=apolaki_user
DB_PASSWORD=apolaki_pass
DB_NAME=apolaki_db
DB_SSL=false

# Advanced options
DB_POOL_MIN=2
DB_POOL_MAX=10
DB_IDLE_TIMEOUT=30000
DB_CONNECTION_TIMEOUT=2000
```

**Priority**: If both are set, `DATABASE_URL` takes precedence.

## Authentication Configuration

### JWT Secrets (Required for Production)

```bash
# Generate strong secrets
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)

# Configure in environment
JWT_SECRET=your-super-secret-jwt-key-32-chars-minimum
JWT_REFRESH_SECRET=your-super-secret-refresh-key-32-chars-minimum
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
```

### Session Configuration

```bash
SESSION_SECRET=your-super-secret-session-key-32-chars-minimum
SESSION_SECURE=false         # true in production (HTTPS only)
SESSION_HTTP_ONLY=true       # true to prevent XSS token theft
SESSION_SAME_SITE=lax        # lax, strict, or none
SESSION_MAX_AGE=86400000     # milliseconds (24 hours)
```

## CORS Configuration

```bash
# Allowed origins (comma-separated)
CORS_ORIGINS=http://localhost:5173,https://apolaki.com

# Allowed HTTP methods
CORS_METHODS=GET,POST,PUT,DELETE,OPTIONS

# Allowed request headers
CORS_ALLOWED_HEADERS=Origin,X-Requested-With,Content-Type,Accept,Authorization

# Allow credentials
CORS_CREDENTIALS=true
```

## Frontend URLs

```bash
# Used by backend to set CORS and redirects
FRONTEND_URL=http://localhost:5173

# Used by frontend in Vite build
VITE_API_URL=http://localhost:3001/api
VITE_WS_URL=ws://localhost:3001/ws

# Netlify deployment (frontend)
VITE_API_URL=/api
VITE_WS_URL=/ws
```

## OAuth Configuration (Optional)

### Google OAuth

```bash
# Get credentials from: https://console.cloud.google.com
OAUTH_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
OAUTH_GOOGLE_CLIENT_SECRET=your-google-client-secret
OAUTH_REDIRECT_URI=http://localhost:3001/api/auth/google/callback
```

### Facebook OAuth

```bash
# Get credentials from: https://developers.facebook.com
OAUTH_FACEBOOK_CLIENT_ID=your-facebook-app-id
OAUTH_FACEBOOK_CLIENT_SECRET=your-facebook-app-secret
```

### GitHub OAuth

```bash
# Get credentials from: https://github.com/settings/developers
OAUTH_GITHUB_CLIENT_ID=your-github-client-id
OAUTH_GITHUB_CLIENT_SECRET=your-github-client-secret
```

## Redis Configuration (Optional)

```bash
# Enable/disable caching layer
REDIS_ENABLED=true

# Redis connection
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
REDIS_PASSWORD=          # Leave empty if no auth required
```

## RabbitMQ Configuration (Optional)

```bash
# Enable/disable message queue
RABBITMQ_ENABLED=false

# RabbitMQ connection
RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
RABBITMQ_USER=apolaki
RABBITMQ_PASSWORD=apolaki_pass
RABBITMQ_VHOST=/apolaki
```

## Application Configuration

```bash
# Environment
NODE_ENV=development          # development, staging, or production
APP_ENV=development

# Application name
APP_NAME=Apolaki

# Server
PORT=3001
HOST=0.0.0.0

# Base URL
API_URL=http://localhost:3001/api

# Debug mode
APP_DEBUG=false              # true for development
```

## Logging Configuration

```bash
# Log level
LOG_LEVEL=info              # debug, info, warn, error

# Log format
LOG_FORMAT=json             # json or text

# Log file path
LOG_FILE_PATH=./logs
```

## Environment-Specific Configurations

### Development

```bash
NODE_ENV=development
APP_DEBUG=true
DB_HOST=localhost
DB_USER=apolaki_user
DB_PASSWORD=apolaki_pass
JWT_SECRET=dev-jwt-secret-change-in-production
SESSION_SECURE=false
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
REDIS_ENABLED=true
LOG_LEVEL=debug
```

### Staging

```bash
NODE_ENV=staging
APP_DEBUG=false
DB_HOST=staging-db.example.com
DB_SSL=true
JWT_SECRET=your-staging-jwt-secret-32-chars
SESSION_SECURE=true
CORS_ORIGINS=https://staging.apolaki.com
REDIS_ENABLED=true
LOG_LEVEL=info
```

### Production

```bash
NODE_ENV=production
APP_DEBUG=false
DATABASE_URL=postgresql://user:password@prod-db.example.com:5432/apolaki_db
JWT_SECRET=your-production-jwt-secret-32-chars-minimum
JWT_REFRESH_SECRET=your-production-refresh-secret-32-chars
SESSION_SECRET=your-production-session-secret-32-chars
SESSION_SECURE=true
FRONTEND_URL=https://apolaki.com
CORS_ORIGINS=https://apolaki.com
DB_SSL=true
REDIS_ENABLED=true
LOG_LEVEL=info
```

### Netlify Deployment

```bash
NODE_ENV=production
FRONTEND_URL=https://your-netlify-site.netlify.app

# Database - use Netlify Neon or external managed database
DATABASE_URL=postgresql://user:password@neon.tech:5432/database_name

# Secrets
JWT_SECRET=your-production-jwt-secret-32-chars-minimum
JWT_REFRESH_SECRET=your-production-refresh-secret-32-chars
SESSION_SECRET=your-production-session-secret-32-chars

# URLs - Netlify serves everything at root, API proxied through functions
VITE_API_URL=/api
VITE_WS_URL=/ws
CORS_ORIGINS=https://your-netlify-site.netlify.app

# Caching - use Netlify's built-in features
REDIS_ENABLED=false
LOG_LEVEL=info
```

## How ConfigManager Reads Variables

The `ConfigManager` class reads environment variables at application startup:

```javascript
// src/server.js
import { configManager } from '../config/config.manager.js';

// Initialize configuration from process.env
configManager.initialize();

// Access configuration
const dbConfig = configManager.get('database');
const jwtSecret = configManager.get('jwt.secret');
const allConfig = configManager.getAll();

// Validate configuration (throws errors if invalid)
configManager.validate();
```

## Variable Validation

The ConfigManager automatically validates:

1. **Database Configuration**: Either `DATABASE_URL` or all of `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
2. **JWT Secrets**: Must be provided in production (can't start with `dev-`)
3. **Port Numbers**: Must be valid (1-65535)

## Security Best Practices

1. **Never commit `.env` files to git** - use `.env.example` template only
2. **Use strong secrets** - generate with `openssl rand -base64 32`
3. **Rotate secrets regularly** in production
4. **Use Netlify environment variables** (dashboard) - never in `netlify.toml`
5. **Use managed databases** (Neon, RDS, Heroku) in production
6. **Enable HTTPS/TLS** in production (`SESSION_SECURE=true`, `DB_SSL=true`)
7. **Limit CORS origins** - never use `*` in production
8. **Use least-privilege database roles** - never use superuser

## Testing Variable Configuration

```javascript
// test-config.js
import { configManager } from './config/config.manager.js';

// Initialize from environment
configManager.initialize();

// Log safe configuration (no secrets)
console.log('Configuration:', configManager.logConfig());

// Validate
try {
  configManager.validate();
  console.log('✅ Configuration is valid');
} catch (error) {
  console.error('❌ Configuration error:', error.message);
  process.exit(1);
}

// Access specific values
console.log('Database Host:', configManager.get('database.host'));
console.log('JWT Expires In:', configManager.get('jwt.expiresIn'));
```

## Troubleshooting

### Error: "Database configuration incomplete"

**Cause**: Missing either `DATABASE_URL` or database connection parameters.

**Solution**:
```bash
# Option 1: Set connection string
export DATABASE_URL=postgresql://user:password@host:5432/dbname

# Option 2: Set individual parameters
export DB_HOST=localhost
export DB_USER=apolaki_user
export DB_PASSWORD=apolaki_pass
export DB_NAME=apolaki_db
```

### Error: "JWT_SECRET must be set to a secure value in production"

**Cause**: Using development default JWT secret in production.

**Solution**:
```bash
export JWT_SECRET=$(openssl rand -base64 32)
export JWT_REFRESH_SECRET=$(openssl rand -base64 32)
```

### CORS errors: "Not allowed by Access-Control-Allow-Origin"

**Cause**: Frontend URL not in `CORS_ORIGINS`.

**Solution**:
```bash
export CORS_ORIGINS=http://localhost:5173,https://your-domain.com
```

### Cannot connect to database

**Cause**: Wrong connection parameters or database not running.

**Solution**:
```bash
# Verify database is running
psql -h localhost -U apolaki_user -d apolaki_db

# Check connection string format
echo $DATABASE_URL

# Test connection with pg
node -e "const pg = require('pg'); const pool = new pg.Pool({connectionString: process.env.DATABASE_URL}); pool.query('SELECT NOW()').then(r => console.log(r.rows[0])).catch(e => console.error(e.message))"
```

## Related Documentation

- [Deployment Guide](./docs/DEPLOYMENT_GUIDE.md)
- [API Reference](./docs/API_REFERENCE.md)
- [Architecture](./docs/ARCHITECTURE.md)
- [Setup Guide](./docs/SETUP_GUIDE.md)
