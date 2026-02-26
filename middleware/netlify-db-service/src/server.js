/**
 * Apolaki Solar Platform - Netlify DB Service
 * Express server using Netlify Neon database
 * Configuration is read from environment variables via ConfigManager
 */

// Load environment variables FIRST, before anything else
import dotenv from 'dotenv';
dotenv.config();

// Import ConfigManager - centralizes all configuration
import { configManager } from '../../config/config.manager.js';

// Initialize configuration from environment variables
configManager.initialize();

// Validate configuration - throws errors if invalid
try {
  configManager.validate();
} catch (error) {
  console.error('❌ Configuration validation failed:', error.message);
  process.exit(1);
}

// Log safe configuration info (no secrets)
console.log('Configuration:', configManager.logConfig());

// Initialize database connection before importing routes
import { initializeDatabase } from './db.js';
initializeDatabase();

import cors from 'cors';
import express from 'express';
import session from 'express-session';
import passport from 'passport';
import { initializePassport } from './auth/passport.js';
import routes from './routes.js';
import authRoutes from './routes/auth.js';

const app = express();

// Get configuration values
const config = configManager.getAll();
const PORT = config.app.port;
const corsOptions = {
  origin: config.cors.origin,
  credentials: config.cors.credentials,
  methods: config.cors.methods,
  allowedHeaders: config.cors.allowedHeaders
};

// Initialize Passport strategies
initializePassport();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration
app.use(cors(corsOptions));

// Session configuration
const sessionConfig = config.session;
app.use(
  session({
    secret: sessionConfig.secret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: sessionConfig.secure,
      httpOnly: sessionConfig.httpOnly,
      sameSite: sessionConfig.sameSite,
      maxAge: sessionConfig.maxAge
    }
  })
);

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Auth routes
app.use('/api/auth', authRoutes);

// API routes
app.use('/api', routes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Apolaki Solar Platform - Netlify DB Service',
    version: '2.0.0',
    description: 'Backend API service with OAuth authentication using Netlify Neon database',
    authentication: {
      local: {
        signup: 'POST /api/auth/signup',
        login: 'POST /api/auth/login',
        logout: 'POST /api/auth/logout',
        refresh: 'POST /api/auth/refresh'
      },
      oauth: {
        google: {
          authorize: 'GET /api/auth/google',
          callback: 'GET /api/auth/google/callback'
        },
        facebook: {
          authorize: 'GET /api/auth/facebook',
          callback: 'GET /api/auth/facebook/callback'
        },
        instagram: {
          authorize: 'GET /api/auth/instagram',
          callback: 'GET /api/auth/instagram/callback'
        },
        viber: {
          authorize: 'GET /api/auth/viber',
          callback: 'GET /api/auth/viber/callback'
        },
        telegram: {
          authorize: 'GET /api/auth/telegram',
          callback: 'GET /api/auth/telegram/callback'
        }
      },
      profile: {
        getProfile: 'GET /api/auth/me',
        getProviders: 'GET /api/auth/providers',
        disconnectProvider: 'DELETE /api/auth/providers/:provider'
      }
    },
    endpoints: {
      health: 'GET /health',
      users: {
        create: 'POST /api/users',
        list: 'GET /api/users',
        get: 'GET /api/users/:id',
        update: 'PUT /api/users/:id'
      },
      installations: {
        create: 'POST /api/installations',
        get: 'GET /api/installations/:id',
        listByUser: 'GET /api/users/:userId/installations',
        update: 'PUT /api/installations/:id'
      },
      monitoring: {
        record: 'POST /api/installations/:installationId/monitoring',
        list: 'GET /api/installations/:installationId/monitoring'
      },
      performance: {
        record: 'POST /api/installations/:installationId/performance',
        list: 'GET /api/installations/:installationId/performance'
      },
      maintenance: {
        create: 'POST /api/installations/:installationId/maintenance',
        list: 'GET /api/installations/:installationId/maintenance'
      },
      contracts: {
        create: 'POST /api/contracts',
        listByUser: 'GET /api/users/:userId/contracts'
      },
      assessments: {
        create: 'POST /api/assessments',
        get: 'GET /api/assessments/:id',
        listByUser: 'GET /api/users/:userId/assessments'
      },
      marketplace: {
        listProducts: 'GET /api/marketplace/products',
        getProduct: 'GET /api/marketplace/products/:id',
        listByCategory: 'GET /api/marketplace/products/category/:category'
      },
      finance: {
        createTransaction: 'POST /api/finance/transactions',
        listTransactions: 'GET /api/users/:userId/finance/transactions',
        summary: 'GET /api/users/:userId/finance/summary'
      }
    },
    database: 'Netlify Neon (PostgreSQL)',
    documentation: 'See README.md and SETUP.md for detailed documentation'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.path,
    method: req.method
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║   Apolaki Solar Platform - Netlify DB Service          ║
║   Server running on http://localhost:${PORT}           ║
║   Database: Netlify Neon (PostgreSQL)                  ║
║   Status: Ready                                        ║
╚════════════════════════════════════════════════════════╝
  `);
});

export default app;
