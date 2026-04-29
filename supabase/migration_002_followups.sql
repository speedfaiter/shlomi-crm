-- Migration 002: Follow-up tracking for WhatsApp automation
-- Run this in Supabase SQL editor AFTER migration.sql

-- Add follow-up tracking columns to leads
ALTER TABLE leads ADD COLUMN IF NOT EXISTS follow_up_count INTEGER DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_follow_up_at TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS whatsapp_opt_out BOOLEAN DEFAULT false;

-- Follow-up message log
CREATE TABLE IF NOT EXISTS follow_up_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  message_type TEXT NOT NULL,         -- welcome, follow_up_1, follow_up_2, follow_up_3, manual
  template TEXT NOT NULL,             -- template key used
  status TEXT DEFAULT 'sent',         -- sent, delivered, failed
  sent_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_follow_up_log_lead ON follow_up_log(lead_id);
CREATE INDEX idx_follow_up_log_sent ON follow_up_log(sent_at DESC);

-- RLS for follow_up_log
ALTER TABLE follow_up_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON follow_up_log
  FOR ALL USING (true) WITH CHECK (true);
