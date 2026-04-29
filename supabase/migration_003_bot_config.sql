-- Migration 003: Bot configuration table
-- Run this in Supabase SQL editor AFTER migration_002

-- Store bot configuration as a single JSON row
CREATE TABLE IF NOT EXISTS bot_config (
  id TEXT PRIMARY KEY DEFAULT 'default',
  business_name TEXT NOT NULL DEFAULT 'כושר וחינוך ילדים',
  classes JSONB NOT NULL DEFAULT '[
    {"id":"fitness","name":"כושר לילדים","ages":"5-8","emoji":"💪"},
    {"id":"gymnastics","name":"התעמלות ותנועה","ages":"6-10","emoji":"🤸"},
    {"id":"martial","name":"אומנויות לחימה","ages":"7-12","emoji":"🥋"},
    {"id":"athletics","name":"אתלטיקה קלה","ages":"8-14","emoji":"🏃"},
    {"id":"yoga","name":"יוגה לילדים","ages":"5-12","emoji":"🧘"}
  ]'::jsonb,
  pricing JSONB NOT NULL DEFAULT '{
    "once":{"label":"פעם בשבוע","price":"250₪/חודש"},
    "twice":{"label":"פעמיים בשבוע","price":"400₪/חודש"},
    "unlimited":{"label":"מנוי חופשי","price":"550₪/חודש"}
  }'::jsonb,
  location JSONB NOT NULL DEFAULT '{
    "address":"[הכנס כתובת כאן]",
    "hours":"א׳-ה׳ 14:00-20:00 | ו׳ 09:00-13:00",
    "mapsLink":"[הכנס קישור Google Maps]"
  }'::jsonb,
  welcome_message TEXT NOT NULL DEFAULT 'שלום! 👋 ברוכים הבאים ל*כושר וחינוך ילדים*!',
  menu_body TEXT NOT NULL DEFAULT 'איך אפשר לעזור? בחר מהתפריט 👇',
  menu_footer TEXT NOT NULL DEFAULT 'כושר וחינוך ילדים 🏋️',
  promo_text TEXT NOT NULL DEFAULT '🎁 *מבצע הצטרפות:*\nחודש ראשון ב-50% הנחה!',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default config
INSERT INTO bot_config (id) VALUES ('default') ON CONFLICT (id) DO NOTHING;

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_bot_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER bot_config_updated_at
  BEFORE UPDATE ON bot_config
  FOR EACH ROW
  EXECUTE FUNCTION update_bot_config_updated_at();

-- RLS
ALTER TABLE bot_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON bot_config
  FOR ALL USING (true) WITH CHECK (true);
