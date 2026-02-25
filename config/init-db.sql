-- ============================================================================
-- Apolaki Solar Platform - Database Initialization Script
-- This file is automatically executed when PostgreSQL container starts
-- ============================================================================

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create schemas
CREATE SCHEMA IF NOT EXISTS public;
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS solar;
CREATE SCHEMA IF NOT EXISTS analytics;
CREATE SCHEMA IF NOT EXISTS trading;

-- ============================================================================
-- Auth Schema - User Authentication & Authorization
-- ============================================================================

CREATE TABLE IF NOT EXISTS auth.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    full_name VARCHAR(255),
    profile_image_url TEXT,
    email_verified BOOLEAN DEFAULT false,
    email_verified_at TIMESTAMP,
    two_factor_enabled BOOLEAN DEFAULT false,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP,
    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

CREATE TABLE IF NOT EXISTS auth.oauth_providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL, -- google, facebook, instagram
    provider_id VARCHAR(255) NOT NULL,
    provider_email VARCHAR(255),
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(provider, provider_id),
    UNIQUE(user_id, provider)
);

CREATE TABLE IF NOT EXISTS auth.roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    permissions JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS auth.user_roles (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES auth.roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (user_id, role_id)
);

-- ============================================================================
-- Solar Schema - Solar Installation & Performance Data
-- ============================================================================

CREATE TABLE IF NOT EXISTS solar.installations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100),
    installation_date DATE,
    capacity_kw DECIMAL(10, 2),
    panel_count INTEGER,
    panel_model VARCHAR(255),
    inverter_model VARCHAR(255),
    monitoring_device_id VARCHAR(100),
    status VARCHAR(50) DEFAULT 'active', -- active, inactive, maintenance
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS solar.performance_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    installation_id UUID NOT NULL REFERENCES solar.installations(id) ON DELETE CASCADE,
    timestamp TIMESTAMP NOT NULL,
    power_output_kw DECIMAL(10, 2),
    energy_generated_kwh DECIMAL(15, 3),
    irradiance_w_m2 DECIMAL(10, 2),
    temperature_celsius DECIMAL(5, 2),
    efficiency_percent DECIMAL(5, 2),
    created_at TIMESTAMP DEFAULT NOW(),
    INDEX (installation_id, timestamp)
);

-- ============================================================================
-- Analytics Schema - Aggregated Analytics Data
-- ============================================================================

CREATE TABLE IF NOT EXISTS analytics.daily_summaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    installation_id UUID NOT NULL REFERENCES solar.installations(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_energy_kwh DECIMAL(15, 3),
    peak_power_kw DECIMAL(10, 2),
    average_efficiency_percent DECIMAL(5, 2),
    weather_condition VARCHAR(100),
    revenue_generated DECIMAL(12, 2),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(installation_id, date)
);

-- ============================================================================
-- Trading Schema - Energy Trading
-- ============================================================================

CREATE TABLE IF NOT EXISTS trading.listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    installation_id UUID NOT NULL REFERENCES solar.installations(id) ON DELETE CASCADE,
    energy_available_kwh DECIMAL(15, 3) NOT NULL,
    price_per_kwh DECIMAL(8, 4) NOT NULL,
    available_from TIMESTAMP NOT NULL,
    available_until TIMESTAMP NOT NULL,
    status VARCHAR(50) DEFAULT 'available', -- available, sold, cancelled
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS trading.trades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID NOT NULL REFERENCES trading.listings(id) ON DELETE SET NULL,
    seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    energy_kwh DECIMAL(15, 3) NOT NULL,
    total_price DECIMAL(12, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- pending, completed, cancelled
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- Messaging Schema - Viber & Telegram Integration
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL, -- viber, telegram
    platform_user_id VARCHAR(255) NOT NULL,
    message_text TEXT,
    message_type VARCHAR(50), -- text, image, document
    direction VARCHAR(20), -- inbound, outbound
    status VARCHAR(50) DEFAULT 'received', -- received, read, delivered
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- Create Indexes for Performance
-- ============================================================================

CREATE INDEX idx_users_email ON auth.users(email);
CREATE INDEX idx_users_username ON auth.users(username);
CREATE INDEX idx_oauth_providers_user_id ON auth.oauth_providers(user_id);
CREATE INDEX idx_oauth_providers_provider ON auth.oauth_providers(provider);
CREATE INDEX idx_installations_user_id ON solar.installations(user_id);
CREATE INDEX idx_installations_location ON solar.installations(location_lat, location_lng);
CREATE INDEX idx_performance_metrics_installation ON solar.performance_metrics(installation_id);
CREATE INDEX idx_performance_metrics_timestamp ON solar.performance_metrics(timestamp);
CREATE INDEX idx_daily_summaries_date ON analytics.daily_summaries(date);
CREATE INDEX idx_listings_installation ON trading.listings(installation_id);
CREATE INDEX idx_listings_status ON trading.listings(status);
CREATE INDEX idx_trades_status ON trading.trades(status);
CREATE INDEX idx_chat_messages_user ON public.chat_messages(user_id);
CREATE INDEX idx_chat_messages_platform ON public.chat_messages(platform);

-- ============================================================================
-- Create Default Roles
-- ============================================================================

INSERT INTO auth.roles (name, description, permissions) VALUES
('admin', 'Administrator with full access', '{"*": true}'),
('installer', 'Solar installer', '{"installations:create": true, "installations:edit_own": true, "analytics:view": true}'),
('homeowner', 'Residential solar owner', '{"installations:view_own": true, "trading:list": true, "trading:sell": true, "analytics:view_own": true}'),
('trader', 'Energy trader', '{"trading:buy": true, "trading:sell": true, "analytics:view": true}'),
('support', 'Customer support', '{"users:view": true, "tickets:manage": true}')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- Create Search Indexes (using pg_trgm extension)
-- ============================================================================

CREATE INDEX idx_installations_name_search ON solar.installations USING GIN(name gin_trgm_ops);
CREATE INDEX idx_users_name_search ON auth.users USING GIN(full_name gin_trgm_ops);
