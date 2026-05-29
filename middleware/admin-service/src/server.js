import crypto from 'node:crypto';
import dotenv from 'dotenv';
dotenv.config();

import cors from 'cors';
import cookieParser from 'cookie-parser';
import express from 'express';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import {
  ASSIGNABLE_ROLES,
  authenticateAdmin,
  clearAdminSessionCookie,
  createAdminTokens,
  createMfaToken,
  generateTotpSecret,
  getAdminScope,
  normalizeRole,
  requireAdminScope,
  requireMfaToken,
  setAdminSessionCookie,
  totpUri,
  verifyPassword,
  verifyTotp
} from './auth.js';
import {
  adminSessions,
  auditEvents,
  breakGlassSessions,
  checkReady,
  ensureAdminSchema,
  hashToken,
  pool,
  query,
  users
} from './db.js';
import { getClientIp, ipAllowlist, rateLimit } from './security.js';

const app = express();
const PORT = Number.parseInt(process.env.PORT || '3002', 10);
const FRONTEND_ORIGINS = (process.env.CORS_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);
const ADMIN_REFRESH_SECRET = process.env.ADMIN_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET || 'dev-admin-refresh-secret-change-in-production';
const INTERNAL_AUDIT_SECRET = process.env.ADMIN_INTERNAL_AUDIT_SECRET || 'dev-internal-audit-secret-change-in-production';
const BREAK_GLASS_DURATION_MINUTES = Number.parseInt(process.env.BREAK_GLASS_DURATION_MINUTES || '60', 10);
const sensitiveLimiter = rateLimit({ max: 3, keyPrefix: 'sensitive-admin' });

app.disable('x-powered-by');
app.set('trust proxy', process.env.NODE_ENV === 'production');
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(cors({ origin: FRONTEND_ORIGINS, credentials: true, allowedHeaders: ['Content-Type', 'Authorization', 'X-MFA-Token', 'X-Internal-Audit-Secret'] }));
app.use(ipAllowlist());
app.use(rateLimit({ max: 20, keyPrefix: 'admin-service' }));

ensureAdminSchema().catch(error => {
  console.warn('Admin schema ensure warning:', error.message);
});

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'admin-service',
    timestamp: new Date().toISOString()
  });
});

app.get('/ready', async (_req, res) => {
  try {
    await checkReady();
    res.json({ status: 'ready', service: 'admin-service', database: 'connected' });
  } catch (error) {
    res.status(503).json({ status: 'not_ready', service: 'admin-service', database: error.message });
  }
});

app.post('/internal/audit', async (req, res) => {
  if (req.get('x-internal-audit-secret') !== INTERNAL_AUDIT_SECRET) {
    return res.status(403).json({ success: false, error: 'Internal audit secret required', code: 'INTERNAL_AUDIT_FORBIDDEN' });
  }

  const event = await auditEvents.create({
    service: req.body.service,
    actorId: req.body.actor_id,
    actorRole: req.body.actor_role,
    action: req.body.action,
    resourceType: req.body.resource_type,
    resourceId: req.body.resource_id,
    beforeState: req.body.before_state,
    afterState: req.body.after_state,
    ipAddress: req.body.ip_address || getClientIp(req),
    userAgent: req.get('user-agent'),
    status: req.body.status || 'success'
  });

  res.status(202).json({ success: true, data: event });
});

app.post('/api/admin/auth/login', async (req, res) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';

  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password are required', code: 'MISSING_CREDENTIALS' });
  }

  const user = await users.getByEmail(email);
  const passwordMatches = await verifyPassword(password, user?.password_hash);
  const adminScope = getAdminScope(user);
  if (!user || !passwordMatches || !user.active || !adminScope) {
    await audit(req, {
      actorId: user?.id,
      actorRole: user?.role,
      action: 'ADMIN_LOGIN_FAILED',
      resourceType: 'admin_session',
      status: 'denied',
      afterState: { email }
    });
    return res.status(401).json({ success: false, error: 'Invalid admin credentials', code: 'INVALID_ADMIN_CREDENTIALS' });
  }

  const provisionalRefreshToken = crypto.randomBytes(32).toString('base64url');
  const session = await adminSessions.create({
    userId: user.id,
    ipAddress: getClientIp(req),
    userAgent: req.get('user-agent'),
    adminScope,
    refreshToken: provisionalRefreshToken
  });
  const tokens = createAdminTokens({ user, sessionId: session.id, adminScope });

  await query('UPDATE admin_sessions SET refresh_token_hash = $2 WHERE id = $1', [session.id, hashToken(tokens.refreshToken)]);
  await audit(req, {
    actorId: user.id,
    actorRole: adminScope,
    action: 'ADMIN_LOGIN',
    resourceType: 'admin_session',
    resourceId: session.id,
    afterState: { adminScope }
  });

  // Set secure httpOnly cookie
  setAdminSessionCookie(res, tokens.accessToken);

  res.json({
    success: true,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresIn: tokens.expiresInSeconds,
    user: safeUser(user, adminScope),
    session: safeSession(session)
  });
});

