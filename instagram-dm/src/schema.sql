CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
);

CREATE TABLE IF NOT EXISTS rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source TEXT NOT NULL DEFAULT 'comment', -- comment = תגובה על פוסט/ריל, story = תגובה לסטורי, dm = הודעה פרטית
  keyword TEXT NOT NULL,
  media_id TEXT,            -- רק לתגובות: NULL = כל הפוסטים והרילס
  media_label TEXT,
  media_thumb TEXT,
  message TEXT NOT NULL,
  button_text TEXT,         -- כפתור בהודעה (עד 20 תווים); NULL = בלי כפתור
  button_url TEXT,
  public_reply TEXT,        -- רק לתגובות: כמה נוסחים מופרדים בשורות; NULL = בלי תגובה פומבית
  follow_gate INTEGER NOT NULL DEFAULT 0, -- 0 = לינק ישר, 1 = הודעה מקדימה, 2 = מקדימה + עוקבים בלבד
  pre_text TEXT,
  flow INTEGER NOT NULL DEFAULT 0, -- 1 = במקום הודעה אחת, מתחיל את שאלון הלידים
  active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL
);

-- כל אירוע שהתאים לחוק: תגובה (לפי comment id) או הודעה (לפי message id)
CREATE TABLE IF NOT EXISTS sends (
  event_id TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  rule_id INTEGER,
  recipient_id TEXT,        -- להודעות: למי לענות. לתגובות: NULL (עונים לפי event_id)
  username TEXT,
  incoming_text TEXT,
  status TEXT NOT NULL,     -- pending / sent / failed
  error TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  sent_at INTEGER
);

CREATE INDEX IF NOT EXISTS sends_status ON sends (status, created_at);
CREATE INDEX IF NOT EXISTS sends_sent_at ON sends (sent_at);

-- שאלון לידים: איפה כל אדם נמצא בשאלון ומה ענה
CREATE TABLE IF NOT EXISTS leads (
  user_id TEXT PRIMARY KEY,
  username TEXT,
  source TEXT,
  step INTEGER NOT NULL DEFAULT 0,
  answers TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL,     -- active / done
  last_mid TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
