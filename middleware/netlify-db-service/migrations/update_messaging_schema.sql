-- PRD 9: Upgrade Messaging with Read Receipts and Web Push Notifications

-- 1. Add tracking columns to messaging_messages
ALTER TABLE messaging_messages ADD COLUMN IF NOT EXISTS read_at TIMESTAMP;
ALTER TABLE messaging_messages ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP;

-- 2. Create push_subscriptions table for Web Push
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription_json JSONB NOT NULL,
  platform VARCHAR(50) DEFAULT 'web',
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, subscription_json)
);

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_messaging_messages_read ON messaging_messages(conversation_id, read_at) WHERE read_at IS NULL;

-- 4. Grant permissions to app role
GRANT SELECT, INSERT, UPDATE, DELETE ON push_subscriptions TO apolaki_app_rw;
