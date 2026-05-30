/**
 * Admin Break-Glass Routes — merged into netlify-db-service
 * POST /api/admin/break-glass
 * GET  /api/admin/break-glass
 * POST /api/admin/break-glass/:id/action
 * POST /api/admin/break-glass/:id/end
 */

import expressModule from 'express';
import { auditEvents, breakGlass } from '../../adminDb.js';
import { adminStrictLimiter, authenticateAdmin, getClientIp, requireSuperAdmin } from '../../auth/adminAuth.js';

const express = expressModule.default || expressModule;
const router = express.Router();
const BREAK_GLASS_DURATION_MINUTES = 60;

router.post('/', authenticateAdmin, requireSuperAdmin, adminStrictLimiter, async (req, res) => {
  try {
    const { justification } = req.body;
    if (!justification || justification.length < 10) {
      return res.status(400).json({ success: false, error: 'Justification required (min 10 chars)' });
    }

    const active = await breakGlass.getActiveByUserId(req.adminUser.sub);
    if (active) {
      return res.status(409).json({
        success: false,
        error: 'An active break-glass session already exists',
        data: { sessionId: active.id, expiresAt: active.expires_at },
      });
    }

    const expiresAt = new Date(Date.now() + BREAK_GLASS_DURATION_MINUTES * 60 * 1000);
    const session = await breakGlass.create({
      userId: req.adminUser.sub,
      justification,
      expiresAt: expiresAt.toISOString(),
      ipAddress: getClientIp(req),
      userAgent: req.get('user-agent'),
    });

    await auditEvents.create({
      actorId: req.adminUser.sub,
      actorRole: req.adminUser.adminScope,
      action: 'BREAK_GLASS_ACTIVATED',
      resourceType: 'break_glass_session',
      resourceId: session.id,
      afterState: { justification },
      ipAddress: getClientIp(req),
      userAgent: req.get('user-agent'),
    });

    res.status(201).json({
      success: true,
      message: 'Break-glass session activated',
      data: { sessionId: session.id, expiresAt: session.expires_at, durationMinutes: BREAK_GLASS_DURATION_MINUTES },
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.get('/', authenticateAdmin, async (_req, res) => {
  try {
    const sessions = await breakGlass.getAll();
    res.json({ success: true, count: sessions.length, data: sessions });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.post('/:id/action', authenticateAdmin, requireSuperAdmin, async (req, res) => {
  try {
    const { action, details } = req.body;
    if (!action) return res.status(400).json({ success: false, error: 'action is required' });

    const record = { action, details: details || '', timestamp: new Date().toISOString(), performedBy: req.adminUser.sub };
    const updated = await breakGlass.recordAction(req.params.id, record);
    if (!updated) return res.status(404).json({ success: false, error: 'Active session not found' });

    await auditEvents.create({
      actorId: req.adminUser.sub,
      actorRole: req.adminUser.adminScope,
      action: 'BREAK_GLASS_ACTION',
      resourceType: 'break_glass_session',
      resourceId: req.params.id,
      afterState: record,
      ipAddress: getClientIp(req),
      userAgent: req.get('user-agent'),
    });

    res.json({ success: true, message: 'Action recorded', data: updated });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.post('/:id/end', authenticateAdmin, requireSuperAdmin, async (req, res) => {
  try {
    const ended = await breakGlass.end(req.params.id);
    if (!ended) return res.status(404).json({ success: false, error: 'Session not found' });

    await auditEvents.create({
      actorId: req.adminUser.sub,
      actorRole: req.adminUser.adminScope,
      action: 'BREAK_GLASS_ENDED',
      resourceType: 'break_glass_session',
      resourceId: req.params.id,
      ipAddress: getClientIp(req),
      userAgent: req.get('user-agent'),
    });

    res.json({ success: true, message: 'Break-glass session ended', data: ended });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

export default router;
