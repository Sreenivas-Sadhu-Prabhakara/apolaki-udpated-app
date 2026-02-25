# Netlify DB Service - Setup Guide

## Overview

The Apolaki Solar Platform uses **Netlify Neon** (PostgreSQL) as its primary database with a modern Node.js/Express API service using the `@netlify/neon` package for SQL queries.

## What is Netlify Neon?

Netlify Neon is a serverless PostgreSQL database that integrates seamlessly with Netlify deployments. It provides:
- Zero-configuration PostgreSQL database
- Automatic backups and replication
- Connection pooling
- Real-time monitoring
- Scalable performance

## Project Structure

```
middleware/netlify-db-service/
├── src/
│   ├── server.js              # Express server entry point
│   ├── db.js                  # Database client & operations
│   └── routes.js              # API route definitions
├── schema.sql                 # Database schema
├── package.json               # Node dependencies
├── .env.example               # Environment variables template
├── SETUP.md                   # Setup instructions (this file)
└── README.md                  # API documentation
```

## Installation & Setup

### 1. Install Dependencies

```bash
cd middleware/netlify-db-service
npm install
```

### 2. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your database credentials:

```env
NETLIFY_DATABASE_URL=postgresql://user:password@host:5432/apolaki_solar
PORT=3001
NODE_ENV=development
```

### 3. Create Database Schema

Connect to your Netlify Neon database and run the schema:

```bash
# Using psql
psql $NETLIFY_DATABASE_URL < schema.sql

# Or using a Netlify Neon dashboard
# Copy the contents of schema.sql into the SQL editor
```

### 4. Start the Server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

Server will start on `http://localhost:3001`

## Usage Examples

### Using the SQL Query Builder

All database operations use the `@netlify/neon` package:

```javascript
import { neon } from '@netlify/neon';

const sql = neon(); // Automatically uses NETLIFY_DATABASE_URL

// Simple query
const [post] = await sql`SELECT * FROM posts WHERE id = ${postId}`;

// Multiple results
const posts = await sql`SELECT * FROM posts`;

// With parameters (safe from SQL injection)
const user = await sql`SELECT * FROM users WHERE email = ${email}`;

// Insert
const result = await sql`
  INSERT INTO users (email, password_hash, first_name, last_name)
  VALUES (${email}, ${hash}, ${firstName}, ${lastName})
  RETURNING *
`;

// Update
const updated = await sql`
  UPDATE users 
  SET active = ${true}
  WHERE id = ${userId}
  RETURNING *
`;

// Delete
await sql`DELETE FROM users WHERE id = ${userId}`;
```

### Example: Creating a User Entry

```javascript
import { users } from './db.js';

// Create a new user
const newUser = await users.create({
  email: 'john@example.com',
  passwordHash: 'hashed_password',
  firstName: 'John',
  lastName: 'Doe',
  role: 'customer'
});

console.log(newUser);
// Output: { id: 'uuid', email: 'john@example.com', ... }
```

### Example: Recording Monitoring Data

```javascript
import { monitoringData } from './db.js';

// Record real-time monitoring data
const data = await monitoringData.create({
  installationId: 'installation-uuid',
  powerOutput: 5500,
  voltageAc: 240,
  currentAc: 22.9,
  frequency: 60,
  temperature: 35.2,
  efficiency: 95.2,
  status: 'normal'
});

console.log(data);
// Output: { id: 'uuid', installation_id: 'uuid', power_output: 5500, ... }
```

### Example: Querying with Date Range

```javascript
// Get monitoring data for a specific date range
const data = await monitoringData.getByDateRange(
  installationId,
  new Date('2024-01-01'),
  new Date('2024-01-31')
);
```

## API Endpoints

### Health Check
```
GET /health
```

### Users
```
POST   /api/users                    - Create user
GET    /api/users                    - Get all users
GET    /api/users/:id                - Get user by ID
PUT    /api/users/:id                - Update user
```

