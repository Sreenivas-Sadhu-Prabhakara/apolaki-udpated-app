# Apolaki Solar Platform - End-to-End Setup Guide

## Overview

This is a complete, production-ready solar energy management platform with:
- **Frontend:** Vue 3 + Vite + Pinia + Vue Router
- **Backend:** Node.js/Express with Netlify Neon PostgreSQL
- **Database:** Netlify DB (PostgreSQL) with Neon serverless driver

## Project Structure

```
apolaki-updated-app/
├── frontend/                              # Vue 3 frontend application
│   ├── src/
│   │   ├── main.js                       # Application entry point
│   │   ├── App.vue                       # Root component
│   │   ├── router/
│   │   │   └── index.js                  # Vue Router configuration
│   │   ├── stores/
│   │   │   ├── userStore.js              # User authentication store
│   │   │   └── installationStore.js      # Installation management store
│   │   ├── services/
│   │   │   └── api.js                    # Axios API client
│   │   ├── views/
│   │   │   ├── Login.vue                 # Login page
│   │   │   ├── Signup.vue                # Registration page
│   │   │   ├── Dashboard.vue             # Main dashboard
│   │   │   ├── Installations.vue         # Installation management
│   │   │   ├── InstallationDetail.vue    # Installation detail view
│   │   │   ├── Monitoring.vue            # Live monitoring
│   │   │   └── Assessment.vue            # Solar assessment tool
│   │   └── styles/
│   │       └── main.css                  # Global styles
│   ├── vite.config.js                    # Vite configuration
│   ├── index.html                        # HTML template
│   └── package.json                      # Frontend dependencies
│
└── middleware/
    └── netlify-db-service/               # Node.js backend service
        ├── src/
        │   ├── server.js                 # Express server
        │   ├── db.js                     # Netlify Neon database client
        │   └── routes.js                 # API routes
        ├── schema.sql                    # Database schema
        ├── .env.example                  # Environment variables template
        └── package.json                  # Backend dependencies
```

## Getting Started

### Step 1: Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Update .env if needed (default: API_URL=http://localhost:3001/api)

# Start development server
npm run dev
# Frontend will be available at http://localhost:5173
```

### Step 2: Backend Setup

```bash
cd middleware/netlify-db-service

# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Update with your Netlify DB credentials:
# NETLIFY_DATABASE_URL=postgresql://user:password@host/database
# PORT=3001
# NODE_ENV=development

# Start development server
npm run dev
# Backend will be available at http://localhost:3001
```

## Features

### Frontend Features

✅ **Authentication**
- User login/signup with JWT
- Session persistence
- Protected routes

✅ **Dashboard**
- Overview of all installations
- Performance statistics
- Quick access to features

✅ **Installation Management**
- Create, read, update, delete installations
- View installation details
- Track installation status

✅ **Live Monitoring**
- Real-time power output
- Voltage and frequency monitoring
- System health status

✅ **Solar Assessment**
- Free solar feasibility assessment
- Capacity recommendations
- Cost and savings estimates

✅ **User Management**
- User profiles
- Installation associations

### Backend Features

✅ **RESTful API**
- User management endpoints
- Installation CRUD operations
- Monitoring data collection
- Assessment calculations

✅ **Database**
- Netlify Neon PostgreSQL
- 9 data models (users, installations, monitoring, etc.)
- Automatic schema migration

✅ **Authentication**
- JWT token generation and validation
- Password hashing
- Authorization middleware

✅ **Error Handling**
- Comprehensive error responses
- Input validation with Zod
- Request/response logging

## API Endpoints

### Authentication
```
POST   /api/users              # Create user (signup)
POST   /api/users/login        # Login
GET    /api/users/:id          # Get user profile
```

### Installations
```
GET    /api/installations      # List all installations
POST   /api/installations      # Create installation
GET    /api/installations/:id  # Get installation details
PUT    /api/installations/:id  # Update installation
DELETE /api/installations/:id  # Delete installation
```

### Monitoring
```
GET    /api/installations/:id/monitoring      # Get monitoring data
POST   /api/installations/:id/monitoring      # Record monitoring data
```

### Assessment
```
POST   /api/assessment         # Create assessment
GET    /api/assessments        # List assessments
```

## Database Schema

### Users Table
- id (UUID, primary key)
- email (varchar, unique)
- password (varchar, hashed)
- first_name (varchar)
- last_name (varchar)
- role (varchar, default: 'customer')
- active (boolean, default: true)
- created_at, updated_at

### Solar Installations Table
- id (UUID, primary key)
- user_id (UUID, foreign key)
- name (varchar)
- address (varchar)
- capacity (float, in kW)
- panel_count (integer)
- inverter_type (varchar)
- install_date (timestamp)
- status (varchar)
- created_at, updated_at

### Monitoring Data Table
- id (UUID, primary key)
- installation_id (UUID, foreign key)
- timestamp (timestamp)
- power_output (float, in Watts)
- voltage_ac (float, in Volts)
- current_ac (float, in Amps)
- frequency (float, in Hz)
- temperature (float, in Celsius)
- efficiency (float, percentage)
- status (varchar)
- created_at

### Assessment Table
- id (UUID, primary key)
- user_id (UUID, foreign key, nullable)
- address (varchar)
- city (varchar)
- state (varchar)
- roof_area (float, in sq ft)
- annual_usage (float, in kWh)
- recommended_capacity (float, in kW)
- estimated_cost (float)
- created_at, updated_at

Plus: Performance Data, Maintenance Log, Contract, Finance, Marketplace Product tables

## Development Workflow

### Running Locally

Terminal 1 - Backend:
```bash
cd middleware/netlify-db-service
npm run dev
# Server running on http://localhost:3001
```

Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
# App running on http://localhost:5173
```

