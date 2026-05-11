-- Rexvapes Database Schema
-- Run this in Supabase SQL Editor

-- Models table (vape device models)
CREATE TABLE IF NOT EXISTS models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  puffs INTEGER,
  price DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Flavors table
CREATE TABLE IF NOT EXISTS flavors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id UUID REFERENCES models(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_es TEXT,
  stock INTEGER DEFAULT 0,
  min_stock INTEGER DEFAULT 2,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Sales table
CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flavor_id UUID REFERENCES flavors(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  sold_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  notes TEXT
);

-- Restocks table
CREATE TABLE IF NOT EXISTS restocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flavor_id UUID REFERENCES flavors(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL,
  cost DECIMAL(10,2),
  restocked_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  notes TEXT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_flavors_model_id ON flavors(model_id);
CREATE INDEX IF NOT EXISTS idx_flavors_is_active ON flavors(is_active);
CREATE INDEX IF NOT EXISTS idx_sales_flavor_id ON sales(flavor_id);
CREATE INDEX IF NOT EXISTS idx_sales_sold_at ON sales(sold_at);
CREATE INDEX IF NOT EXISTS idx_restocks_flavor_id ON restocks(flavor_id);

-- Row Level Security (RLS) Policies

-- Enable RLS
ALTER TABLE models ENABLE ROW LEVEL SECURITY;
ALTER TABLE flavors ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE restocks ENABLE ROW LEVEL SECURITY;

-- Models: Public can read active models
CREATE POLICY "Public can read active models" ON models
  FOR SELECT USING (is_active = true);

-- Models: Authenticated users have full access
CREATE POLICY "Auth users full access to models" ON models
  FOR ALL USING (auth.role() = 'authenticated');

-- Flavors: Public can read active flavors
CREATE POLICY "Public can read active flavors" ON flavors
  FOR SELECT USING (is_active = true);

-- Flavors: Authenticated users have full access
CREATE POLICY "Auth users full access to flavors" ON flavors
  FOR ALL USING (auth.role() = 'authenticated');

-- Sales: Only authenticated users
CREATE POLICY "Auth users only for sales" ON sales
  FOR ALL USING (auth.role() = 'authenticated');

-- Restocks: Only authenticated users
CREATE POLICY "Auth users only for restocks" ON restocks
  FOR ALL USING (auth.role() = 'authenticated');
