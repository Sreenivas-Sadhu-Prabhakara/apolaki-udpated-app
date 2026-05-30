/**
 * Admin Service — Database Layer
 * Connects to PostgreSQL with a read-write admin role.
 * Tables touched: users, admin_sessions, audit_events, break_glass_sessions
 */

import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const { Pool } = pg;

let pool;

export function getPool() {
  if (!pool) {
    const connStr = process.env.DATABASE_URL;
    if (!connStr) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    pool = new Pool({
      connectionString: connStr,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 10,
      idleTimeoutMillis: 30000,
    });

    pool.on('error', (err) => {
      console.error('Unexpected error on idle DB client:', err);
    });
  }
  return pool;
}

/**
 * Ensures admin-service-specific tables exist.
 */
export async function ensureSchema() {
  const db = getPool();

  await db.query(`
    CREATE TABLE IF NOT EXISTS admin_sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL,
      ip_address VARCHAR(45),
      user_agent TEXT,
      admin_scope VARCHAR(20) NOT NULL DEFAULT 'admin',
      mfa_verified BOOLEAN NOT NULL DEFAULT false,
      logged_in_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_active_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      revoked_at TIMESTAMP,
      revoked_by UUID
    );
  `);

  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_admin_sessions_user_id ON admin_sessions(user_id);
  `);

  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_admin_sessions_revoked ON admin_sessions(revoked_at);
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS audit_events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      service VARCHAR(100) NOT NULL DEFAULT 'admin-service',
      actor_id UUID,
      actor_role VARCHAR(50),
      action VARCHAR(200) NOT NULL,
      resource_type VARCHAR(100),
      resource_id UUID,
      before_state JSONB,
      after_state JSONB,
      ip_address VARCHAR(45),
      user_agent TEXT,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_audit_events_actor ON audit_events(actor_id);
  `);

  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_audit_events_action ON audit_events(action);
  `);

  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_audit_events_timestamp ON audit_events(timestamp DESC);
  `);

  // Break glass sessions (shared table — admin-service now owns it)
  await db.query(`
    CREATE TABLE IF NOT EXISTS break_glass_sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL,
      justification TEXT NOT NULL,
      actions_taken JSONB DEFAULT '[]',
      started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      expires_at TIMESTAMP NOT NULL,
      ended_at TIMESTAMP,
      ip_address VARCHAR(45),
      user_agent TEXT
    );
  `);

  console.log('✅ Admin service schema ready');
}

// ─── admin_sessions ────────────────────────────────────────────────────────

