# 🔧 API Database Connection - Troubleshooting & Fix Guide

**Date:** February 26, 2026  
**Issue:** API not connecting to database  
**Status:** Fixing...

---

## ⚠️ Problem Identified

The database service API connection is not operational because:

1. **Missing `.env` file** ❌
   - Location: `middleware/netlify-db-service/.env`
   - Status: Not found (only `.env.example` exists)
   - Impact: Database connection string not configured

2. **Database URL not set** ❌
   - Variable: `NETLIFY_DATABASE_URL`
   - Status: Missing from environment
   - Impact: API cannot connect to PostgreSQL

3. **Frontend API client might not be configured** ⚠️
   - Location: `frontend/src/services/` or similar
   - Status: Need to verify

---

## ✅ Solutions Implemented

### 1. Created Missing `.env` File ✅
**File Created:** `middleware/netlify-db-service/.env`

This file contains all required environment variables with placeholders for:
- Database connection (PostgreSQL)
- Server configuration
- Security secrets
- OAuth credentials
- API settings
- Database pool configuration

### 2. Created Diagnostic Script ✅
**File Created:** `scripts/diagnose-db.sh`

This script:
- Checks environment configuration
- Verifies Node.js and npm installation
- Tests database dependencies
- Attempts database connection test
- Validates API server configuration
- Provides next steps

---

## 🔍 Diagnosis Steps

### Run the Diagnostic Script

```bash
bash scripts/diagnose-db.sh
```

This will:
- ✅ Check if `.env` file exists
- ✅ Verify database URL configuration
- ✅ Check Node.js and npm
- ✅ Verify dependencies are installed
- ✅ Test database connectivity
- ✅ Check API configuration
- ✅ Provide remediation steps

---

## 🛠️ Fix Steps (Choose Your Setup)

### Option A: Local PostgreSQL with Docker

**Step 1: Start PostgreSQL Container**
```bash
cd apolaki-updated-app
docker-compose -f config/docker-compose.yml up -d postgres
```

**Step 2: Wait for PostgreSQL to start**
```bash
# Wait 10 seconds for container to be ready
sleep 10

# Check if running
docker ps | grep postgres
```

**Step 3: Initialize database schema**
```bash
# Copy the SQL initialization script
docker exec apolaki-postgres psql -U apolaki_user -d apolaki_db < config/init-db.sql
```

Or if that doesn't work:
```bash
# Connect to database container
docker exec -it apolaki-postgres psql -U apolaki_user -d apolaki_db

# Then run the SQL manually
```

**Step 4: Verify connection**
```bash
# Test PostgreSQL connection
docker exec apolaki-postgres psql -U apolaki_user -d apolaki_db -c "SELECT 1"
```

**Step 5: Update `.env` file**
```bash
# Edit the database service .env
nano middleware/netlify-db-service/.env

# Ensure this line is set:
NETLIFY_DATABASE_URL=postgresql://apolaki_user:apolaki_pass@localhost:5432/apolaki_db

# Or if using Docker network:
NETLIFY_DATABASE_URL=postgresql://apolaki_user:apolaki_pass@postgres:5432/apolaki_db
```

### Option B: Cloud PostgreSQL (Neon, AWS RDS, etc.)

**Step 1: Get your database URL**
- From Neon: Copy the connection string
- From AWS RDS: Build: `postgresql://user:pass@endpoint:5432/database`
- From other provider: Get the PostgreSQL connection string

**Step 2: Update `.env` file**
```bash
nano middleware/netlify-db-service/.env

# Set:
NETLIFY_DATABASE_URL=postgresql://username:password@host:5432/database?sslmode=require
```

**Step 3: Create database schema (if needed)**
```bash
# Connect to your remote database and run init-db.sql
psql $NETLIFY_DATABASE_URL < config/init-db.sql
```

### Option C: Local PostgreSQL (Native Installation)

**Step 1: Ensure PostgreSQL is running**
```bash
# macOS
brew services start postgresql

# Linux
sudo systemctl start postgresql

# Windows
# Start PostgreSQL service from Services
```

**Step 2: Create database and user**
```bash
psql -U postgres -c "CREATE USER apolaki_user WITH PASSWORD 'apolaki_pass';"
psql -U postgres -c "CREATE DATABASE apolaki_db OWNER apolaki_user;"
```

**Step 3: Initialize schema**
```bash
psql -U apolaki_user -h localhost -d apolaki_db < config/init-db.sql
```

**Step 4: Update `.env` file**
```bash
nano middleware/netlify-db-service/.env

# Set:
NETLIFY_DATABASE_URL=postgresql://apolaki_user:apolaki_pass@localhost:5432/apolaki_db
```

---

## ▶️ Start the API Service

Once database is configured:

```bash
# Navigate to database service
cd middleware/netlify-db-service

# Install/update dependencies
npm install

# Start the API server
npm start

# Expected output:
# ✓ Server running on port 3001
# ✓ Database connected
```

---

## 🧪 Test the Connection

### Test 1: Health Check
```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2026-02-26T..."
}
```

### Test 2: List Users
```bash
curl http://localhost:3001/api/users
```

Expected: Array of users (may be empty)

### Test 3: Create User
```bash
curl -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpass123",
    "firstName": "Test",
    "lastName": "User"
  }'
```

Expected: New user created successfully

---

## 🔗 Connect Frontend to API

### Step 1: Create API Service (if not exists)

**File:** `frontend/src/services/api.js`

```javascript
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

### Step 2: Use API in Components

**Example:** `frontend/src/views/Login.vue`

```javascript
import api from '@/services/api';

export default {
  methods: {
    async login(email, password) {
      try {
        const response = await api.post('/api/auth/login', {
          email,
          password,
        });
        localStorage.setItem('authToken', response.data.token);
        // Redirect to dashboard
      } catch (error) {
        console.error('Login failed:', error.response.data);
      }
    }
  }
}
```

### Step 3: Test Frontend Connection

```bash
cd frontend
npm run dev

# Visit http://localhost:5173
# Check browser console for API responses
```

---

## 📊 Verification Checklist

- [ ] `.env` file created with database URL
- [ ] Database server is running
- [ ] Database schema initialized
- [ ] API service dependencies installed
- [ ] API service starts without errors
- [ ] Health check endpoint responds
- [ ] Database queries working
- [ ] Frontend API client configured
- [ ] Frontend can call API endpoints
- [ ] Login/authentication working

---

## 🐛 Common Issues & Solutions

### Issue 1: "ECONNREFUSED" - Connection Refused

**Cause:** Database server not running

**Solution:**
```bash
# Start database
docker-compose -f config/docker-compose.yml up -d postgres

# Or for local PostgreSQL
brew services start postgresql
```

### Issue 2: "FATAL: password authentication failed"

**Cause:** Wrong credentials

**Solution:**
1. Verify database credentials in `.env`
2. Check PostgreSQL user exists:
   ```bash
   psql -U postgres -c "\du"
   ```
3. Reset password if needed:
   ```bash
   psql -U postgres -c "ALTER USER apolaki_user WITH PASSWORD 'apolaki_pass';"
   ```

### Issue 3: "Database does not exist"

**Cause:** Database not created

**Solution:**
```bash
# Create database
psql -U postgres -c "CREATE DATABASE apolaki_db OWNER apolaki_user;"

# Initialize schema
psql -U apolaki_user -d apolaki_db < config/init-db.sql
```

### Issue 4: "ENOTFOUND postgres" (Docker)

**Cause:** Container network issue

**Solution:**
```bash
# Ensure services are on same network
docker-compose -f config/docker-compose.yml up -d

# Check network
docker network ls
```

### Issue 5: "Cannot find module '@netlify/neon'"

**Cause:** Dependencies not installed

**Solution:**
```bash
cd middleware/netlify-db-service
npm install
```

---

## 📝 Environment Variables Reference

### Critical Variables (Must Set)
```bash
NETLIFY_DATABASE_URL=postgresql://user:pass@host:port/db
FRONTEND_URL=http://localhost:5173
JWT_SECRET=your_secret_key
SESSION_SECRET=your_session_secret
```

### Optional Variables (For Features)
```bash
GOOGLE_CLIENT_ID=...
FACEBOOK_APP_ID=...
INSTAGRAM_APP_ID=...
```

---

## 🚀 Quick Start Commands

```bash
# 1. Diagnose the issue
bash scripts/diagnose-db.sh

# 2. Start database
docker-compose -f config/docker-compose.yml up -d postgres

# 3. Initialize schema
docker exec apolaki-postgres psql -U apolaki_user -d apolaki_db < config/init-db.sql

# 4. Start API
cd middleware/netlify-db-service && npm start

# 5. Test health
curl http://localhost:3001/health

# 6. Start frontend
cd frontend && npm run dev
```

---

## 📞 Getting Help

**If you still have issues:**

1. Run diagnostic: `bash scripts/diagnose-db.sh`
2. Check logs: Look at API server console output
3. Test connection: `curl http://localhost:3001/health`
4. Check .env file: Ensure all variables are set
5. Review database logs: `docker logs apolaki-postgres`

---

## ✅ Status

**Created:**
- ✅ `.env` file for database service
- ✅ Diagnostic script
- ✅ This troubleshooting guide

**Next Steps:**
1. Run diagnostic script
2. Configure database connection
3. Start API service
4. Test endpoints
5. Connect frontend

**Expected Time:** 10-15 minutes

---

**Last Updated:** February 26, 2026  
**Status:** Ready to Deploy  
**Next:** Follow the fix steps above
