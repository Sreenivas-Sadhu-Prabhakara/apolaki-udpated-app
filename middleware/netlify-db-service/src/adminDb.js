/**
 * Admin DB helpers — merged into netlify-db-service.
 *
 * Uses the same getSqlInstance() / Neon tagged-template pattern as db.js.
 * ensureAdminSchema is already handled by db.js on startup — we just provide
 * the table-level CRUD helpers.
 *
 * break_glass_sessions table is also created by db.js's ensureAdminSchema.
 */

import { ensureInitialized } from './db.js';

function getSql() {
  return ensureInitialized();
}

// ─── adminSessions ────────────────────────────────────────────────────────────

export const adminSessions = {
  async create({ userId, ipAddress, userAgent, adminScope, mfaVerified }) {
    const sql = getSql();
    const result = await sql`
      INSERT INTO admin_sessions (user_id, ip_address, user_agent, admin_scope, mfa_verified)
      VALUES (${userId}, ${ipAddress}, ${userAgent}, ${adminScope}, ${mfaVerified || false})
      RETURNING *
    `;
    return result[0];
  },

  async getById(sessionId) {
    const sql = getSql();
    const result = await sql`
      SELECT * FROM admin_sessions WHERE id=${sessionId} AND revoked_at IS NULL
    `;
    return result[0];
  },

  async getActive() {
    const sql = getSql();
    return await sql`
      SELECT s.*, u.email, u.first_name, u.last_name
      FROM admin_sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.revoked_at IS NULL
      ORDER BY s.logged_in_at DESC
    `;
  },

  async touch(sessionId) {
    const sql = getSql();
    await sql`UPDATE admin_sessions SET last_active_at=CURRENT_TIMESTAMP WHERE id=${sessionId}`;
  },

  async revoke(sessionId, revokedBy) {
    const sql = getSql();
    const result = await sql`
      UPDATE admin_sessions
      SET revoked_at=CURRENT_TIMESTAMP, revoked_by=${revokedBy}
      WHERE id=${sessionId}
      RETURNING *
    `;
    return result[0];
  },
};

// ─── auditEvents ──────────────────────────────────────────────────────────────

export const auditEvents = {
  async create({ service, actorId, actorRole, action, resourceType, resourceId, beforeState, afterState, ipAddress, userAgent }) {
    const sql = getSql();
    const result = await sql`
      INSERT INTO audit_events
        (service, actor_id, actor_role, action, resource_type, resource_id, before_state, after_state, ip_address, user_agent)
      VALUES (
        ${service || 'netlify-db-service'},
        ${actorId || null},
        ${actorRole || null},
        ${action},
        ${resourceType || null},
        ${resourceId || null},
        ${beforeState ? JSON.stringify(beforeState) : null},
        ${afterState ? JSON.stringify(afterState) : null},
        ${ipAddress || null},
        ${userAgent || null}
      )
      RETURNING *
    `;
    return result[0];
  },

  async query({ page = 1, limit = 50, actorId, action, resourceType, from, to } = {}) {
    const sql = getSql();
    const offset = (page - 1) * limit;

    // Neon tagged templates don't support fully dynamic WHERE clauses easily,
    // so we fetch a bounded set and filter in JS for the complex case.
    const rows = await sql`SELECT * FROM audit_events ORDER BY timestamp DESC LIMIT 5000`;
    const filtered = rows.filter(r => {
      if (actorId && r.actor_id !== actorId) return false;
      if (action && !r.action?.toLowerCase().includes(action.toLowerCase())) return false;
      if (resourceType && r.resource_type !== resourceType) return false;
      if (from && new Date(r.timestamp) < new Date(from)) return false;
      if (to && new Date(r.timestamp) > new Date(to)) return false;
      return true;
    });

    return {
      total: filtered.length,
      page,
      limit,
      data: filtered.slice(offset, offset + limit),
    };
  },
};

// ─── breakGlass ───────────────────────────────────────────────────────────────

export const breakGlass = {
  async create({ userId, justification, expiresAt, ipAddress, userAgent }) {
    const sql = getSql();
    const result = await sql`
      INSERT INTO break_glass_sessions (user_id, justification, expires_at, ip_address, user_agent)
      VALUES (${userId}, ${justification}, ${expiresAt}, ${ipAddress}, ${userAgent})
      RETURNING *
    `;
    return result[0];
  },

  async getActiveByUserId(userId) {
    const sql = getSql();
    const result = await sql`
      SELECT * FROM break_glass_sessions
      WHERE user_id=${userId} AND ended_at IS NULL AND expires_at > CURRENT_TIMESTAMP
    `;
    return result[0];
  },

  async getAll() {
    const sql = getSql();
    return await sql`
      SELECT b.*, u.email FROM break_glass_sessions b
      JOIN users u ON b.user_id=u.id
      ORDER BY b.started_at DESC
    `;
  },

  async recordAction(sessionId, record) {
    const sql = getSql();
    const result = await sql`
      UPDATE break_glass_sessions
      SET actions_taken = actions_taken || ${JSON.stringify(record)}::jsonb
      WHERE id=${sessionId} AND ended_at IS NULL AND expires_at > CURRENT_TIMESTAMP
      RETURNING *
    `;
    return result[0];
  },

  async end(sessionId) {
    const sql = getSql();
    const result = await sql`
      UPDATE break_glass_sessions SET ended_at=CURRENT_TIMESTAMP WHERE id=${sessionId}
      RETURNING *
    `;
    return result[0];
  },
};

// ─── adminUsers ───────────────────────────────────────────────────────────────

export const adminUsers = {
  async getAll() {
    const sql = getSql();
    return await sql`
      SELECT id, email, first_name, last_name, role, active, created_at, updated_at
      FROM users ORDER BY created_at DESC
    `;
  },

  async getByEmail(email) {
    const sql = getSql();
    const result = await sql`
      SELECT id, email, first_name, last_name, role, active, password_hash
      FROM users WHERE email=${email}
    `;
    return result[0];
  },

  async getById(id) {
    const sql = getSql();
    const result = await sql`
      SELECT id, email, first_name, last_name, role, active, created_at, password_hash
      FROM users WHERE id=${id}
    `;
    return result[0];
  },

  async updateRole(userId, role) {
    const sql = getSql();
    const result = await sql`
      UPDATE users SET role=${role}, updated_at=CURRENT_TIMESTAMP
      WHERE id=${userId}
      RETURNING id, email, role
    `;
    return result[0];
  },

  async getTotpSecret(userId) {
    try {
      const sql = getSql();
      const result = await sql`SELECT admin_totp_secret FROM users WHERE id=${userId}`;
      return result[0]?.admin_totp_secret || null;
    } catch {
      return null;
    }
  },

  async setTotpSecret(userId, secret) {
    const sql = getSql();
    await sql`UPDATE users SET admin_totp_secret=${secret}, admin_totp_enabled=true WHERE id=${userId}`;
  },
};
