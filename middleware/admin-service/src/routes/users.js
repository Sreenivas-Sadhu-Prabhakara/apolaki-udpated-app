import express from 'express';
import { users, auditEvents } from '../db.js';
import { authenticateAdmin, requireMfa } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateAdmin, async (req, res) => {
  try {
    const list = await users.list();
    res.json({ success: true, data: list });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/:id/role', authenticateAdmin, requireMfa, async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  try {
    const userBefore = await users.getById(id);
    if (!userBefore) return res.status(404).json({ success: false, error: 'User not found' });

    const updated = await users.updateRole(id, role);
    
    await auditEvents.create({
      actorId: req.admin.id,
      actorRole: req.admin.role,
      action: 'USER_ROLE_CHANGE',
      resourceType: 'user',
      resourceId: id,
      beforeState: { role: userBefore.role },
      afterState: { role: updated.role },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
