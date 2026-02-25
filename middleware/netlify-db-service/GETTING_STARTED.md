# Netlify DB Service - Getting Started Guide

## Overview

The Netlify DB Service is a Node.js/Express backend API that uses **Netlify's native Neon PostgreSQL database** with the `@netlify/neon` client library for the Apolaki Solar Platform.

## Quick Start (5 minutes)

### 1. Setup Environment

```bash
cd middleware/netlify-db-service

# Copy environment template
cp .env.example .env

# Add your Netlify database URL
# NETLIFY_DATABASE_URL=postgresql://user:password@host/database
```

### 2. Start the Server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

### 3. Test the API

```bash
# Health check
curl http://localhost:3001/health

# Get all users
curl http://localhost:3001/api/users

# Create a user
curl -X POST http://localhost:3001/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "passwordHash": "hashed_password",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

## Database Operations

### Using the Database Module

All database operations are in `src/db.js`:

```javascript
import { users, solarInstallations, monitoringData } from './db.js';

// Create user
const user = await users.create({
  email: 'user@example.com',
  passwordHash: 'hashed_password',
  firstName: 'John',
  lastName: 'Doe'
});

// Get user by ID
const user = await users.getById(userId);

// Update user
const updated = await users.update(userId, {
  firstName: 'Jane'
});

// Delete user
await users.delete(userId);
```

### Direct SQL Queries

```javascript
import { sql } from './db.js';

// Execute raw SQL
const results = await sql`
  SELECT * FROM users WHERE email = ${email}
`;

// Insert data
const [user] = await sql`
  INSERT INTO users (email, password_hash, first_name, last_name)
  VALUES (${email}, ${passwordHash}, ${firstName}, ${lastName})
  RETURNING *
`;

// Update data
await sql`
  UPDATE users SET active = true WHERE id = ${userId}
`;

// Delete data
await sql`
  DELETE FROM users WHERE id = ${userId}
`;
```

## API Endpoints

### Users
- `POST /api/users` - Create user
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Solar Installations
- `POST /api/installations` - Create installation
- `GET /api/installations` - Get all installations
- `GET /api/installations/:id` - Get installation
- `GET /api/users/:userId/installations` - Get user's installations
- `PUT /api/installations/:id` - Update installation
- `DELETE /api/installations/:id` - Delete installation

### Monitoring Data
- `POST /api/monitoring` - Record monitoring data
- `GET /api/installations/:id/monitoring` - Get monitoring data
- `GET /api/monitoring/:id` - Get specific record

### Performance Data
- `POST /api/performance` - Record performance data
- `GET /api/installations/:id/performance` - Get performance data
- `GET /api/performance/:id` - Get specific record

### Maintenance Log
- `POST /api/maintenance` - Create maintenance entry
- `GET /api/installations/:id/maintenance` - Get maintenance log
- `GET /api/maintenance/:id` - Get specific entry
- `PUT /api/maintenance/:id` - Update entry
- `DELETE /api/maintenance/:id` - Delete entry

### Contracts
- `POST /api/contracts` - Create contract
- `GET /api/contracts` - Get all contracts
- `GET /api/contracts/:id` - Get contract
- `GET /api/users/:userId/contracts` - Get user's contracts
- `PUT /api/contracts/:id` - Update contract
- `DELETE /api/contracts/:id` - Delete contract

### Assessments
- `POST /api/assessments` - Create assessment
- `GET /api/assessments` - Get all assessments
- `GET /api/assessments/:id` - Get assessment
- `PUT /api/assessments/:id` - Update assessment
- `DELETE /api/assessments/:id` - Delete assessment

### Finance
- `POST /api/finance` - Record transaction
- `GET /api/finance` - Get all transactions
- `GET /api/finance/:id` - Get transaction
- `GET /api/users/:userId/finance` - Get user's transactions
- `PUT /api/finance/:id` - Update transaction

### Marketplace
- `POST /api/marketplace` - Create product
- `GET /api/marketplace` - Get all products
- `GET /api/marketplace/:id` - Get product
- `PUT /api/marketplace/:id` - Update product
- `DELETE /api/marketplace/:id` - Delete product

### Health & System
- `GET /health` - Health check
- `GET /` - API info

## Database Schema

### Tables (9)
1. **users** - User accounts
2. **solar_installations** - Solar systems
3. **monitoring_data** - Real-time monitoring
4. **performance_data** - Performance metrics
5. **maintenance_log** - Service records
6. **contracts** - Service contracts
7. **assessments** - Solar assessments
8. **marketplace** - Marketplace products
9. **finance** - Financial records

See `schema.sql` for complete schema.

## Environment Variables

```env
# Database
NETLIFY_DATABASE_URL=postgresql://user:password@host/database

