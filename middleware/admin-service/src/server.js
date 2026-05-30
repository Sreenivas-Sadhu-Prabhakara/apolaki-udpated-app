/**
 * Apolaki Admin Control Plane — Main Server
 * Runs on PORT 3002 by default.
 */

import dotenv from 'dotenv';
dotenv.config();

import cors from 'cors';
import express from 'express';
import { ensureSchema, getPool } from './db.js';
import { ipAllowlist, standardLimiter } from './middleware/auth.js';
import authRoutes from './routes/auth.js';
import auditLogRoutes from './routes/auditLogs.js';
import breakGlassRoutes from './routes/breakGlass.js';
import mfaRoutes from './routes/mfa.js';
import userRoutes from './routes/users.js';

const app = express();
const PORT = process.env.PORT || 3002;

// ─── Middleware ───────────────────────────────────────────────────────────────

app.disable('x-powered-by');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-MFA-Token', 'X-Internal-Token'],
}));

// Apply IP allowlist globally (no-op if ADMIN_ALLOWED_CIDRS not set)
app.use(ipAllowlist);

// Apply standard rate limit globally
app.use(standardLimiter);

// Request logging
app.use((req, res, next) => {
  console.log(`[admin-service] ${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// ─── Health & Readiness ───────────────────────────────────────────────────────

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'admin-service',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.get('/ready', async (req, res) => {
  try {
    await getPool().query('SELECT 1');
    res.json({ status: 'ready', db: 'connected' });
  } catch (e) {
    res.status(503).json({ status: 'not ready', db: 'disconnected', error: e.message });
  }
});

// ─── Internal audit ingest (service-to-service) ───────────────────────────────
// Mounted separately so it does NOT need admin JWT — uses internal service token instead
import { authenticateInternal } from './middleware/auth.js';
import { auditEvents } from './db.js';

app.post('/internal/audit', authenticateInternal, async (req, res) => {
  try {
    const event = await auditEvents.create(req.body);
    res.status(201).json({ success: true, data: event });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ─── Admin API Routes ─────────────────────────────────────────────────────────

app.use('/api/admin/auth', authRoutes);
app.use('/api/admin/users', userRoutes);
app.use('/api/admin/audit-logs', auditLogRoutes);
app.use('/api/admin/break-glass', breakGlassRoutes);
app.use('/api/admin/mfa', mfaRoutes);

// ─── 404 / Error handlers ─────────────────────────────────────────────────────

app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Not found', path: req.path });
});

app.use((err, req, res, next) => {
  console.error('[admin-service] Error:', err);
  res.status(500).json({ success: false, error: err.message || 'Internal server error' });
});

// ─── Start ────────────────────────────────────────────────────────────────────

ensureSchema()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`
╔══════════════════════════════════════════════════════════╗
║   Apolaki Admin Control Plane                            ║
║   Service running on http://localhost:${PORT}            ║
║   Health:   GET /health                                  ║
║   Readiness: GET /ready                                  ║
║   Admin API: /api/admin/*                                ║
╚══════════════════════════════════════════════════════════╝
      `);
    });
  })
  .catch(err => {
    console.error('Failed to start admin-service:', err.message);
    process.exit(1);
  });

export default app;
