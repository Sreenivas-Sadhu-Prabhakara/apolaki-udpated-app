/**
 * Admin User Routes — merged into netlify-db-service
 * GET /api/admin/users
 * GET /api/admin/users/roles
 * PUT /api/admin/users/:id/role
 */

import expressModule from 'express';
import * as OTPAuth from 'otpauth';
import { adminUsers, auditEvents } from '../../adminDb.js';
import { authenticateAdmin, getClientIp, requireSuperAdmin, adminStrictLimiter } from '../../auth/adminAuth.js';

const express = expressModule.default || expressModule;
const router = express.Router();

const VALID_ROLES = ['user', 'dealer', 'installer', 'operations', 'admin', 'superadmin'];

router.get('/', authenticateAdmin, async (req, res) => {
  try {
    const users = await adminUsers.getAll();
    res.json({
      success: true,
      count: users.length,
      data: users.map(u => ({
        id: u.id,
        email: u.email,
        role: u.role,
        fullName: [u.first_name, u.last_name].filter(Boolean).join(' '),
        active: u.active,
        createdAt: u.created_at,
      })),
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.get('/roles', authenticateAdmin, async (_req, res) => {
  res.json({ success: true, data: VALID_ROLES });
});

router.put('/:id/role', authenticateAdmin, requireSuperAdmin, adminStrictLimiter, async (req, res) => {
  try {
    const { role } = req.body;
    const mfaToken = req.headers['x-mfa-token'];

    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({ success: false, error: `Invalid role. Valid: ${VALID_ROLES.join(', ')}` });
    }

    const totpSecret = await adminUsers.getTotpSecret(req.adminUser.sub);
    if (totpSecret) {
      if (!mfaToken) {
        return res.status(403).json({ success: false, error: 'MFA token required for role changes', code: 'MFA_REQUIRED' });
      }
      const totp = new OTPAuth.TOTP({ secret: OTPAuth.Secret.fromBase32(totpSecret) });
      if (totp.validate({ token: mfaToken, window: 1 }) === null) {
        return res.status(403).json({ success: false, error: 'Invalid MFA token', code: 'MFA_INVALID' });
      }
    }

    const targetUser = await adminUsers.getById(req.params.id);
    if (!targetUser) return res.status(404).json({ success: false, error: 'User not found' });

    const updated = await adminUsers.updateRole(req.params.id, role);

    await auditEvents.create({
      actorId: req.adminUser.sub,
      actorRole: req.adminUser.adminScope,
      action: 'USER_ROLE_CHANGED',
      resourceType: 'user',
      resourceId: req.params.id,
      beforeState: { role: targetUser.role },
      afterState: { role },
      ipAddress: getClientIp(req),
      userAgent: req.get('user-agent'),
    });

    res.json({ success: true, message: `Role updated to ${role}`, data: updated });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

export default router;
