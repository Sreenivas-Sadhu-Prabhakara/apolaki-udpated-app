/**
 * Admin Auth Routes — merged into netlify-db-service
 * POST /api/admin/auth/login
 * GET  /api/admin/auth/sessions
 * POST /api/admin/auth/revoke/:sessionId
 */

import bcrypt from 'bcryptjs';
import expressModule from 'express';
import jwt from 'jsonwebtoken';
import { adminSessions, adminUsers } from '../../adminDb.js';
import { adminStrictLimiter, authenticateAdmin, getClientIp, requireSuperAdmin } from '../../auth/adminAuth.js';

const express = expressModule.default || expressModule;
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const ADMIN_JWT_EXPIRY = process.env.ADMIN_JWT_EXPIRY || '15m';

router.post('/login', adminStrictLimiter, async (req, res) => {
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

    const session = await adminSessions.create({
      userId: user.id,
      ipAddress: getClientIp(req),
      userAgent: req.get('user-agent'),
      adminScope: user.role,
      mfaVerified: false,
    });

    const token = jwt.sign(
      { sub: user.id, email: user.email, role: user.role, adminScope: user.role, sessionId: session.id },
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

router.get('/sessions', authenticateAdmin, async (req, res) => {
  try {
    const sessions = await adminSessions.getActive();
    res.json({ success: true, count: sessions.length, data: sessions });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.post('/revoke/:sessionId', authenticateAdmin, requireSuperAdmin, async (req, res) => {
  try {
    const revoked = await adminSessions.revoke(req.params.sessionId, req.adminUser.sub);
    if (!revoked) return res.status(404).json({ success: false, error: 'Session not found' });
    res.json({ success: true, message: 'Session revoked', data: revoked });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

export default router;