### Solar Installations
```
POST   /api/installations                              - Create installation
GET    /api/installations/:id                          - Get installation
GET    /api/users/:userId/installations                - Get user's installations
PUT    /api/installations/:id                          - Update installation
```

### Monitoring Data
```
POST   /api/installations/:installationId/monitoring   - Record monitoring data
GET    /api/installations/:installationId/monitoring   - Get monitoring data
```

### Performance Data
```
POST   /api/installations/:installationId/performance  - Record performance data
GET    /api/installations/:installationId/performance  - Get performance metrics
```

### Maintenance
```
POST   /api/installations/:installationId/maintenance  - Create maintenance log
GET    /api/installations/:installationId/maintenance  - Get maintenance logs
```

### Contracts
```
POST   /api/contracts                                  - Create contract
GET    /api/users/:userId/contracts                    - Get user contracts
```

### Assessments
```
POST   /api/assessments                                - Create assessment
GET    /api/assessments/:id                            - Get assessment
GET    /api/users/:userId/assessments                  - Get user assessments
```

### Marketplace
```
GET    /api/marketplace/products                       - Get all products
GET    /api/marketplace/products/:id                   - Get product
GET    /api/marketplace/products/category/:category    - Get by category
```

### Finance
```
POST   /api/finance/transactions                       - Create transaction
GET    /api/users/:userId/finance/transactions         - Get transactions
GET    /api/users/:userId/finance/summary              - Get summary
```

## Database Schema Overview

### Tables

- **users** - User accounts
- **solar_installations** - Solar systems
- **monitoring_data** - Real-time monitoring (1 entry per reading)
- **performance_data** - Daily performance aggregates
- **maintenance_log** - Service records
- **contracts** - Service contracts
- **assessments** - Solar assessments
- **marketplace_products** - Marketplace items
- **finance** - Financial transactions

All tables include:
- UUID primary keys
- Automatic timestamps (created_at, updated_at)
- Foreign key constraints
- Indexes for performance

## Example Request/Response

### Create User

**Request:**
```bash
curl -X POST http://localhost:3001/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "passwordHash": "hashed_password",
    "firstName": "John",
    "lastName": "Doe",
    "role": "customer"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "customer",
    "active": true,
    "created_at": "2024-02-26T12:34:56.789Z"
  }
}
```

### Record Monitoring Data

**Request:**
```bash
curl -X POST http://localhost:3001/api/installations/{installationId}/monitoring \
  -H "Content-Type: application/json" \
  -d '{
    "powerOutput": 5500,
    "voltageAc": 240,
    "currentAc": 22.9,
    "frequency": 60,
    "temperature": 35.2,
    "efficiency": 95.2,
    "status": "normal"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Monitoring data recorded",
  "data": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "installation_id": "550e8400-e29b-41d4-a716-446655440000",
    "power_output": 5500,
    "voltage_ac": 240,
    "current_ac": 22.9,
    "frequency": 60,
    "temperature": 35.2,
    "efficiency": 95.2,
    "status": "normal",
    "timestamp": "2024-02-26T12:34:56.789Z"
  }
}
```

## Deployment to Netlify

### 1. Connect to Netlify

Push code to GitHub:

```bash
git add .
git commit -m "Add Netlify DB service"
git push origin main
```

Connect repository to Netlify dashboard.

### 2. Set Environment Variables

In Netlify dashboard under **Site Settings > Build & Deploy > Environment**:

```
NETLIFY_DATABASE_URL=your_neon_connection_string
NODE_ENV=production
PORT=3001
```

### 3. Deploy

Netlify automatically deploys when you push to main branch.

## Connecting to Netlify Neon

### Create a Neon Database

1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Select your site
3. Go to **Integrations > Neon**
4. Click **Connect**
5. Create a new Neon database
6. Copy the `NETLIFY_DATABASE_URL`

### Add to Environment