app.post('/api/admin/auth/refresh', async (req, res) => {
  try {
    const refreshToken = req.body?.refreshToken || '';
    const payload = jwt.verify(refreshToken, ADMIN_REFRESH_SECRET);
    if (payload.tokenType !== 'admin_refresh' || !payload.adminScope) {
      throw new Error('invalid token type');
    }

    const session = await adminSessions.getActive(payload.sessionId);
    if (!session || session.user_id !== payload.sub || session.refresh_token_hash !== hashToken(refreshToken)) {
      return res.status(401).json({ success: false, error: 'Refresh token revoked', code: 'REFRESH_REVOKED' });
    }

    const user = await users.getById(payload.sub);
    const tokens = createAdminTokens({ user, sessionId: session.id, adminScope: payload.adminScope });
    await query('UPDATE admin_sessions SET refresh_token_hash = $2, last_active_at = CURRENT_TIMESTAMP WHERE id = $1', [session.id, hashToken(tokens.refreshToken)]);
    
    // Update cookie
    setAdminSessionCookie(res, tokens.accessToken);
    
    res.json({ success: true, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, expiresIn: tokens.expiresInSeconds });
  } catch {
    res.status(401).json({ success: false, error: 'Invalid refresh token', code: 'INVALID_REFRESH_TOKEN' });
  }
});

app.post('/api/admin/auth/logout', (req, res) => {
  clearAdminSessionCookie(res);
  res.json({ success: true, message: 'Admin session cleared' });
});

app.use('/api/admin', authenticateAdmin);

app.post('/api/admin/auth/revoke/:sessionId', requireAdminScope('superadmin'), async (req, res) => {
  const revoked = await adminSessions.revoke(req.params.sessionId, req.admin.id);
  if (!revoked) {
    return res.status(404).json({ success: false, error: 'Admin session not found', code: 'ADMIN_SESSION_NOT_FOUND' });
  }
  await audit(req, {
    action: 'ADMIN_SESSION_REVOKED',
    resourceType: 'admin_session',
    resourceId: req.params.sessionId,
    afterState: { revokedBy: req.admin.id }
  });
  res.json({ success: true, data: safeSession(revoked) });
});

app.get('/api/admin/sessions', requireAdminScope('admin', 'superadmin'), async (_req, res) => {
  const sessions = await adminSessions.listActive();
  res.json({ success: true, count: sessions.length, data: sessions.map(safeSession) });
});

app.get('/api/admin/users', requireAdminScope('admin', 'superadmin'), async (_req, res) => {
  const allUsers = await users.list();
  res.json({ success: true, count: allUsers.length, data: allUsers.map(user => safeUser(user)) });
});

app.put('/api/admin/users/:id/role', sensitiveLimiter, requireAdminScope('superadmin'), requireMfaToken, async (req, res) => {
  const requestedRole = normalizeRole(req.body?.role);
  if (!ASSIGNABLE_ROLES.includes(requestedRole)) {
    return res.status(400).json({ success: false, error: `Invalid role. Valid roles: ${ASSIGNABLE_ROLES.join(', ')}`, code: 'INVALID_ROLE' });
  }

  const before = await users.getById(req.params.id);
  if (!before) {
    return res.status(404).json({ success: false, error: 'User not found', code: 'USER_NOT_FOUND' });
  }

  const updated = await users.updateRole(req.params.id, requestedRole);
  await audit(req, {
    action: 'ADMIN_ROLE_CHANGE',
    resourceType: 'user',
    resourceId: req.params.id,
    beforeState: { role: before.role },
    afterState: { role: updated.role }
  });

  res.json({ success: true, message: 'User role updated', data: safeUser(updated) });
});

