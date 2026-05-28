import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { adminSessions, users } from './db.js';

export const ASSIGNABLE_ROLES = ['customer', 'dealer', 'operations', 'admin', 'superadmin'];

const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET || 'dev-admin-jwt-secret-change-in-production';
const ADMIN_REFRESH_SECRET = process.env.ADMIN_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET || 'dev-admin-refresh-secret-change-in-production';
const ACCESS_TOKEN_MINUTES = Number.parseInt(process.env.ADMIN_ACCESS_TOKEN_MINUTES || '15', 10);
const IDLE_TIMEOUT_MINUTES = Number.parseInt(process.env.ADMIN_IDLE_TIMEOUT_MINUTES || '30', 10);
const MFA_TOKEN_MINUTES = 5;
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function normalizeRole(role) {
  return role === 'installer' ? 'dealer' : role;
}

export function getAdminScope(user) {
  const role = normalizeRole(user?.role);
  return role === 'superadmin' ? 'superadmin' : role === 'admin' ? 'admin' : null;
}

export async function verifyPassword(password, passwordHash) {
  if (!password || !passwordHash) return false;
  return bcrypt.compare(password, passwordHash);
}

export function createAdminTokens({ user, sessionId, adminScope }) {
  const accessToken = jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: normalizeRole(user.role),
      adminScope,
      sessionId,
      tokenType: 'admin_access'
    },
    ADMIN_JWT_SECRET,
    { expiresIn: `${ACCESS_TOKEN_MINUTES}m` }
  );

  const refreshToken = jwt.sign(
    {
      sub: user.id,
      adminScope,
      sessionId,
      tokenType: 'admin_refresh'
    },
    ADMIN_REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken, expiresInSeconds: ACCESS_TOKEN_MINUTES * 60 };
}

export function createMfaToken({ user, sessionId }) {
  return jwt.sign(
    {
      sub: user.id,
      sessionId,
      tokenType: 'admin_mfa'
    },
    ADMIN_JWT_SECRET,
    { expiresIn: `${MFA_TOKEN_MINUTES}m` }
  );
}

export async function authenticateAdmin(req, res, next) {
  try {
    const header = req.get('authorization') || '';
    const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length).trim() : '';
    if (!token) {
      return res.status(401).json({ success: false, error: 'Admin access token required', code: 'ADMIN_TOKEN_REQUIRED' });
    }

    const payload = jwt.verify(token, ADMIN_JWT_SECRET);
    if (payload.tokenType !== 'admin_access' || !payload.adminScope) {
      return res.status(403).json({ success: false, error: 'Admin scope required', code: 'ADMIN_SCOPE_REQUIRED' });
    }

    const session = await adminSessions.getActive(payload.sessionId);
    if (!session || session.user_id !== payload.sub) {
      return res.status(401).json({ success: false, error: 'Admin session expired', code: 'ADMIN_SESSION_EXPIRED' });
    }

    if (Number(session.idle_seconds || 0) > IDLE_TIMEOUT_MINUTES * 60) {
      await adminSessions.revoke(session.id, null);
      return res.status(401).json({ success: false, error: 'Admin session expired due to inactivity', code: 'ADMIN_SESSION_IDLE_EXPIRED' });
    }

    if (!session.active) {
      return res.status(403).json({ success: false, error: 'Admin account is inactive', code: 'ADMIN_INACTIVE' });
    }

    const currentScope = getAdminScope(session);
    if (!currentScope || scopeRank(currentScope) < scopeRank(payload.adminScope)) {
      return res.status(403).json({ success: false, error: 'Admin scope no longer valid', code: 'ADMIN_SCOPE_REVOKED' });
    }

    await adminSessions.touch(session.id);
    req.admin = {
      id: session.user_id,
      email: session.email,
      role: normalizeRole(session.role),
      adminScope: payload.adminScope,
      sessionId: session.id,
      mfaVerified: session.mfa_verified,
      totpSecret: session.admin_totp_secret,
      totpEnabled: session.admin_totp_enabled
    };
    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Invalid admin token', code: 'INVALID_ADMIN_TOKEN' });
  }
}

export function requireAdminScope(...allowedScopes) {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({ success: false, error: 'Admin authentication required', code: 'ADMIN_AUTH_REQUIRED' });
    }
    if (!allowedScopes.includes(req.admin.adminScope)) {
      return res.status(403).json({ success: false, error: 'Insufficient admin scope', code: 'INSUFFICIENT_ADMIN_SCOPE' });
    }
    next();
  };
}

export async function requireMfaToken(req, res, next) {
  try {
    const currentAdmin = await users.getById(req.admin.id);
    if (!currentAdmin?.admin_totp_enabled || !currentAdmin?.admin_totp_secret) {
      return res.status(403).json({ success: false, error: 'MFA is required before changing roles', code: 'MFA_REQUIRED' });
    }

    const mfaToken = req.get('x-mfa-token') || '';
    if (!mfaToken) {
      return res.status(403).json({ success: false, error: 'MFA challenge token required', code: 'MFA_TOKEN_REQUIRED' });
    }

    const payload = jwt.verify(mfaToken, ADMIN_JWT_SECRET);
    if (payload.tokenType !== 'admin_mfa' || payload.sub !== req.admin.id || payload.sessionId !== req.admin.sessionId) {
      return res.status(403).json({ success: false, error: 'Invalid MFA challenge token', code: 'INVALID_MFA_TOKEN' });
    }
    next();
  } catch {
    return res.status(403).json({ success: false, error: 'Invalid MFA challenge token', code: 'INVALID_MFA_TOKEN' });
  }
}

export function generateTotpSecret() {
  const random = crypto.randomBytes(20);
  return base32Encode(random);
}

export function totpUri({ issuer = 'Apolaki Admin', accountName, secret }) {
  const label = encodeURIComponent(`${issuer}:${accountName}`);
  const query = new URLSearchParams({ secret, issuer, algorithm: 'SHA1', digits: '6', period: '30' });
  return `otpauth://totp/${label}?${query.toString()}`;
}

export function verifyTotp(token, secret) {
  const normalized = String(token || '').replace(/\s+/g, '');
  if (!/^\d{6}$/.test(normalized) || !secret) return false;
  const nowStep = Math.floor(Date.now() / 30000);
  for (const offset of [-1, 0, 1]) {
    if (generateTotp(secret, nowStep + offset) === normalized) return true;
  }
  return false;
}

function generateTotp(secret, step) {
  const key = base32Decode(secret);
  const buffer = Buffer.alloc(8);
  buffer.writeBigUInt64BE(BigInt(step));
  const hmac = crypto.createHmac('sha1', key).update(buffer).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary = ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return String(binary % 1000000).padStart(6, '0');
}

function base32Encode(buffer) {
  let bits = 0;
  let value = 0;
  let output = '';
  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  return output;
}

function base32Decode(secret) {
  const clean = String(secret).replace(/=+$/g, '').replace(/\s+/g, '').toUpperCase();
  let bits = 0;
  let value = 0;
  const bytes = [];
  for (const char of clean) {
    const index = BASE32_ALPHABET.indexOf(char);
    if (index === -1) continue;
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

function scopeRank(scope) {
  return scope === 'superadmin' ? 2 : scope === 'admin' ? 1 : 0;
}
