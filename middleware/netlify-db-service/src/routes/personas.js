/**
 * Persona-Based Routes
 * Role-specific endpoints for each platform persona:
 *   - User (customer/prosumer)
 *   - Dealer (installer/reseller)
 *   - Operations (field ops/maintenance)
 *   - Admin (organization admin)
 *   - Super Admin (break-glass emergency)
 */

import expressModule from 'express';
import { CONSENT_VERSION, getPermissionsForRole, normalizeRole } from '../auth/access-control.js';
import { authenticateToken, authorizeRole } from '../auth/middleware.js';
import { auditLogs, ensureInitialized, maintenanceLog, solarInstallations } from '../db.js';

// Handle CJS/ESM interop for bundled environments (Netlify esbuild)
const express = expressModule.default || expressModule;

const router = express.Router();

// ─── Constants ──────────────────────────────────────────────────────────
const ADMIN_SERVICE_URL = process.env.ADMIN_SERVICE_URL || 'http://localhost:3002';

// ─── Helper ─────────────────────────────────────────────────────────────
function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0] || req.ip || 'unknown';
}

function adminControlPlaneGone(_req, res) {
  res.status(410).json({
    success: false,
    error: 'This administrative endpoint has moved to the Admin Control Plane.',
    code: 'ADMIN_CONTROL_PLANE_REQUIRED',
    adminServiceUrl: ADMIN_SERVICE_URL
  });
}

// ============================================================================
// ROLE INFO (public, requires auth)
// ============================================================================

/**
 * GET /api/personas/me
 * Returns the current user's persona / role info
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    const role = normalizeRole(user.role);

    const permissions = getPermissionsForRole(role);

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        role,
        permissions,
        fullName: [user.first_name, user.last_name].filter(Boolean).join(' '),
      },
    });
  } catch (error) {
    console.error('Error getting persona info:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.all('/roles', adminControlPlaneGone);

// ============================================================================
// DEALER ROUTES
// ============================================================================

/**
 * GET /api/personas/dealer/installations
 * Dealer sees all installations they commissioned
 */
router.get('/dealer/installations', authenticateToken, authorizeRole('dealer', 'installer', 'admin', 'superadmin'), async (req, res) => {
  try {
    const installations = await solarInstallations.getByUserId(req.user.id);
    res.json({ success: true, count: installations.length, data: installations });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/personas/dealer/commission
 * Dealer commissions a new installation (creates installation + logs audit)
 */
router.post('/dealer/commission', authenticateToken, authorizeRole('dealer', 'installer', 'admin', 'superadmin'), async (req, res) => {
  try {
    const { ownerId, name, address, city, state, zipCode, latitude, longitude, capacity, panelCount, inverterType } = req.body;

    if (!ownerId || !name) {
      return res.status(400).json({ success: false, error: 'ownerId and name are required' });
    }

    const installation = await solarInstallations.create({
      userId: ownerId,
      name,
      address: address || '',
      city: city || '',
      state: state || '',
      zipCode: zipCode || '',
      latitude: latitude || 0,
      longitude: longitude || 0,
      capacity: capacity || 0,
      panelCount: panelCount || 0,
      inverterType: inverterType || '',
    });

    await auditLogs.create({
      userId: req.user.id,
      action: 'DEALER_COMMISSION',
      resourceType: 'installation',
      resourceId: installation.id,
      changes: { ownerId, dealerId: req.user.id },
      ipAddress: getClientIp(req),
      userAgent: req.get('user-agent'),
      status: 'success',
    });

    res.status(201).json({
      success: true,
      message: 'Installation commissioned successfully',
      data: installation,
    });
  } catch (error) {
    console.error('Commission error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// OPERATIONS ROUTES
// ============================================================================

/**
 * GET /api/personas/operations/alerts
 * Operations sees recent maintenance items (simulated alerts)
 */
router.get('/operations/alerts', authenticateToken, authorizeRole('operations', 'admin', 'superadmin'), async (req, res) => {
  try {
    const sqlInstance = ensureInitialized();
    const elevated = ['admin', 'superadmin'].includes(normalizeRole(req.user.role));
    const alerts = elevated
      ? await sqlInstance`
          SELECT m.*, si.name as installation_name
          FROM maintenance_log m
          JOIN solar_installations si ON m.installation_id = si.id
          WHERE m.status IN ('scheduled', 'in_progress')
          ORDER BY m.performed_date ASC
        `
      : await sqlInstance`
          SELECT m.*, si.name as installation_name
          FROM maintenance_log m
          JOIN solar_installations si ON m.installation_id = si.id
          JOIN user_consents monitoring
            ON monitoring.user_id = si.user_id
            AND monitoring.consent_key = 'installation_monitoring'
            AND monitoring.consent_version = ${CONSENT_VERSION}
            AND monitoring.decision = 'granted'
          JOIN user_consents sharing
            ON sharing.user_id = si.user_id
            AND sharing.consent_key = 'partner_sharing'
            AND sharing.consent_version = ${CONSENT_VERSION}
            AND sharing.decision = 'granted'
          WHERE m.status IN ('scheduled', 'in_progress')
          ORDER BY m.performed_date ASC
        `;

    res.json({ success: true, count: alerts.length, data: alerts });
  } catch (error) {
    console.error('Operations alerts error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/personas/operations/resolve/:maintenanceId
 * Operations resolves a maintenance/alert item
 */
router.put('/operations/resolve/:maintenanceId', authenticateToken, authorizeRole('operations', 'admin', 'superadmin'), async (req, res) => {
  try {
    const { notes } = req.body;
    const updated = await maintenanceLog.update(req.params.maintenanceId, {
      status: 'completed',
      completedDate: new Date().toISOString(),
      notes: notes || 'Resolved by operations',
    });

    if (!updated) {
      return res.status(404).json({ success: false, error: 'Maintenance record not found' });
    }

    await auditLogs.create({
      userId: req.user.id,
      action: 'OPERATIONS_RESOLVE',
      resourceType: 'maintenance',
      resourceId: req.params.maintenanceId,
      changes: { status: 'completed', notes },
      ipAddress: getClientIp(req),
      userAgent: req.get('user-agent'),
      status: 'success',
    });

    res.json({ success: true, message: 'Maintenance item resolved', data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// ADMIN CONTROL PLANE DEPRECATION SHIMS
// ============================================================================

router.all([
  '/admin/users',
  '/admin/users/:userId/role',
  '/admin/audit-logs',
  '/superadmin/break-glass',
  '/superadmin/break-glass/:sessionId/action',
  '/superadmin/break-glass/:sessionId/end'
], adminControlPlaneGone);

export default router;