app.get('/api/admin/roles', requireAdminScope('admin', 'superadmin'), (_req, res) => {
  res.json({
    success: true,
    data: ASSIGNABLE_ROLES.map(role => ({ role }))
  });
});

app.post('/api/admin/mfa/setup', requireAdminScope('admin', 'superadmin'), async (req, res) => {
  const secret = generateTotpSecret();
  await users.setTotpSecret(req.admin.id, secret, false);
  await audit(req, { action: 'ADMIN_MFA_SETUP_STARTED', resourceType: 'user', resourceId: req.admin.id });
  res.json({
    success: true,
    secret,
    otpauthUrl: totpUri({ accountName: req.admin.email, secret })
  });
});

app.post('/api/admin/mfa/verify', requireAdminScope('admin', 'superadmin'), async (req, res) => {
  const user = await users.getById(req.admin.id);
  if (!user?.admin_totp_secret || !verifyTotp(req.body?.code, user.admin_totp_secret)) {
    return res.status(403).json({ success: false, error: 'Invalid MFA code', code: 'INVALID_MFA_CODE' });
  }

  await users.enableTotp(req.admin.id);
  await adminSessions.markMfaVerified(req.admin.sessionId);
  const mfaToken = createMfaToken({ user, sessionId: req.admin.sessionId });
  await audit(req, { action: 'ADMIN_MFA_VERIFIED', resourceType: 'user', resourceId: req.admin.id });
  res.json({ success: true, mfaToken, expiresIn: 300 });
});

app.post('/api/admin/mfa/challenge', requireAdminScope('admin', 'superadmin'), async (req, res) => {
  const user = await users.getById(req.admin.id);
  if (!user?.admin_totp_enabled || !user?.admin_totp_secret) {
    return res.status(403).json({ success: false, error: 'MFA setup required', code: 'MFA_REQUIRED' });
  }
  if (!verifyTotp(req.body?.code, user.admin_totp_secret)) {
    return res.status(403).json({ success: false, error: 'Invalid MFA code', code: 'INVALID_MFA_CODE' });
  }
  await adminSessions.markMfaVerified(req.admin.sessionId);
  res.json({ success: true, mfaToken: createMfaToken({ user, sessionId: req.admin.sessionId }), expiresIn: 300 });
});

app.get('/api/admin/audit-logs', requireAdminScope('admin', 'superadmin'), async (req, res) => {
  const result = await auditEvents.search(req.query);
  res.json({ success: true, count: result.rows.length, page: result.page, limit: result.limit, total: result.total, data: result.rows });
});

app.get('/api/admin/audit-logs/export.csv', requireAdminScope('admin', 'superadmin'), async (req, res) => {
  const result = await auditEvents.search({ ...req.query, limit: req.query.limit || '500' });
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="apolaki-audit-events.csv"');
  res.send(toCsv(result.rows));
});

app.post('/api/admin/break-glass', sensitiveLimiter, requireAdminScope('superadmin'), async (req, res) => {
  const justification = String(req.body?.justification || '').trim();
  const signature = String(req.body?.signature || '').trim();
  if (justification.length < 10) {
    return res.status(400).json({ success: false, error: 'Justification is required (min 10 characters)', code: 'JUSTIFICATION_REQUIRED' });
  }
  if (signature.length < 10) {
    return res.status(400).json({ success: false, error: 'Signed justification is required', code: 'SIGNATURE_REQUIRED' });
  }

  const active = await breakGlassSessions.getActiveByUserId(req.admin.id);
  if (active) {
    return res.status(409).json({
      success: false,
      error: 'An active break-glass session already exists',
      data: { sessionId: active.id, expiresAt: active.expires_at }
    });
  }

  const expiresAt = new Date(Date.now() + BREAK_GLASS_DURATION_MINUTES * 60 * 1000);
  const session = await breakGlassSessions.create({
    userId: req.admin.id,
    justification,
    signature,
    expiresAt,
    ipAddress: getClientIp(req),
    userAgent: req.get('user-agent')
  });

  await audit(req, {
    action: 'BREAK_GLASS_ACTIVATED',
    resourceType: 'break_glass_session',
    resourceId: session.id,
    afterState: { justification, signature }
  });

  res.status(201).json({
    success: true,
    message: 'Break-glass session activated',
    data: { sessionId: session.id, expiresAt: session.expires_at, durationMinutes: BREAK_GLASS_DURATION_MINUTES }
  });
});