### Building for Production

Frontend:
```bash
cd frontend
npm run build
# Output: dist/ folder
```

Backend:
```bash
cd middleware/netlify-db-service
npm run build
# Ready for deployment
```

## Deployment

### Deploy Frontend to Netlify

1. Connect GitHub repository
2. Build command: `cd frontend && npm install && npm run build`
3. Publish directory: `frontend/dist`
4. Set environment variable: `VITE_API_URL=https://your-backend-url`

### Deploy Backend to Netlify Functions

1. Set environment variables in Netlify dashboard:
   - `NETLIFY_DATABASE_URL` - Your Neon database URL
   - `JWT_SECRET` - Your JWT signing secret
   - `NODE_ENV` - Set to 'production'

2. Update build configuration in `netlify.toml`

3. Deploy:
   ```bash
   netlify deploy
   ```

## Configuration

### Environment Variables

Frontend (`.env`):
```
VITE_API_URL=http://localhost:3001/api
```

Backend (`.env`):
```
NETLIFY_DATABASE_URL=postgresql://user:password@host/database
PORT=3001
NODE_ENV=development
JWT_SECRET=your-secret-key-here
JWT_EXPIRATION=24h
```

## Testing

### Frontend
```bash
cd frontend
npm run test
```

### Backend
```bash
cd middleware/netlify-db-service
npm run test
```

## Troubleshooting

### Database Connection Failed
- Verify `NETLIFY_DATABASE_URL` in `.env`
- Ensure PostgreSQL/Neon is running
- Check firewall and network settings

### API Requests Failing
- Check backend is running on correct port
- Verify CORS settings in `server.js`
- Check browser console for detailed error messages

### Login/Authentication Issues
- Clear localStorage and refresh
- Check JWT token expiration
- Verify `JWT_SECRET` is set correctly

### Build Errors
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check Node.js version: `node --version` (should be ≥18)
- Clear Vite cache: `rm -rf .vite`

## Performance Optimization

### Frontend
- Code splitting with Vue Router
- Image optimization
- CSS minification
- Asset caching

### Backend
- Connection pooling
- Database query optimization
- Response caching headers
- Rate limiting

### Database
- Indexed queries
- Efficient schema design
- Automatic backups

## Security

✅ JWT authentication  
✅ Password hashing (bcrypt)  
✅ CORS protection  
✅ SQL injection prevention (prepared statements)  
✅ Environment variable protection  
✅ HTTPS in production  
✅ Rate limiting  

## Next Steps

1. Customize branding and colors
2. Add more monitoring features
3. Implement real-time data streaming (WebSockets)
4. Add data export functionality
5. Implement admin dashboard
6. Add email notifications
7. Integrate payment processing
8. Set up CI/CD pipeline

## Support

- Frontend issues: Check browser console and network tab
- Backend issues: Check server logs
- Database issues: Verify connection string and Netlify DB dashboard
- API issues: Test endpoints with Postman or cURL

## License

MIT - See LICENSE file for details

---

**Happy coding! ☀️ Apolaki Solar Platform**
