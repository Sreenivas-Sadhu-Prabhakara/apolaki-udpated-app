/**
 * One-time migration from legacy audit_logs to normalized audit_events.
 *
 * Usage:
 *   DATABASE_URL=postgresql://... node scripts/migrate-audit-logs.js
 */

import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;
const databaseUrl = process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL or NETLIFY_DATABASE_URL is required.');
  process.exit(1);
}

const isNeonUrl = databaseUrl.includes('neon.tech') || databaseUrl.includes('neon-');
const pool = new Pool({
  connectionString: databaseUrl,
  ssl: isNeonUrl || process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

try {
  await pool.query(`
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

  const result = await pool.query(`
    INSERT INTO audit_events (
      id, service, actor_id, actor_role, action, resource_type, resource_id,
      after_state, ip_address, user_agent, status, timestamp
    )
    SELECT
      id,
      'netlify-db-service',
      user_id,
      NULL,
      action,
      resource_type,
      resource_id,
      changes,
      ip_address,
      user_agent,
      status,
      created_at
    FROM audit_logs
    ON CONFLICT (id) DO NOTHING
  `);

  console.log(`Migrated ${result.rowCount} legacy audit rows into audit_events.`);
} finally {
  await pool.end();
}
