CREATE TABLE IF NOT EXISTS projection_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content_type TEXT NOT NULL,
  content_ref TEXT,
  content_snapshot_json TEXT NOT NULL,
  projected_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_projection_history_projected ON projection_history(projected_at DESC);

INSERT OR IGNORE INTO hymns(id, number, title, category, author, lyrics_json, is_active)
VALUES (
  1,
  '001',
  'Amazing Grace',
  'Worship',
  'John Newton',
  '{"title":"Amazing Grace","number":"001","stanzas":["Amazing grace, how sweet the sound\nThat saved a wretch like me\nI once was lost, but now am found\nWas blind, but now I see","''Twas grace that taught my heart to fear\nAnd grace my fears relieved\nHow precious did that grace appear\nThe hour I first believed"],"chorus":""}',
  1
);

INSERT OR IGNORE INTO service_programs(id, title, service_date, notes, is_active)
VALUES (1, 'Sunday Worship Service', date('now'), 'Default service flow.', 1);

INSERT OR IGNORE INTO service_items(id, service_program_id, item_type, title, custom_content_json, position)
VALUES
  (1, 1, 'logo', 'Welcome / Logo', '{"type":"logo","title":"DLCF Legon","subtitle":"Deeper Life Campus Fellowship"}', 1),
  (2, 1, 'text', 'Opening Prayer', '{"type":"custom","title":"Opening Prayer","body":"Let us pray."}', 2),
  (3, 1, 'blank', 'Blank Screen', '{"type":"blank"}', 3);
