/**
 * Authentication and authorization middleware.
 * Application authentication uses an opaque, server-owned session cookie.
 */

import { sessions, users } from '../db.js';
import { normalizeRole } from './access-control.js';

export const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || 'apolaki_session';

function readCookie(req, name) {
  const value = req.headers.cookie
    ?.split(';')
    .map(cookie => cookie.trim().split('='))
    .find(([key]) => key === name)?.[1];
  return value ? decodeURIComponent(value) : null;
}

export async function authenticateToken(req, res, next) {
  try {
    if (req.user) return next();

    const sessionToken = readCookie(req, SESSION_COOKIE_NAME);
    if (!sessionToken) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'NO_SESSION'
      });
    }

    const session = await sessions.getByToken(sessionToken);
    if (!session) {
      return res.status(401).json({
        success: false,
        error: 'Session expired',
        code: 'SESSION_EXPIRED'
      });
    }

    const user = await users.getById(session.user_id);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    if (!user.active) {
      return res.status(403).json({
        success: false,
        error: 'User account is inactive',
        code: 'USER_INACTIVE'
      });
    }

    req.user = user;
    req.authSessionToken = sessionToken;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Invalid session',
      code: 'INVALID_SESSION'
    });
  }
}

export function authorizeRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        code: 'UNAUTHORIZED'
      });
    }

    if (!allowedRoles.includes(normalizeRole(req.user.role)) &&
        !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    next();
  };
}

export function verifyOwnership(resourceField = 'id') {
  return async (req, res, next) => {
    const resourceId = req.params[resourceField];
    if ((resourceField === 'userId' || req.path.includes('/users/')) &&
      resourceId !== req.user.id &&
      req.user.role !== 'admin' &&
      req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Cannot access other user data',
        code: 'FORBIDDEN_ACCESS'
      });
    }
    next();
  };
}

export function errorHandler(err, req, res, next) {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    code: 'INTERNAL_ERROR'
  });
}

export function validateRequest(schema) {
  return async (req, res, next) => {
    try {
      req.validatedBody = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: error.errors
      });
    }
  };
}

export default {
  authenticateToken,
  authorizeRole,
  verifyOwnership,
  errorHandler,
  validateRequest
};
