/**
 * Admin Audit Log Routes — merged into netlify-db-service
 * GET  /api/admin/audit-logs
 * GET  /api/admin/audit-logs/export.csv
 * POST /api/admin/audit-logs/internal  (service-to-service)
 */

import expressModule from 'express';
import { auditEvents } from '../../adminDb.js';
import { authenticateAdmin, authenticateInternal } from '../../auth/adminAuth.js';

const express = expressModule.default || expressModule;
const router = express.Router();

router.get('/', authenticateAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, actor_id, action, resource_type, from, to } = req.query;
    const result = await auditEvents.query({
      page: parseInt(page),
      limit: Math.min(parseInt(limit), 500),
      actorId: actor_id,
      action,
      resourceType: resource_type,
      from,
      to,
    });
    res.json({ success: true, ...result });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.get('/export.csv', authenticateAdmin, async (req, res) => {
  try {
    const { actor_id, action, resource_type, from, to } = req.query;
    const result = await auditEvents.query({
      page: 1, limit: 10000,
      actorId: actor_id, action, resourceType: resource_type, from, to,
    });
    const headers = ['id', 'service', 'actor_id', 'actor_role', 'action', 'resource_type', 'resource_id', 'ip_address', 'timestamp'];
    const rows = result.data.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(','));
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="audit-events.csv"');
    res.send([headers.join(','), ...rows].join('\n'));
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.post('/internal', authenticateInternal, async (req, res) => {
  try {
    const { service, actorId, actorRole, action, resourceType, resourceId, beforeState, afterState, ipAddress, userAgent } = req.body;
    if (!action) return res.status(400).json({ success: false, error: 'action is required' });
    const event = await auditEvents.create({ service, actorId, actorRole, action, resourceType, resourceId, beforeState, afterState, ipAddress, userAgent });
    res.status(201).json({ success: true, data: event });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

export default router;
