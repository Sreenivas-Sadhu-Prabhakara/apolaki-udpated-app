-- Apolaki Solar Platform - Netlify Neon Database Schema
-- This schema defines all tables for the solar platform

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

-- Contracts table
CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contract_type VARCHAR(100),
  title VARCHAR(255) DEFAULT 'Untitled Contract',
  provider VARCHAR(255) DEFAULT '',
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  term_months INTEGER,
  amount DECIMAL(12, 2),
  currency VARCHAR(10) DEFAULT 'USD',
  status VARCHAR(50) DEFAULT 'pending',
  renewal_option BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
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

-- Assessment Photos table
-- Photos live in a PRIVATE GCS bucket; this table tracks metadata and the
-- server-derived object_path. Access is only via short-lived signed URLs.
CREATE TABLE IF NOT EXISTS assessment_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  object_path TEXT NOT NULL,
  content_type VARCHAR(64) NOT NULL,
  size_bytes BIGINT,
  status VARCHAR(16) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  uploaded_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_assessment_photos_assessment_id ON assessment_photos(assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_photos_user_id ON assessment_photos(user_id);

-- ============================================================================
-- Installer Feed (anonymised contractor portfolio)
-- Contractors (role 'dealer' with dealer_profiles.type='installer') publish
-- posts about installations they commissioned. The feed is browsable by any
-- authenticated user but the contractor's identity is ANONYMISED behind a
-- stable pseudonymous handle (dealer_profiles.public_handle) unless the viewer
-- satisfies the identity-reveal predicate (see src/services/installerIdentity.js).
-- ============================================================================

-- Link an installation to the contractor who commissioned it (set during
-- dealer commission). Nullable; the installation owner remains solar_installations.user_id.
ALTER TABLE solar_installations ADD COLUMN IF NOT EXISTS installer_user_id UUID REFERENCES users(id);

-- Stable pseudonymous handle for a contractor, format INST-XXXXXXXX.
-- dealer_profiles is created by ensureMarketplaceSchema() in src/db.js; this
-- ALTER is guarded so applying schema.sql standalone does not fail when the
-- table has not been created yet.
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'dealer_profiles') THEN
    ALTER TABLE dealer_profiles ADD COLUMN IF NOT EXISTS public_handle VARCHAR(24) UNIQUE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS installer_feed_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  installer_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  installation_id UUID NOT NULL REFERENCES solar_installations(id) ON DELETE CASCADE,
  caption TEXT,
  status VARCHAR(16) NOT NULL DEFAULT 'published',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_installer_feed_posts_installer ON installer_feed_posts(installer_user_id);
CREATE INDEX IF NOT EXISTS idx_installer_feed_posts_installation ON installer_feed_posts(installation_id);
CREATE INDEX IF NOT EXISTS idx_installer_feed_posts_feed ON installer_feed_posts(status, created_at DESC);

-- Photos live in a PRIVATE GCS bucket; this table tracks metadata and the
-- server-derived object_path. Access is only via short-lived signed URLs.
CREATE TABLE IF NOT EXISTS installer_feed_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES installer_feed_posts(id) ON DELETE CASCADE,
  installer_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  object_path TEXT NOT NULL,
  content_type VARCHAR(64) NOT NULL,
  size_bytes BIGINT,
  status VARCHAR(16) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  uploaded_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_installer_feed_photos_post ON installer_feed_photos(post_id);
CREATE INDEX IF NOT EXISTS idx_installer_feed_photos_installer ON installer_feed_photos(installer_user_id);

-- Marketplace Products table
CREATE TABLE IF NOT EXISTS marketplace_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  manufacturer VARCHAR(255),
  description TEXT,
  specs JSONB DEFAULT '{}',
  price DECIMAL(12, 2),
  currency VARCHAR(10) DEFAULT 'USD',
  inventory INTEGER DEFAULT 0,
  rating DECIMAL(3, 2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  image_url VARCHAR(500),
  active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Marketplace Reviews table
CREATE TABLE IF NOT EXISTS marketplace_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES marketplace_products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(255),
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Wishlist table
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

-- Create indexes for better query performance
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
CREATE INDEX IF NOT EXISTS idx_marketplace_products_category ON marketplace_products(category);
CREATE INDEX IF NOT EXISTS idx_marketplace_reviews_product_id ON marketplace_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_reviews_user_id ON marketplace_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_user_id ON wishlist(user_id);

-- ============================================================================
-- Persona Roles:
--   customer    - End user / prosumer
--   dealer      - Installer / reseller
--   operations  - Field ops / maintenance engineer
--   admin       - Organization administrator
--   superadmin  - Break-glass emergency admin
--   installer   - Legacy alias for dealer (kept for backward compat)
-- ============================================================================

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

CREATE INDEX IF NOT EXISTS idx_break_glass_sessions_user_id ON break_glass_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_break_glass_sessions_status ON break_glass_sessions(status);

-- Password Reset Tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(500) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
