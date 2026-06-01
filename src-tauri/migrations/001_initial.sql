CREATE TABLE IF NOT EXISTS app_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS hymns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  number TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL,
  category TEXT,
  author TEXT,
  lyrics_json TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_hymns_title ON hymns(title);
CREATE INDEX IF NOT EXISTS idx_hymns_number ON hymns(number);

CREATE TABLE IF NOT EXISTS announcements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  event_date TEXT,
  event_time TEXT,
  venue TEXT,
  image_path TEXT,
  category TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_announcements_active ON announcements(is_active, deleted_at);

CREATE TABLE IF NOT EXISTS personalities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name TEXT NOT NULL,
  department TEXT,
  role TEXT,
  favorite_scripture TEXT,
  short_bio TEXT,
  photo_path TEXT,
  week_date TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_personalities_week ON personalities(week_date, is_active);

CREATE TABLE IF NOT EXISTS service_programs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  service_date TEXT,
  notes TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS service_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  service_program_id INTEGER NOT NULL,
  item_type TEXT NOT NULL,
  title TEXT NOT NULL,
  linked_entity_id INTEGER,
  custom_content_json TEXT,
  position INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(service_program_id) REFERENCES service_programs(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_service_items_program ON service_items(service_program_id, position);

CREATE TABLE IF NOT EXISTS media_assets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at TEXT
);

INSERT OR IGNORE INTO app_settings(key, value) VALUES
  ('projection.fontSize', '72'),
  ('projection.transition', 'fade'),
  ('backup.autoEnabled', 'true'),
  ('scripture.version', 'KJV');
