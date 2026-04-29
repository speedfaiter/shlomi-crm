-- Run this in your Supabase SQL editor to create the leads table

CREATE TABLE IF NOT EXISTS leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  city TEXT DEFAULT '',
  child_age INTEGER,
  source TEXT DEFAULT 'manual',       -- manual, ravmesser, facebook, website, referral
  status TEXT DEFAULT 'new',          -- new, contacted, interested, scheduled, closed, not_interested
  notes TEXT DEFAULT '',
  follow_up_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast status filtering
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_follow_up ON leads(follow_up_date);
CREATE INDEX idx_leads_created ON leads(created_at DESC);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Enable Row Level Security (open for now - add auth later)
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access" ON leads
  FOR ALL USING (true) WITH CHECK (true);
