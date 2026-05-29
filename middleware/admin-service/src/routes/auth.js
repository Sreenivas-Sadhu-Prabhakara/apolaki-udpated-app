import express from 'express';
import jwt from 'jsonwebtoken';
import { users, adminSessions, auditEvents } from '../db.js';

const router = express.Router();
const ADMIN_SECRET = process.env.ADMIN_JWT_SECRET || 'dev-admin-jwt-secret-change-in-production';
const REFRESH_SECRET = process.env.ADMIN_REFRESH_SECRET || 'dev-admin-refresh-secret-change-in-production';

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const user = await users.getByEmail(email);
    
    // In a real app, use bcrypt to verify password
    // For this dev setup, we're assuming seeded passwords match
    if (!user || !['admin', 'superadmin'].includes(user.role)) {
      await auditEvents.create({
        action: 'ADMIN_LOGIN_FAILURE',
        status: 'denied',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });
      return res.status(401).json({ success: false, error: 'Invalid credentials or insufficient permissions' });
    }

    // Generate tokens
    const adminScope = user.role === 'superadmin' ? 'superadmin' : 'admin';
    const refreshToken = jwt.sign({ sub: user.id, type: 'refresh' }, REFRESH_SECRET, { expiresIn: '7d' });
    
    const session = await adminSessions.create({
      userId: user.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      adminScope,
      refreshToken
    });

    const accessToken = jwt.sign({
      sub: user.id,
      role: user.role,
      adminScope,
      tokenType: 'admin_access',
      sessionId: session.id
    }, ADMIN_SECRET, { expiresIn: '15m' });

    await auditEvents.create({
      actorId: user.id,
      actorRole: user.role,
      action: 'ADMIN_LOGIN',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        adminScope
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: 'Internal admin service error', code: 'ADMIN_INTERNAL_ERROR' });
  }
});

export default router;