# Server
PORT=3001
NODE_ENV=development

# Optional
DEBUG=true
LOG_LEVEL=info
```

## File Structure

```
netlify-db-service/
├── src/
│   ├── server.js       # Express app & server setup
│   ├── routes.js       # API route handlers
│   └── db.js          # Database operations
├── schema.sql         # Database schema
├── package.json       # Dependencies & scripts
├── .env.example       # Environment template
├── README.md          # Main documentation
└── SETUP.md          # Setup instructions
```

## Development

### Install Dependencies
```bash
npm install
npm install -D nodemon
```

### Run in Development Mode
```bash
npm run dev
```

This uses nodemon to auto-reload on file changes.

### Run in Production
```bash
npm start
```

## Connecting to Netlify

### 1. Create Netlify Database

In Netlify dashboard:
1. Go to **Databases** section
2. Click **Create Database**
3. Choose **PostgreSQL**
4. Copy the connection string

### 2. Add to Environment

In Netlify dashboard:
1. Go to **Site Settings > Build & Deploy > Environment**
2. Add `NETLIFY_DATABASE_URL` with your connection string
3. Save

### 3. Deploy

```bash
git add .
git commit -m "Add Netlify DB Service"
git push origin main
```

Netlify will automatically deploy and use the environment variable.

## Running Database Migrations

The schema is defined in `schema.sql`. To apply it:

```bash
# Using psql
psql $NETLIFY_DATABASE_URL < schema.sql

# Or through Netlify Dashboard
# 1. Go to Database Console
# 2. Paste schema.sql content
# 3. Run
```

## Example: Creating a User

### Using cURL

```bash
curl -X POST http://localhost:3001/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "solar@example.com",
    "passwordHash": "$2a$10$...",
    "firstName": "Solar",
    "lastName": "User",
    "role": "customer"
  }'
```

### Response
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "solar@example.com",
    "first_name": "Solar",
    "last_name": "User",
    "role": "customer",
    "active": true,
    "created_at": "2024-02-26T10:30:00Z"
  }
}
```

## Example: Recording Monitoring Data

```bash
curl -X POST http://localhost:3001/api/monitoring \
  -H "Content-Type: application/json" \
  -d '{
    "installationId": "550e8400-e29b-41d4-a716-446655440001",
    "powerOutput": 5250.50,
    "voltageAc": 240.5,
    "currentAc": 21.8,
    "frequency": 60.0,
    "temperature": 45.2,
    "efficiency": 95.5,
    "status": "normal"
  }'
```

## Troubleshooting

### Connection Error

**Error:** `Connection refused`

**Solution:**
```bash
# Check NETLIFY_DATABASE_URL is set
echo $NETLIFY_DATABASE_URL

# Test connection
psql $NETLIFY_DATABASE_URL -c "SELECT 1"
```

### Database Not Found

**Error:** `database "name" does not exist`

**Solution:**
1. Verify database exists in Netlify
2. Check connection string format
3. Ensure user has permissions

### Port Already in Use

**Error:** `listen EADDRINUSE: address already in use :::3001`

**Solution:**
```bash
# Use different port
PORT=3002 npm start

# Or kill process on port 3001
lsof -i :3001
kill -9 <PID>
```

## Next Steps

1. ✅ Set up environment variables
2. ✅ Start the server
3. ✅ Test API endpoints
4. ✅ Create users and installations
5. ✅ Record monitoring data
6. ✅ Deploy to Netlify

## Resources

- **Express.js:** https://expressjs.com
- **Netlify Neon:** https://docs.netlify.com/datastore/overview/
- **PostgreSQL:** https://www.postgresql.org/docs/
- **Node.js:** https://nodejs.org

---

**Ready to use Netlify DB with your Apolaki Solar Platform! 🚀**
