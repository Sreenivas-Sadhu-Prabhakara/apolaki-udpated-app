import express from 'express';
import { auditEvents } from '../db.js';
import { authenticateAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateAdmin, async (req, res) => {
  try {
    const { rows, total, page, limit } = await auditEvents.search(req.query);
    res.json({ success: true, data: rows, total, page, limit });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/export.csv', authenticateAdmin, async (req, res) => {
  try {
    const { rows } = await auditEvents.search({ ...req.query, limit: 1000 });
    
    const headers = ['id', 'timestamp', 'service', 'actor_id', 'actor_role', 'action', 'resource_type', 'resource_id', 'status'];
    const csvRows = [headers.join(',')];
    
    for (const row of rows) {
      csvRows.push(headers.map(h => {
        const val = row[h];
        if (val instanceof Date) return val.toISOString();
        if (typeof val === 'string' && (val.includes(',') || val.includes('"'))) return `"${val.replace(/"/g, '""')}"`;
        return val === null ? '' : String(val);
      }).join(','));
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=audit-logs.csv');
    res.send(csvRows.join('\n'));
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
