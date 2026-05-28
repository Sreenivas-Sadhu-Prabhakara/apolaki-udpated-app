-- ============================================================================
-- Apolaki Solar Platform - Database Initialization Script
-- This file is automatically executed when PostgreSQL container starts
-- Uses public schema to match the backend db.js queries
-- ============================================================================

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Use public schema
SET search_path TO public;

-- ============================================================================
-- Users & Auth Tables
-- ============================================================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE,
  password_hash VARCHAR(255),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  profile_picture_url VARCHAR(500),
  role VARCHAR(50) DEFAULT 'customer',
  admin_totp_secret TEXT,
  admin_totp_enabled BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- OAuth Providers table
CREATE TABLE IF NOT EXISTS oauth_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL,
  provider_id VARCHAR(255) NOT NULL,
  provider_email VARCHAR(255),
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP,
  raw_data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(provider, provider_id)
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_token VARCHAR(500) UNIQUE NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit Log table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(100),
  resource_id VARCHAR(255),
  changes JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  status VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Normalized append-first audit event stream owned by the Admin Control Plane
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
);

-- Admin Control Plane sessions. Regular app sessions never satisfy admin auth.
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
);

-- Application consent decisions, separate from OAuth identity grants
CREATE TABLE IF NOT EXISTS user_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  consent_key VARCHAR(100) NOT NULL,
  consent_version VARCHAR(20) NOT NULL,
  decision VARCHAR(20) NOT NULL CHECK (decision IN ('granted', 'declined', 'revoked')),
  purpose TEXT NOT NULL,
  data_scope JSONB DEFAULT '[]',
  granted_at TIMESTAMP,
  revoked_at TIMESTAMP,
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  source VARCHAR(50) NOT NULL DEFAULT 'onboarding',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, consent_key, consent_version)
);

-- ============================================================================
-- Solar Installation & Performance Tables
-- ============================================================================

-- Solar Installations table
CREATE TABLE IF NOT EXISTS solar_installations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  address VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(50),
  zip_code VARCHAR(10),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  capacity DECIMAL(10, 2),
  panel_count INTEGER,
  inverter_type VARCHAR(100),
  install_date TIMESTAMP,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Monitoring Data table
CREATE TABLE IF NOT EXISTS monitoring_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  installation_id UUID NOT NULL REFERENCES solar_installations(id) ON DELETE CASCADE,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  power_output DECIMAL(10, 2),
  voltage_ac DECIMAL(8, 2),
  current_ac DECIMAL(8, 2),
  frequency DECIMAL(6, 2),
  temperature DECIMAL(6, 2),
  efficiency DECIMAL(5, 2),
  status VARCHAR(50),
  error_code VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Performance Data table
CREATE TABLE IF NOT EXISTS performance_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  installation_id UUID NOT NULL REFERENCES solar_installations(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  energy_generated DECIMAL(10, 2),
  peak_power DECIMAL(10, 2),
  avg_efficiency DECIMAL(5, 2),
  downtime_minutes INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Maintenance Log table
CREATE TABLE IF NOT EXISTS maintenance_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  installation_id UUID NOT NULL REFERENCES solar_installations(id) ON DELETE CASCADE,
  maintenance_type VARCHAR(50),
  description TEXT,
  performed_date TIMESTAMP,
  completed_date TIMESTAMP,
  cost DECIMAL(10, 2),
  status VARCHAR(50) DEFAULT 'scheduled',
  technician VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- Business Tables
-- ============================================================================

-- Contracts table
CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contract_type VARCHAR(100),
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  term_months INTEGER,
  amount DECIMAL(12, 2),
  currency VARCHAR(10) DEFAULT 'USD',
  status VARCHAR(50) DEFAULT 'active',
  renewal_option BOOLEAN DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Assessments table
CREATE TABLE IF NOT EXISTS assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  address VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(50),
  zip_code VARCHAR(10),
  roof_condition VARCHAR(100),
  roof_area DECIMAL(10, 2),
  annual_usage DECIMAL(10, 2),
  sun_exposure VARCHAR(50),
  obstruction_level VARCHAR(50),
  recommended_capacity DECIMAL(10, 2),
  estimated_cost DECIMAL(12, 2),
  savings_estimate JSONB,
  status VARCHAR(50) DEFAULT 'draft',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Marketplace Products table
CREATE TABLE IF NOT EXISTS marketplace_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  description TEXT,
  price DECIMAL(12, 2),
  currency VARCHAR(10) DEFAULT 'USD',
  inventory INTEGER,
  rating DECIMAL(3, 2),
  active BOOLEAN DEFAULT true,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS marketplace_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES marketplace_products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  title VARCHAR(255),
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS wishlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES marketplace_products(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, product_id)
);

-- Finance table
CREATE TABLE IF NOT EXISTS finance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  transaction_id VARCHAR(255) UNIQUE,
  amount DECIMAL(12, 2),
  currency VARCHAR(10) DEFAULT 'USD',
  type VARCHAR(50),
  category VARCHAR(100),
  status VARCHAR(50) DEFAULT 'pending',
  transaction_date TIMESTAMP,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Break-Glass Sessions table (superadmin emergency access)
