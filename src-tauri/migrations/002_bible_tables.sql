CREATE TABLE IF NOT EXISTS bible_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  abbreviation TEXT NOT NULL UNIQUE,
  language TEXT NOT NULL DEFAULT 'English',
  is_default INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS bible_books (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  abbreviation TEXT NOT NULL,
  testament TEXT NOT NULL,
  position INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS bible_verses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  version_id INTEGER NOT NULL,
  book_id INTEGER NOT NULL,
  chapter INTEGER NOT NULL,
  verse INTEGER NOT NULL,
  text TEXT NOT NULL,
  FOREIGN KEY(version_id) REFERENCES bible_versions(id) ON DELETE CASCADE,
  FOREIGN KEY(book_id) REFERENCES bible_books(id) ON DELETE CASCADE,
  UNIQUE(version_id, book_id, chapter, verse)
);

CREATE INDEX IF NOT EXISTS idx_bible_verses_reference ON bible_verses(version_id, book_id, chapter, verse);
CREATE INDEX IF NOT EXISTS idx_bible_verses_text ON bible_verses(text);

INSERT OR IGNORE INTO bible_versions(id, name, abbreviation, language, is_default)
VALUES (1, 'King James Version', 'KJV', 'English', 1);

INSERT OR IGNORE INTO bible_books(id, name, abbreviation, testament, position) VALUES
  (1, 'Genesis', 'Gen', 'Old', 1),
  (2, 'Psalm', 'Ps', 'Old', 19),
  (3, 'John', 'Jn', 'New', 43),
  (4, 'Romans', 'Rom', 'New', 45);

INSERT OR IGNORE INTO bible_verses(version_id, book_id, chapter, verse, text) VALUES
  (1, 1, 1, 1, 'In the beginning God created the heaven and the earth.'),
  (1, 1, 1, 2, 'And the earth was without form, and void; and darkness was upon the face of the deep.'),
  (1, 1, 1, 3, 'And God said, Let there be light: and there was light.'),
  (1, 1, 1, 4, 'And God saw the light, that it was good: and God divided the light from the darkness.'),
  (1, 1, 1, 5, 'And God called the light Day, and the darkness he called Night.'),
  (1, 2, 23, 1, 'The LORD is my shepherd; I shall not want.'),
  (1, 2, 23, 2, 'He maketh me to lie down in green pastures: he leadeth me beside the still waters.'),
  (1, 2, 23, 3, 'He restoreth my soul: he leadeth me in the paths of righteousness for his name''s sake.'),
  (1, 3, 3, 16, 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.'),
  (1, 4, 8, 28, 'And we know that all things work together for good to them that love God, to them who are the called according to his purpose.');
