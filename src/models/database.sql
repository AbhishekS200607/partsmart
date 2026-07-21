-- PARTSMART Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Admins table
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rewards table
CREATE TABLE IF NOT EXISTS rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  image VARCHAR(500),
  probability DECIMAL(5,2) NOT NULL DEFAULT 10.00,
  inventory INTEGER NOT NULL DEFAULT 100,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Claims table
CREATE TABLE IF NOT EXISTS claims (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number VARCHAR(100) UNIQUE NOT NULL,
  reward_id UUID REFERENCES rewards(id),
  claimed_at TIMESTAMPTZ DEFAULT NOW(),
  device_fingerprint VARCHAR(255),
  ip_address VARCHAR(45),
  user_agent TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'redeemed', 'expired'))
);

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_claims_invoice ON claims(invoice_number);
CREATE INDEX IF NOT EXISTS idx_claims_claimed_at ON claims(claimed_at);
CREATE INDEX IF NOT EXISTS idx_claims_status ON claims(status);
CREATE INDEX IF NOT EXISTS idx_rewards_active ON rewards(active);

-- Default settings
INSERT INTO settings (key, value) VALUES
  ('promotion_status', 'active'),
  ('shop_name', 'PartSmart Auto'),
  ('logo', '')
ON CONFLICT (key) DO NOTHING;

-- Default rewards
INSERT INTO rewards (title, description, image, probability, inventory, active) VALUES
  ('Microfiber Cloth', 'Premium microfiber cleaning cloth', '🧹', 25.00, 500, true),
  ('Brake Cleaner', '500ml brake cleaner spray', '🔧', 20.00, 300, true),
  ('Engine Oil 500ml', 'Free 500ml engine oil top-up', '🛢️', 15.00, 200, true),
  ('Grease Tube', 'Multi-purpose grease tube', '⚙️', 15.00, 400, true),
  ('Oil Filter', 'Standard oil filter', '🔩', 10.00, 150, true),
  ('₹50 Discount', '₹50 off on next purchase', '💰', 8.00, 1000, true),
  ('Premium Engine Oil', '1L premium engine oil', '🏆', 5.00, 100, true),
  ('Special Gift', 'Mystery special gift', '🎁', 2.00, 50, true)
ON CONFLICT DO NOTHING;

-- Row Level Security
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Service role bypass (backend uses service key)
CREATE POLICY "Service role full access" ON admins FOR ALL USING (true);
CREATE POLICY "Service role full access" ON rewards FOR ALL USING (true);
CREATE POLICY "Service role full access" ON claims FOR ALL USING (true);
CREATE POLICY "Service role full access" ON settings FOR ALL USING (true);