CREATE TABLE IF NOT EXISTS break_glass_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  justification TEXT NOT NULL,
  actions_taken JSONB DEFAULT '[]',
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  ended_at TIMESTAMP,
  status VARCHAR(50) DEFAULT 'active',
  ip_address VARCHAR(45),
  user_agent TEXT,
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP,
  review_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_oauth_providers_user_id ON oauth_providers(user_id);
CREATE INDEX IF NOT EXISTS idx_oauth_providers_provider_provider_id ON oauth_providers(provider, provider_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_session_token ON sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_user_active ON admin_sessions(user_id, revoked_at, last_active_at);
CREATE INDEX IF NOT EXISTS idx_audit_events_actor_id ON audit_events(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_action ON audit_events(action);
CREATE INDEX IF NOT EXISTS idx_audit_events_resource ON audit_events(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_timestamp ON audit_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_events_before_state ON audit_events USING GIN (before_state);
CREATE INDEX IF NOT EXISTS idx_audit_events_after_state ON audit_events USING GIN (after_state);
CREATE INDEX IF NOT EXISTS idx_user_consents_user_id ON user_consents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_consents_lookup ON user_consents(user_id, consent_key, decision);
CREATE INDEX IF NOT EXISTS idx_solar_installations_user_id ON solar_installations(user_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_data_installation_id ON monitoring_data(installation_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_data_timestamp ON monitoring_data(timestamp);
CREATE INDEX IF NOT EXISTS idx_performance_data_installation_id ON performance_data(installation_id);
CREATE INDEX IF NOT EXISTS idx_performance_data_date ON performance_data(date);
CREATE INDEX IF NOT EXISTS idx_maintenance_log_installation_id ON maintenance_log(installation_id);
CREATE INDEX IF NOT EXISTS idx_contracts_user_id ON contracts(user_id);
CREATE INDEX IF NOT EXISTS idx_finance_user_id ON finance(user_id);
CREATE INDEX IF NOT EXISTS idx_assessments_user_id ON assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_break_glass_sessions_user_id ON break_glass_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_break_glass_sessions_status ON break_glass_sessions(status);

-- ============================================================================
-- Least-Privilege Role Segregation
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'apolaki_app_rw') THEN
    CREATE ROLE apolaki_app_rw;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'apolaki_admin_rw') THEN
    CREATE ROLE apolaki_admin_rw;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'audit_writer') THEN
    CREATE ROLE audit_writer;
  END IF;
END
$$;

GRANT USAGE ON SCHEMA public TO apolaki_app_rw, apolaki_admin_rw, audit_writer;

GRANT SELECT, INSERT, UPDATE, DELETE ON users, oauth_providers, sessions, user_consents,
  solar_installations, contracts, finance, assessments, marketplace_reviews, wishlist,
  maintenance_log TO apolaki_app_rw;
GRANT SELECT ON marketplace_products, monitoring_data, performance_data TO apolaki_app_rw;

GRANT SELECT ON users TO apolaki_admin_rw;
GRANT UPDATE (role, active, admin_totp_secret, admin_totp_enabled, updated_at) ON users TO apolaki_admin_rw;
GRANT SELECT, INSERT, UPDATE ON admin_sessions, break_glass_sessions, audit_events TO apolaki_admin_rw;
GRANT SELECT ON audit_logs TO apolaki_admin_rw;
REVOKE ALL ON marketplace_products, monitoring_data, performance_data FROM apolaki_admin_rw;

GRANT INSERT ON audit_events TO audit_writer;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO apolaki_app_rw, apolaki_admin_rw, audit_writer;

-- ============================================================================
-- Seed marketplace products for demo
-- ============================================================================

INSERT INTO marketplace_products (name, category, description, price, inventory, rating) VALUES
('SunPower Maxeon 6 AC', 'panels', 'Premium residential solar panel with 22.8% efficiency, 410W output', 450.00, 500, 4.80),
('LG NeON R Prime', 'panels', 'High-performance monocrystalline panel, 380W, 25-year warranty', 380.00, 300, 4.70),
('Canadian Solar HiDM5', 'panels', 'Value-oriented mono PERC panel, 370W, great price-to-performance', 280.00, 800, 4.50),
('Enphase IQ8+', 'inverters', 'Microinverter with grid-forming capability, 300VA output', 220.00, 400, 4.90),
('SolarEdge SE7600H', 'inverters', 'HD-Wave string inverter with built-in EV charger support', 1800.00, 150, 4.60),
('Tesla Powerwall 3', 'batteries', '13.5 kWh home battery with integrated inverter, 11.5kW continuous', 8500.00, 80, 4.70),
('Enphase IQ Battery 5P', 'batteries', '5 kWh modular battery system, scalable up to 80 kWh', 5500.00, 120, 4.50),
('IronRidge XR100', 'mounting', 'Universal rail-based roof mounting system for residential', 150.00, 1000, 4.40),
('SolarEdge Home EV Charger', 'accessories', 'Smart EV charger with solar boost mode, 40A output', 900.00, 200, 4.60),
('Sense Home Energy Monitor', 'monitoring', 'Real-time home energy monitoring with solar tracking', 350.00, 300, 4.30)
ON CONFLICT DO NOTHING;
