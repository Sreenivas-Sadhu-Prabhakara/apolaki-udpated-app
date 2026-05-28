import crypto from 'node:crypto';
import pkg from 'pg';

const { Pool } = pkg;

const databaseUrl = process.env.ADMIN_DATABASE_URL || process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL;
const isNeonUrl = databaseUrl?.includes('neon.tech') || databaseUrl?.includes('neon-');
const needsSsl = isNeonUrl || databaseUrl?.includes('sslmode=require') || process.env.DB_SSL === 'true';

export const pool = new Pool({
  connectionString: databaseUrl,
  ssl: needsSsl ? { rejectUnauthorized: false } : false,
  max: Number.parseInt(process.env.ADMIN_DB_POOL_MAX || '10', 10)
});

pool.on('connect', client => {
  client.query('SET search_path TO public').catch(() => {});
});

export async function query(text, params = []) {
  const result = await pool.query(text, params);
  return result.rows;
}

export async function ensureAdminSchema() {
  await query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS admin_totp_secret TEXT,
    ADD COLUMN IF NOT EXISTS admin_totp_enabled BOOLEAN DEFAULT false
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS admin_sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      ip_address VARCHAR(45),
      user_agent TEXT,
      admin_scope VARCHAR(20) NOT NULL CHECK (admin_scope IN ('admin', 'superadmin')),
      mfa_verified BOOLEAN DEFAULT false,
      refresh_token_hash TEXT,
      logged_in_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_active_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      revoked_at TIMESTAMP,
      revoked_by UUID REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS audit_events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      service VARCHAR(100) NOT NULL,
      actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
      actor_role VARCHAR(50),
      action VARCHAR(100) NOT NULL,
      resource_type VARCHAR(100),
      resource_id VARCHAR(255),
      before_state JSONB,
      after_state JSONB,
      ip_address VARCHAR(45),
      user_agent TEXT,
      status VARCHAR(50) DEFAULT 'success',
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await query('CREATE INDEX IF NOT EXISTS idx_admin_sessions_user_active ON admin_sessions(user_id, revoked_at, last_active_at)');
  await query('CREATE INDEX IF NOT EXISTS idx_audit_events_actor_id ON audit_events(actor_id)');
  await query('CREATE INDEX IF NOT EXISTS idx_audit_events_action ON audit_events(action)');
  await query('CREATE INDEX IF NOT EXISTS idx_audit_events_resource ON audit_events(resource_type, resource_id)');
  await query('CREATE INDEX IF NOT EXISTS idx_audit_events_timestamp ON audit_events(timestamp DESC)');
  await query('CREATE INDEX IF NOT EXISTS idx_audit_events_before_state ON audit_events USING GIN (before_state)');
  await query('CREATE INDEX IF NOT EXISTS idx_audit_events_after_state ON audit_events USING GIN (after_state)');
}

export async function checkReady() {
  await query('SELECT 1 AS ok');
}

export const users = {
  async getByEmail(email) {
    const rows = await query('SELECT * FROM users WHERE email = $1', [email]);
    return rows[0];
  },

  async getById(id) {
    const rows = await query('SELECT * FROM users WHERE id = $1', [id]);
    return rows[0];
  },

  async list() {
    return query(`
      SELECT id, email, first_name, last_name, phone, profile_picture_url, role, active,
             admin_totp_enabled, created_at, updated_at
      FROM users
      ORDER BY created_at DESC
    `);
  },

  async updateRole(id, role) {
    const rows = await query(
      `UPDATE users
       SET role = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING id, email, first_name, last_name, role, active, updated_at`,
      [id, role]
    );
    return rows[0];
  },

  async setTotpSecret(id, secret, enabled = false) {
    const rows = await query(
      `UPDATE users
       SET admin_totp_secret = $2, admin_totp_enabled = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING id, email, role, admin_totp_enabled`,
      [id, secret, enabled]
    );
    return rows[0];
  },

  async enableTotp(id) {
    const rows = await query(
      `UPDATE users
       SET admin_totp_enabled = true, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING id, email, role, admin_totp_enabled`,
      [id]
    );
    return rows[0];
  }
};