Set the `NETLIFY_DATABASE_URL` in your `.env` file:

```
NETLIFY_DATABASE_URL=postgresql://user:password@host:5432/apolaki_solar
```

## SQL Examples

### Get all installations for a user with recent monitoring data

```javascript
const sql = neon();

const result = await sql`
  SELECT 
    i.id,
    i.name,
    i.capacity,
    i.status,
    m.power_output,
    m.timestamp
  FROM solar_installations i
  LEFT JOIN monitoring_data m ON i.id = m.installation_id
  WHERE i.user_id = ${userId}
  AND m.timestamp = (
    SELECT MAX(timestamp) 
    FROM monitoring_data 
    WHERE installation_id = i.id
  )
  ORDER BY i.created_at DESC
`;
```

### Get performance summary for a date range

```javascript
const result = await sql`
  SELECT 
    DATE(date) as day,
    SUM(energy_generated) as total_energy,
    AVG(avg_efficiency) as avg_efficiency,
    COUNT(*) as readings
  FROM performance_data
  WHERE installation_id = ${installationId}
  AND date BETWEEN ${startDate} AND ${endDate}
  GROUP BY DATE(date)
  ORDER BY day DESC
`;
```

### Get maintenance statistics

```javascript
const result = await sql`
  SELECT 
    maintenance_type,
    COUNT(*) as count,
    AVG(cost) as avg_cost,
    MAX(performed_date) as last_performed
  FROM maintenance_log
  WHERE installation_id = ${installationId}
  GROUP BY maintenance_type
`;
```

## Troubleshooting

### Connection Refused

**Problem:** `Error: connect ECONNREFUSED`

**Solution:**
```bash
# Check environment variable
echo $NETLIFY_DATABASE_URL

# Test connection
psql $NETLIFY_DATABASE_URL -c "SELECT 1"
```

### Authentication Failed

**Problem:** `Error: password authentication failed`

**Solution:**
- Verify credentials in `.env`
- Check password has no special characters that need escaping
- Ensure database user has correct permissions

### Schema Not Applied

**Problem:** Table errors when running queries

**Solution:**
```bash
# Run schema again
psql $NETLIFY_DATABASE_URL < schema.sql

# Or check which tables exist
psql $NETLIFY_DATABASE_URL -c "\dt"
```

### Port Already in Use

**Problem:** `Error: listen EADDRINUSE :::3001`

**Solution:**
```bash
# Kill process on port 3001
lsof -ti:3001 | xargs kill -9

# Or use different port
PORT=3002 npm run dev
```

## Best Practices

1. **Always use parameterized queries** - Prevents SQL injection
   ```javascript
   const user = await sql`SELECT * FROM users WHERE id = ${id}`;
   ```

2. **Handle errors properly** - Use try/catch blocks
   ```javascript
   try {
     const user = await users.create(userData);
   } catch (error) {
     console.error('Database error:', error);
     // Return appropriate HTTP error
   }
   ```

3. **Use transactions for related operations** - Ensures data consistency
4. **Index frequently queried columns** - Already done in schema.sql
5. **Limit query results** - Use LIMIT clause to avoid loading too much data
6. **Monitor connection pool** - Set appropriate min/max connections

## Performance Tips

- Monitoring data can grow quickly - consider archiving old data
- Use indexes on user_id, installation_id, and timestamp
- Aggregate performance data daily to reduce queries
- Use connection pooling (Neon does this automatically)

## Additional Resources

- [Netlify Neon Docs](https://docs.netlify.com/datastore/overview/)
- [@netlify/neon Package](https://www.npmjs.com/package/@netlify/neon)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Express.js Guide](https://expressjs.com/)

## Support

For issues:
1. Check error messages in terminal/logs
2. Verify environment variables are set
3. Test database connection directly with psql
4. Check Netlify dashboard for service status

---

**Status:** ✅ Ready for deployment  
**Last Updated:** February 26, 2024
