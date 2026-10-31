-- הרצה חד-פעמית על מסד קיים: הודעה מקדימה ועוקבים בלבד
ALTER TABLE rules ADD COLUMN follow_gate INTEGER NOT NULL DEFAULT 0;
ALTER TABLE rules ADD COLUMN pre_text TEXT;