app.post('/api/admin/break-glass/:id/action', requireAdminScope('superadmin'), async (req, res) => {
  const session = await breakGlassSessions.getActive(req.params.id);
  if (!session || session.user_id !== req.admin.id) {
    return res.status(404).json({ success: false, error: 'Active session not found', code: 'BREAK_GLASS_NOT_FOUND' });
  }
  if (session.expires_at < new Date()) {
    return res.status(403).json({ success: false, error: 'Break-glass session expired', code: 'BREAK_GLASS_EXPIRED' });
  }

  const action = String(req.body?.action || '').trim();
  if (!action) {
    return res.status(400).json({ success: false, error: 'action is required', code: 'ACTION_REQUIRED' });
  }

  const record = {
    id: uuidv4(),
    action,
    details: req.body?.details || '',
    timestamp: new Date().toISOString(),
    performedBy: req.admin.id
  };
  const updated = await breakGlassSessions.recordAction(req.params.id, record);
  await audit(req, {
    action: 'BREAK_GLASS_ACTION',
    resourceType: 'break_glass_session',
    resourceId: req.params.id,
    afterState: record
  });
  res.json({ success: true, message: 'Action recorded', data: updated });
});

app.post('/api/admin/break-glass/:id/end', requireAdminScope('superadmin'), async (req, res) => {
  const ended = await breakGlassSessions.end(req.params.id);
  if (!ended) {
    return res.status(404).json({ success: false, error: 'Session not found', code: 'BREAK_GLASS_NOT_FOUND' });
  }
  await audit(req, {
    action: 'BREAK_GLASS_ENDED',
    resourceType: 'break_glass_session',
    resourceId: req.params.id,
    afterState: { status: ended.status }
  });
  res.json({ success: true, message: 'Break-glass session ended', data: ended });
});

app.get('/api/admin/break-glass', requireAdminScope('admin', 'superadmin'), async (req, res) => {
  const limit = Math.min(Number.parseInt(req.query.limit || '100', 10), 500);
  const sessions = await breakGlassSessions.list(limit);
  res.json({ success: true, count: sessions.length, data: sessions });
});

app.use((err, _req, res, _next) => {
  console.error('Admin service error:', err);
  res.status(500).json({ success: false, error: 'Internal admin service error', code: 'ADMIN_INTERNAL_ERROR' });
});

let server;
if (process.env.ADMIN_SERVICE_LISTEN !== 'false') {
  server = app.listen(PORT, () => {
    console.log(`Apolaki admin-service listening on :${PORT}`);
  });

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

async function shutdown() {
  if (!server) return;
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}

async function audit(req, event) {
  return auditEvents.create({
    service: 'admin-service',
    actorId: event.actorId ?? req.admin?.id ?? null,
    actorRole: event.actorRole ?? req.admin?.adminScope ?? null,
    action: event.action,
    resourceType: event.resourceType,
    resourceId: event.resourceId,
    beforeState: event.beforeState,
    afterState: event.afterState,
    ipAddress: getClientIp(req),
    userAgent: req.get('user-agent'),
    status: event.status || 'success'
  });
}

function safeUser(user, explicitScope = null) {
  const adminScope = explicitScope || getAdminScope(user);
  return {
    id: user.id,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    phone: user.phone,
    profilePictureUrl: user.profile_picture_url,
    role: normalizeRole(user.role),
    adminScope,
    active: user.active,
    mfaEnabled: Boolean(user.admin_totp_enabled),
    createdAt: user.created_at,
    updatedAt: user.updated_at
  };
}

function safeSession(session) {
  return {
    id: session.id,
    userId: session.user_id,
    email: session.email,
    role: session.role ? normalizeRole(session.role) : undefined,
    adminScope: session.admin_scope,
    mfaVerified: Boolean(session.mfa_verified),
    ipAddress: session.ip_address,
    userAgent: session.user_agent,
    loggedInAt: session.logged_in_at,
    lastActiveAt: session.last_active_at
  };
}

function toCsv(rows) {
  const columns = ['id', 'service', 'actor_id', 'actor_role', 'action', 'resource_type', 'resource_id', 'ip_address', 'status', 'timestamp'];
  return [
    columns.join(','),
    ...rows.map(row => columns.map(column => csvCell(row[column])).join(','))
  ].join('\n');
}

function csvCell(value) {
  if (value === null || value === undefined) return '';
  const text = String(value).replace(/"/g, '""');
  return /[",\n]/.test(text) ? `"${text}"` : text;
}

export default app;
