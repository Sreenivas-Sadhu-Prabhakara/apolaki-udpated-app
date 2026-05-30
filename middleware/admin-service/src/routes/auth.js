/**
 * Admin Service — Auth Routes
 * POST /api/admin/auth/login  — admin login, returns short-lived JWT with adminScope
 * POST /api/admin/auth/revoke/:sessionId — revoke an admin session (superadmin only)
 * GET  /api/admin/auth/sessions — list active admin sessions
 */

import bcrypt from 'bcryptjs';
import express from 'express';
import jwt from 'jsonwebtoken';
import { adminSessions, adminUsers } from '../db.js';
import { authenticateAdmin, getClientIp, requireSuperAdmin, strictLimiter } from '../middleware/auth.js';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const ADMIN_JWT_EXPIRY = process.env.ADMIN_JWT_EXPIRY || '15m';

/**
 * POST /api/admin/auth/login
 * Admin-specific login — only succeeds for users with role admin or superadmin.
 * Returns a short-lived JWT with adminScope claim.
 */
router.post('/login', strictLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    const user = await adminUsers.getByEmail(email);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials', code: 'INVALID_CREDENTIALS' });
    }

    if (!['admin', 'superadmin'].includes(user.role)) {
      return res.status(403).json({ success: false, error: 'Insufficient role for admin access', code: 'INSUFFICIENT_ROLE' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ success: false, error: 'Invalid credentials', code: 'INVALID_CREDENTIALS' });
    }

    // Create admin session record
    const session = await adminSessions.create({
      userId: user.id,
      ipAddress: getClientIp(req),
      userAgent: req.get('user-agent'),
      adminScope: user.role,
      mfaVerified: false,
    });

    const token = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        adminScope: user.role,
        sessionId: session.id,
      },
      JWT_SECRET,
      { expiresIn: ADMIN_JWT_EXPIRY }
    );

    res.json({
      success: true,
      token,
      expiresIn: ADMIN_JWT_EXPIRY,
      adminScope: user.role,
      sessionId: session.id,
      mfaVerified: false,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: [user.first_name, user.last_name].filter(Boolean).join(' '),
      },
    });
  } catch (e) {
    console.error('Admin login error:', e);
    res.status(500).json({ success: false, error: e.message });
  }
});

/**
 * GET /api/admin/auth/sessions
 * List all active admin sessions (admin+ required)
 */
router.get('/sessions', authenticateAdmin, async (req, res) => {
  try {
    const sessions = await adminSessions.getActive();
    res.json({ success: true, count: sessions.length, data: sessions });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

/**
 * POST /api/admin/auth/revoke/:sessionId
 * Force-revoke an admin session (superadmin only)
 */
router.post('/revoke/:sessionId', authenticateAdmin, requireSuperAdmin, async (req, res) => {
  try {
    const revoked = await adminSessions.revoke(req.params.sessionId, req.adminUser.sub);
    if (!revoked) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }
    res.json({ success: true, message: 'Session revoked', data: revoked });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

export default router;