export const adminSessions = {
  async create({ userId, ipAddress, userAgent, adminScope, mfaVerified }) {
    const db = getPool();
    const res = await db.query(
      `INSERT INTO admin_sessions (user_id, ip_address, user_agent, admin_scope, mfa_verified)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [userId, ipAddress, userAgent, adminScope, mfaVerified || false]
    );
    return res.rows[0];
  },

  async getById(sessionId) {
    const db = getPool();
    const res = await db.query(
      `SELECT * FROM admin_sessions WHERE id=$1 AND revoked_at IS NULL`,
      [sessionId]
    );
    return res.rows[0];
  },

  async getActive() {
    const db = getPool();
    const res = await db.query(
      `SELECT s.*, u.email, u.first_name, u.last_name
       FROM admin_sessions s
       JOIN users u ON s.user_id = u.id
       WHERE s.revoked_at IS NULL
       ORDER BY s.logged_in_at DESC`
    );
    return res.rows;
  },

  async touch(sessionId) {
    const db = getPool();
    await db.query(
      `UPDATE admin_sessions SET last_active_at=CURRENT_TIMESTAMP WHERE id=$1`,
      [sessionId]
    );
  },

  async revoke(sessionId, revokedBy) {
    const db = getPool();
    const res = await db.query(
      `UPDATE admin_sessions SET revoked_at=CURRENT_TIMESTAMP, revoked_by=$2
       WHERE id=$1 RETURNING *`,
      [sessionId, revokedBy]
    );
    return res.rows[0];
  },
};

// ─── audit_events ────────────────────────────────────────────────────────────

export const auditEvents = {
  async create({ service, actorId, actorRole, action, resourceType, resourceId, beforeState, afterState, ipAddress, userAgent }) {
    const db = getPool();
    const res = await db.query(
      `INSERT INTO audit_events
         (service, actor_id, actor_role, action, resource_type, resource_id, before_state, after_state, ip_address, user_agent)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [
        service || 'admin-service',
        actorId || null,
        actorRole || null,
        action,
        resourceType || null,
        resourceId || null,
        beforeState ? JSON.stringify(beforeState) : null,
        afterState ? JSON.stringify(afterState) : null,
        ipAddress || null,
        userAgent || null,
      ]
    );
    return res.rows[0];
  },

  async query({ page = 1, limit = 50, actorId, action, resourceType, from, to } = {}) {
    const db = getPool();
    const offset = (page - 1) * limit;
    const conditions = [];
    const params = [];
    let idx = 1;

    if (actorId) { conditions.push(`actor_id=$${idx++}`); params.push(actorId); }
    if (action) { conditions.push(`action ILIKE $${idx++}`); params.push(`%${action}%`); }
    if (resourceType) { conditions.push(`resource_type=$${idx++}`); params.push(resourceType); }
    if (from) { conditions.push(`timestamp>=$${idx++}`); params.push(from); }
    if (to) { conditions.push(`timestamp<=$${idx++}`); params.push(to); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await db.query(`SELECT COUNT(*) FROM audit_events ${where}`, params);
    const total = parseInt(countRes.rows[0].count);

    params.push(limit, offset);
    const rows = await db.query(
      `SELECT * FROM audit_events ${where} ORDER BY timestamp DESC LIMIT $${idx++} OFFSET $${idx++}`,
      params
    );

    return { total, page, limit, data: rows.rows };
  },
};

// ─── break_glass_sessions ────────────────────────────────────────────────────

export const breakGlass = {
  async create({ userId, justification, expiresAt, ipAddress, userAgent }) {
    const db = getPool();
    const res = await db.query(
      `INSERT INTO break_glass_sessions (user_id, justification, expires_at, ip_address, user_agent)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [userId, justification, expiresAt, ipAddress, userAgent]
    );
    return res.rows[0];
  },

  async getActiveByUserId(userId) {
    const db = getPool();
    const res = await db.query(
      `SELECT * FROM break_glass_sessions
       WHERE user_id=$1 AND ended_at IS NULL AND expires_at>CURRENT_TIMESTAMP`,
      [userId]
    );
    return res.rows[0];
  },

  async getAll() {
    const db = getPool();
    const res = await db.query(
      `SELECT b.*, u.email FROM break_glass_sessions b
       JOIN users u ON b.user_id=u.id
       ORDER BY b.started_at DESC`
    );
    return res.rows;
  },

  async recordAction(sessionId, record) {
    const db = getPool();
    const res = await db.query(
      `UPDATE break_glass_sessions
       SET actions_taken = actions_taken || $2::jsonb
       WHERE id=$1 AND ended_at IS NULL AND expires_at>CURRENT_TIMESTAMP
       RETURNING *`,
      [sessionId, JSON.stringify(record)]
    );
    return res.rows[0];
  },

  async end(sessionId) {
    const db = getPool();
    const res = await db.query(
      `UPDATE break_glass_sessions SET ended_at=CURRENT_TIMESTAMP WHERE id=$1 RETURNING *`,
      [sessionId]
    );
    return res.rows[0];
  },
};

// ─── users (read-only in admin context) ─────────────────────────────────────

export const adminUsers = {
  async getAll() {
    const db = getPool();
    const res = await db.query(
      `SELECT id, email, first_name, last_name, role, active, created_at, updated_at
       FROM users ORDER BY created_at DESC`
    );
    return res.rows;
  },

  async getByEmail(email) {
    const db = getPool();
    const res = await db.query(
      `SELECT id, email, first_name, last_name, role, active, password_hash
       FROM users WHERE email=$1`,
      [email]
    );
    return res.rows[0];
  },

  async getById(id) {
    const db = getPool();
    const res = await db.query(
      `SELECT id, email, first_name, last_name, role, active, created_at, password_hash
       FROM users WHERE id=$1`,
      [id]
    );
    return res.rows[0];
  },

  async updateRole(userId, role) {
    const db = getPool();
    const res = await db.query(
      `UPDATE users SET role=$2, updated_at=CURRENT_TIMESTAMP WHERE id=$1 RETURNING id, email, role`,
      [userId, role]
    );
    return res.rows[0];
  },

  async getTotpSecret(userId) {
    const db = getPool();
    // Store TOTP secret in a dedicated column if it exists, else return null
    try {
      const res = await db.query(
        `SELECT totp_secret FROM users WHERE id=$1`,
        [userId]
      );
      return res.rows[0]?.totp_secret || null;
    } catch {
      return null;
    }
  },

  async setTotpSecret(userId, secret) {
    const db = getPool();
    try {
      await db.query(
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS totp_secret VARCHAR(200)`,
      );
      await db.query(
        `UPDATE users SET totp_secret=$2 WHERE id=$1`,
        [userId, secret]
      );
    } catch (e) {
      console.warn('Could not store TOTP secret:', e.message);
    }
  },
};
