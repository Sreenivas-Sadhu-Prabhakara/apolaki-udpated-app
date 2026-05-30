/**
 * Admin Service — Auth Middleware
 * Validates admin-scoped JWTs and enforces rate limits.
 */

import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import { adminSessions } from '../db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

// ─── Rate Limiters ────────────────────────────────────────────────────────────

export const standardLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { success: false, error: 'Too many requests, please slow down.', code: 'RATE_LIMITED' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const strictLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 3,
  message: { success: false, error: 'Too many sensitive requests.', code: 'RATE_LIMITED_STRICT' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── IP Allowlist ─────────────────────────────────────────────────────────────

export function ipAllowlist(req, res, next) {
  const allowedCidrs = process.env.ADMIN_ALLOWED_CIDRS;
  if (!allowedCidrs) return next(); // Not configured — allow all

  const clientIp = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.ip || '';
  const allowed = allowedCidrs.split(',').some(cidr => {
    const base = cidr.trim().split('/')[0];
    return clientIp === base || clientIp.startsWith(base.split('.').slice(0, 3).join('.'));
  });

  if (!allowed) {
    return res.status(403).json({ success: false, error: 'Access denied from this IP', code: 'IP_BLOCKED' });
  }
  next();
}

// ─── Authenticate Admin JWT ───────────────────────────────────────────────────

export async function authenticateAdmin(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Admin token required', code: 'NO_TOKEN' });
    }

    const token = authHeader.slice(7);
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (e) {
      return res.status(401).json({ success: false, error: 'Invalid or expired token', code: 'INVALID_TOKEN' });
    }

    if (!decoded.adminScope || !['admin', 'superadmin'].includes(decoded.adminScope)) {
      return res.status(403).json({ success: false, error: 'Admin scope required', code: 'INSUFFICIENT_SCOPE' });
    }

    // Touch the session's last_active_at if sessionId present
    if (decoded.sessionId) {
      const session = await adminSessions.getById(decoded.sessionId);
      if (!session) {
        return res.status(401).json({ success: false, error: 'Admin session revoked or expired', code: 'SESSION_REVOKED' });
      }
      await adminSessions.touch(decoded.sessionId);
    }

    req.adminUser = decoded;
    next();
  } catch (e) {
    res.status(500).json({ success: false, error: 'Auth error', code: 'AUTH_ERROR' });
  }
}

// ─── Require superadmin scope ─────────────────────────────────────────────────

export function requireSuperAdmin(req, res, next) {
  if (req.adminUser?.adminScope !== 'superadmin') {
    return res.status(403).json({ success: false, error: 'Superadmin scope required', code: 'SUPERADMIN_REQUIRED' });
  }
  next();
}

// ─── Internal service-to-service auth ────────────────────────────────────────

export function authenticateInternal(req, res, next) {
  const token = req.headers['x-internal-token'];
  const expected = process.env.INTERNAL_SERVICE_TOKEN;
  if (!expected || token !== expected) {
    return res.status(403).json({ success: false, error: 'Invalid internal token', code: 'INVALID_INTERNAL_TOKEN' });
  }
  next();
}

// ─── Helper ──────────────────────────────────────────────────────────────────

export function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0].trim() || req.ip || 'unknown';
}