export const adminSessions = {
  async create({ userId, ipAddress, userAgent, adminScope, refreshToken }) {
    const refreshTokenHash = hashToken(refreshToken);
    const rows = await query(
      `INSERT INTO admin_sessions (user_id, ip_address, user_agent, admin_scope, refresh_token_hash)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, ipAddress, userAgent, adminScope, refreshTokenHash]
    );
    return rows[0];
  },

  async getActive(id) {
    const rows = await query(
      `SELECT s.*, u.email, u.role, u.active, u.admin_totp_secret, u.admin_totp_enabled,
              EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - s.last_active_at))::int AS idle_seconds
       FROM admin_sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.id = $1 AND s.revoked_at IS NULL`,
      [id]
    );
    return rows[0];
  },

  async touch(id) {
    const rows = await query(
      `UPDATE admin_sessions
       SET last_active_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND revoked_at IS NULL
       RETURNING *`,
      [id]
    );
    return rows[0];
  },

  async markMfaVerified(id) {
    const rows = await query(
      `UPDATE admin_sessions
       SET mfa_verified = true, last_active_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND revoked_at IS NULL
       RETURNING *`,
      [id]
    );
    return rows[0];
  },

  async revoke(id, revokedBy) {
    const rows = await query(
      `UPDATE admin_sessions
       SET revoked_at = CURRENT_TIMESTAMP, revoked_by = $2
       WHERE id = $1 AND revoked_at IS NULL
       RETURNING *`,
      [id, revokedBy]
    );
    return rows[0];
  },

  async listActive() {
    return query(`
      SELECT s.id, s.user_id, u.email, u.role, s.admin_scope, s.mfa_verified,
             s.ip_address, s.user_agent, s.logged_in_at, s.last_active_at
      FROM admin_sessions s
      JOIN users u ON u.id = s.user_id
      WHERE s.revoked_at IS NULL
      ORDER BY s.last_active_at DESC
    `);
  }
};

export const auditEvents = {
  async create({
    service = 'admin-service',
    actorId = null,
    actorRole = null,
    action,
    resourceType = null,
    resourceId = null,
    beforeState = null,
    afterState = null,
    ipAddress = null,
    userAgent = null,
    status = 'success'
  }) {
    const rows = await query(
      `INSERT INTO audit_events (
         service, actor_id, actor_role, action, resource_type, resource_id,
         before_state, after_state, ip_address, user_agent, status
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9, $10, $11)
       RETURNING *`,
      [
        service,
        actorId,
        actorRole,
        action,
        resourceType,
        resourceId,
        beforeState ? JSON.stringify(beforeState) : null,
        afterState ? JSON.stringify(afterState) : null,
        ipAddress,
        userAgent,
        status
      ]
    );
    return rows[0];
  },

  async search(filters = {}) {
    const page = Math.max(Number.parseInt(filters.page || '1', 10), 1);
    const limit = Math.min(Math.max(Number.parseInt(filters.limit || '50', 10), 1), 500);
    const offset = (page - 1) * limit;
    const clauses = [];
    const params = [];

    addFilter(clauses, params, 'actor_id', filters.actor_id);
    addFilter(clauses, params, 'action', filters.action);
    addFilter(clauses, params, 'resource_type', filters.resource_type);

    if (filters.from) {
      params.push(filters.from);
      clauses.push(`timestamp >= $${params.length}`);
    }
    if (filters.to) {
      params.push(filters.to);
      clauses.push(`timestamp <= $${params.length}`);
    }

    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const countRows = await query(`SELECT COUNT(*)::int AS total FROM audit_events ${where}`, params);
    const rows = await query(
      `SELECT * FROM audit_events ${where}
       ORDER BY timestamp DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    return { rows, page, limit, total: countRows[0]?.total || 0 };
  }
};

export const breakGlassSessions = {
  async create({ userId, justification, expiresAt, ipAddress, userAgent, signature }) {
    const rows = await query(
      `INSERT INTO break_glass_sessions (user_id, justification, expires_at, ip_address, user_agent, review_notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, justification, expiresAt, ipAddress, userAgent, signature ? `signature:${signature}` : null]
    );
    return rows[0];
  },

  async getActiveByUserId(userId) {
    const rows = await query(
      `SELECT * FROM break_glass_sessions
       WHERE user_id = $1 AND status = 'active' AND expires_at > CURRENT_TIMESTAMP
       ORDER BY started_at DESC LIMIT 1`,
      [userId]
    );
    return rows[0];
  },

  async getActive(id) {
    const rows = await query(
      `SELECT * FROM break_glass_sessions
       WHERE id = $1 AND status = 'active' AND expires_at > CURRENT_TIMESTAMP`,
      [id]
    );
    return rows[0];
  },

  async recordAction(id, action) {
    const rows = await query(
      `UPDATE break_glass_sessions
       SET actions_taken = actions_taken || $2::jsonb
       WHERE id = $1 AND status = 'active' AND expires_at > CURRENT_TIMESTAMP
       RETURNING *`,
      [id, JSON.stringify([action])]
    );
    return rows[0];
  },

  async end(id) {
    const rows = await query(
      `UPDATE break_glass_sessions
       SET status = 'ended', ended_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [id]
    );
    return rows[0];
  },

  async list(limit = 100) {
    return query(
      `SELECT * FROM break_glass_sessions
       ORDER BY started_at DESC
       LIMIT $1`,
      [limit]
    );
  }
};

function addFilter(clauses, params, column, value) {
  if (!value) return;
  params.push(value);
  clauses.push(`${column} = $${params.length}`);
}

export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}
