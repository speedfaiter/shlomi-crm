-- הרצה חד-פעמית על מסד קיים: מוסיף את שאלון הלידים
ALTER TABLE rules ADD COLUMN flow INTEGER NOT NULL DEFAULT 0;
CREATE TABLE IF NOT EXISTS leads (
  user_id TEXT PRIMARY KEY,
  username TEXT,
  source TEXT,
  step INTEGER NOT NULL DEFAULT 0,
  answers TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL,
  last_mid TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
