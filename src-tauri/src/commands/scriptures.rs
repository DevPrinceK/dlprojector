use std::collections::{BTreeMap, HashMap};

use rusqlite::{params, Connection, OptionalExtension};
use tauri::State;

use crate::db::AppState;
use crate::error::{AppError, AppResult};
use crate::models::projection::ProjectionContent;
use crate::models::scripture::{
    BibleVerse, BibleVersion, ScriptureImportResult, ScriptureReference, ScriptureSearchResult,
};

const KJV_CSV: &str = include_str!("../../resources/scriptures/KJV.csv");

#[tauri::command]
pub fn search_scriptures(
    state: State<'_, AppState>,
    query: String,
    version: Option<String>,
) -> AppResult<Vec<ScriptureSearchResult>> {
    let conn = state.conn()?;
    let version = version.filter(|value| !value.trim().is_empty());
    let verses = if let Some(reference) = parse_reference(&query) {
        search_by_reference(&conn, &reference, version.as_deref())?
    } else {
        search_by_text(&conn, &query, version.as_deref())?
    };
    Ok(group_results(verses))
}

#[tauri::command]
pub fn get_scripture_range(
    state: State<'_, AppState>,
    reference: String,
) -> AppResult<Option<ScriptureSearchResult>> {
    Ok(search_scriptures(state, reference, None)?
        .into_iter()
        .next())
}

#[tauri::command]
pub fn list_bible_versions(state: State<'_, AppState>) -> AppResult<Vec<BibleVersion>> {
    let conn = state.conn()?;
    let mut statement = conn.prepare(
        "SELECT id, name, abbreviation, language, is_default
         FROM bible_versions
         ORDER BY is_default DESC, abbreviation ASC",
    )?;
    let rows = statement.query_map([], |row| {
        Ok(BibleVersion {
            id: row.get(0)?,
            name: row.get(1)?,
            abbreviation: row.get(2)?,
            language: row.get(3)?,
            is_default: row.get::<_, i64>(4)? == 1,
        })
    })?;
    let mut versions = Vec::new();
    for row in rows {
        versions.push(row?);
    }
    Ok(versions)
}

#[tauri::command]
pub fn get_recent_scriptures(state: State<'_, AppState>) -> AppResult<Vec<ScriptureSearchResult>> {
    let conn = state.conn()?;
    let mut statement = conn.prepare(
        "SELECT content_snapshot_json
         FROM projection_history
         WHERE content_type = 'scripture'
         ORDER BY projected_at DESC
         LIMIT 8",
    )?;

    let rows = statement.query_map([], |row| row.get::<_, String>(0))?;
    let mut results = Vec::new();

    for row in rows {
        let snapshot = row?;
        let content: ProjectionContent = serde_json::from_str(&snapshot)?;
        if let Some(metadata) = content.metadata {
            if let Some(result) = metadata.get("result") {
                if let Ok(parsed) = serde_json::from_value::<ScriptureSearchResult>(result.clone())
                {
                    results.push(parsed);
                }
            }
        }
    }

    Ok(results)
}

#[tauri::command]
pub fn import_bundled_kjv(state: State<'_, AppState>) -> AppResult<ScriptureImportResult> {
    import_bible_csv(
        state,
        "KJV".to_string(),
        "King James Version".to_string(),
        KJV_CSV.to_string(),
        Some(true),
    )
}

#[tauri::command]
pub fn import_bible_csv(
    state: State<'_, AppState>,
    abbreviation: String,
    name: String,
    csv_text: String,
    make_default: Option<bool>,
) -> AppResult<ScriptureImportResult> {
    let abbreviation = abbreviation.trim().to_uppercase();
    let name = name.trim().to_string();
    if abbreviation.is_empty() || name.is_empty() {
        return Err(AppError::Validation(
            "Bible version name and abbreviation are required.".to_string(),
        ));
    }

    let mut conn = state.conn()?;
    let tx = conn.transaction()?;

    if make_default.unwrap_or(false) {
        tx.execute("UPDATE bible_versions SET is_default = 0", [])?;
    }
    tx.execute(
        "INSERT INTO bible_versions(name, abbreviation, language, is_default)
         VALUES (?1, ?2, 'English', ?3)
         ON CONFLICT(abbreviation) DO UPDATE SET
           name = excluded.name,
           language = excluded.language,
           is_default = CASE WHEN excluded.is_default = 1 THEN 1 ELSE bible_versions.is_default END",
        params![name, abbreviation, make_default.unwrap_or(false)],
    )?;
    let version_id: i64 = tx.query_row(
        "SELECT id FROM bible_versions WHERE abbreviation = ?1",
        params![abbreviation],
        |row| row.get(0),
    )?;

    let mut reader = csv::Reader::from_reader(csv_text.as_bytes());
    let mut book_ids: HashMap<String, i64> = HashMap::new();
    let mut verses_imported = 0_i64;

    for row in reader.deserialize::<KjvCsvRow>() {
        let row =
            row.map_err(|error| AppError::Message(format!("Could not parse Bible CSV: {error}")))?;
        let book = book_info(&row.book)?;
        let book_id = if let Some(id) = book_ids.get(book.name) {
            *id
        } else {
            let id = ensure_book(&tx, book)?;
            book_ids.insert(book.name.to_string(), id);
            id
        };

        tx.execute(
            "INSERT INTO bible_verses(version_id, book_id, chapter, verse, text)
             VALUES (?1, ?2, ?3, ?4, ?5)
             ON CONFLICT(version_id, book_id, chapter, verse) DO UPDATE SET text = excluded.text",
            params![version_id, book_id, row.chapter, row.verse, row.text.trim()],
        )?;
        verses_imported += 1;
    }

    tx.execute(
        "INSERT INTO app_settings(key, value, created_at, updated_at)
         VALUES (?1, datetime('now'), datetime('now'), datetime('now'))
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')",
        params![format!("scripture.import.{}", abbreviation.to_lowercase())],
    )?;

    tx.commit()?;

    let verses_total: i64 = conn.query_row(
        "SELECT COUNT(*) FROM bible_verses WHERE version_id = ?1",
        params![version_id],
        |row| row.get(0),
    )?;

    Ok(ScriptureImportResult {
        version: abbreviation,
        books_imported: book_ids.len() as i64,
        verses_imported,
        verses_total,
    })
}

fn search_by_reference(
    conn: &Connection,
    reference: &ScriptureReference,
    version: Option<&str>,
) -> AppResult<Vec<BibleVerse>> {
    let start = reference.verse_start.unwrap_or(1);
    let end = reference.verse_end.unwrap_or(i64::MAX);
    let mut statement = conn.prepare(
        "SELECT v.id, v.version_id, v.book_id, b.name, v.chapter, v.verse, v.text, bv.abbreviation
         FROM bible_verses v
         JOIN bible_books b ON b.id = v.book_id
         JOIN bible_versions bv ON bv.id = v.version_id
         WHERE lower(b.name) = lower(?1)
           AND v.chapter = ?2
           AND v.verse BETWEEN ?3 AND ?4
           AND (?5 IS NULL AND bv.is_default = 1 OR bv.abbreviation = ?5)
         ORDER BY v.verse ASC",
    )?;

    let rows = statement.query_map(
        params![reference.book, reference.chapter, start, end, version],
        map_bible_verse,
    )?;
    let mut verses = Vec::new();
    for row in rows {
        verses.push(row?);
    }
    Ok(verses)
}

fn search_by_text(
    conn: &Connection,
    query: &str,
    version: Option<&str>,
) -> AppResult<Vec<BibleVerse>> {
    let like_query = format!("%{}%", query.trim());
    let mut statement = conn.prepare(
        "SELECT v.id, v.version_id, v.book_id, b.name, v.chapter, v.verse, v.text, bv.abbreviation
         FROM bible_verses v
         JOIN bible_books b ON b.id = v.book_id
         JOIN bible_versions bv ON bv.id = v.version_id
         WHERE (v.text LIKE ?1 OR b.name LIKE ?1)
           AND (?2 IS NULL AND bv.is_default = 1 OR bv.abbreviation = ?2)
         ORDER BY b.position ASC, v.chapter ASC, v.verse ASC
         LIMIT 60",
    )?;

    let rows = statement.query_map(params![like_query, version], map_bible_verse)?;
    let mut items = Vec::new();
    for row in rows {
        items.push(row?);
    }
    Ok(items)
}

fn map_bible_verse(row: &rusqlite::Row<'_>) -> rusqlite::Result<BibleVerse> {
    Ok(BibleVerse {
        id: row.get(0)?,
        version_id: row.get(1)?,
        book_id: row.get(2)?,
        book_name: row.get(3)?,
        chapter: row.get(4)?,
        verse: row.get(5)?,
        text: row.get(6)?,
        version: row.get(7)?,
    })
}

fn group_results(verses: Vec<BibleVerse>) -> Vec<ScriptureSearchResult> {
    let mut groups: BTreeMap<String, Vec<BibleVerse>> = BTreeMap::new();
    for verse in verses {
        let key = format!("{} {}", verse.book_name, verse.chapter);
        groups.entry(key).or_default().push(verse);
    }

    groups
        .into_iter()
        .filter_map(|(chapter_ref, mut verses)| {
            verses.sort_by_key(|verse| verse.verse);
            let first = verses.first()?.clone();
            let last = verses.last()?.clone();
            let reference = if first.verse == last.verse {
                format!("{}:{}", chapter_ref, first.verse)
            } else {
                format!("{}:{}-{}", chapter_ref, first.verse, last.verse)
            };

            Some(ScriptureSearchResult {
                reference,
                version: first.version,
                verses,
            })
        })
        .collect()
}

fn parse_reference(query: &str) -> Option<ScriptureReference> {
    let normalized = query.trim().replace("  ", " ");
    let split_index = normalized.rfind(' ')?;
    let raw_book = normalized[..split_index].trim();
    let raw_reference = normalized[split_index + 1..].trim();
    let (chapter_part, verse_part) = raw_reference
        .split_once(':')
        .map_or((raw_reference, None), |(chapter, verse)| {
            (chapter, Some(verse))
        });

    let chapter = chapter_part.parse::<i64>().ok()?;
    if chapter < 1 {
        return None;
    }

    let (verse_start, verse_end) = if let Some(verse_part) = verse_part {
        let (start, end) = verse_part
            .split_once('-')
            .map_or((verse_part, verse_part), |(start, end)| (start, end));
        let parsed_start = start.trim().parse::<i64>().ok()?;
        let parsed_end = end.trim().parse::<i64>().ok()?;
        if parsed_start < 1 || parsed_end < parsed_start {
            return None;
        }
        (Some(parsed_start), Some(parsed_end))
    } else {
        (None, None)
    };

    Some(ScriptureReference {
        book: normalize_book(raw_book).ok()?,
        chapter,
        verse_start,
        verse_end,
    })
}

fn normalize_book(book: &str) -> AppResult<String> {
    let trimmed = book.trim();
    if trimmed.is_empty() {
        return Err(AppError::Validation("Book is required.".to_string()));
    }

    let canonical = canonical_book_name(trimmed).unwrap_or(trimmed);
    Ok(canonical.to_string())
}

#[derive(Debug, serde::Deserialize)]
#[serde(rename_all = "PascalCase")]
struct KjvCsvRow {
    book: String,
    chapter: i64,
    verse: i64,
    text: String,
}

#[derive(Debug, Clone, Copy)]
struct BookInfo {
    source: &'static str,
    name: &'static str,
    abbreviation: &'static str,
    testament: &'static str,
    position: i64,
}

fn ensure_book(conn: &Connection, book: BookInfo) -> AppResult<i64> {
    conn.execute(
        "INSERT INTO bible_books(name, abbreviation, testament, position)
         VALUES (?1, ?2, ?3, ?4)
         ON CONFLICT(name) DO UPDATE SET
           abbreviation = excluded.abbreviation,
           testament = excluded.testament,
           position = excluded.position",
        params![book.name, book.abbreviation, book.testament, book.position],
    )?;

    conn.query_row(
        "SELECT id FROM bible_books WHERE name = ?1",
        params![book.name],
        |row| row.get(0),
    )
    .optional()?
    .ok_or_else(|| AppError::Message(format!("Could not load Bible book {}.", book.name)))
}

fn book_info(source_name: &str) -> AppResult<BookInfo> {
    BOOKS
        .iter()
        .copied()
        .find(|book| book.source.eq_ignore_ascii_case(source_name.trim()))
        .ok_or_else(|| {
            AppError::Validation(format!("Unsupported Bible book in KJV CSV: {source_name}"))
        })
}

fn canonical_book_name(book: &str) -> Option<&'static str> {
    let normalized = book
        .trim()
        .to_lowercase()
        .replace('.', "")
        .replace("  ", " ");

    BOOK_ALIASES
        .iter()
        .find_map(|(alias, canonical)| (*alias == normalized).then_some(*canonical))
}

const BOOK_ALIASES: &[(&str, &str)] = &[
    ("gen", "Genesis"),
    ("genesis", "Genesis"),
    ("ex", "Exodus"),
    ("exo", "Exodus"),
    ("exodus", "Exodus"),
    ("lev", "Leviticus"),
    ("leviticus", "Leviticus"),
    ("num", "Numbers"),
    ("numbers", "Numbers"),
    ("deut", "Deuteronomy"),
    ("deuteronomy", "Deuteronomy"),
    ("josh", "Joshua"),
    ("joshua", "Joshua"),
    ("judg", "Judges"),
    ("judges", "Judges"),
    ("ruth", "Ruth"),
    ("1 sam", "1 Samuel"),
    ("1 samuel", "1 Samuel"),
    ("i samuel", "1 Samuel"),
    ("2 sam", "2 Samuel"),
    ("2 samuel", "2 Samuel"),
    ("ii samuel", "2 Samuel"),
    ("1 kings", "1 Kings"),
    ("i kings", "1 Kings"),
    ("2 kings", "2 Kings"),
    ("ii kings", "2 Kings"),
    ("1 chron", "1 Chronicles"),
    ("1 chronicles", "1 Chronicles"),
    ("i chronicles", "1 Chronicles"),
    ("2 chron", "2 Chronicles"),
    ("2 chronicles", "2 Chronicles"),
    ("ii chronicles", "2 Chronicles"),
    ("ezra", "Ezra"),
    ("neh", "Nehemiah"),
    ("nehemiah", "Nehemiah"),
    ("est", "Esther"),
    ("esther", "Esther"),
    ("job", "Job"),
    ("ps", "Psalm"),
    ("psalm", "Psalm"),
    ("psalms", "Psalm"),
    ("prov", "Proverbs"),
    ("proverbs", "Proverbs"),
    ("eccl", "Ecclesiastes"),
    ("ecclesiastes", "Ecclesiastes"),
    ("song", "Song of Solomon"),
    ("song of solomon", "Song of Solomon"),
    ("isa", "Isaiah"),
    ("isaiah", "Isaiah"),
    ("jer", "Jeremiah"),
    ("jeremiah", "Jeremiah"),
    ("lam", "Lamentations"),
    ("lamentations", "Lamentations"),
    ("ezek", "Ezekiel"),
    ("ezekiel", "Ezekiel"),
    ("dan", "Daniel"),
    ("daniel", "Daniel"),
    ("hos", "Hosea"),
    ("hosea", "Hosea"),
    ("joel", "Joel"),
    ("amos", "Amos"),
    ("obad", "Obadiah"),
    ("obadiah", "Obadiah"),
    ("jonah", "Jonah"),
    ("mic", "Micah"),
    ("micah", "Micah"),
    ("nah", "Nahum"),
    ("nahum", "Nahum"),
    ("hab", "Habakkuk"),
    ("habakkuk", "Habakkuk"),
    ("zeph", "Zephaniah"),
    ("zephaniah", "Zephaniah"),
    ("hag", "Haggai"),
    ("haggai", "Haggai"),
    ("zech", "Zechariah"),
    ("zechariah", "Zechariah"),
    ("mal", "Malachi"),
    ("malachi", "Malachi"),
    ("matt", "Matthew"),
    ("matthew", "Matthew"),
    ("mk", "Mark"),
    ("mark", "Mark"),
    ("lk", "Luke"),
    ("luke", "Luke"),
    ("jn", "John"),
    ("john", "John"),
    ("acts", "Acts"),
    ("rom", "Romans"),
    ("romans", "Romans"),
    ("1 cor", "1 Corinthians"),
    ("1 corinthians", "1 Corinthians"),
    ("i corinthians", "1 Corinthians"),
    ("2 cor", "2 Corinthians"),
    ("2 corinthians", "2 Corinthians"),
    ("ii corinthians", "2 Corinthians"),
    ("gal", "Galatians"),
    ("galatians", "Galatians"),
    ("eph", "Ephesians"),
    ("ephesians", "Ephesians"),
    ("phil", "Philippians"),
    ("philippians", "Philippians"),
    ("col", "Colossians"),
    ("colossians", "Colossians"),
    ("1 thess", "1 Thessalonians"),
    ("1 thessalonians", "1 Thessalonians"),
    ("i thessalonians", "1 Thessalonians"),
    ("2 thess", "2 Thessalonians"),
    ("2 thessalonians", "2 Thessalonians"),
    ("ii thessalonians", "2 Thessalonians"),
    ("1 tim", "1 Timothy"),
    ("1 timothy", "1 Timothy"),
    ("i timothy", "1 Timothy"),
    ("2 tim", "2 Timothy"),
    ("2 timothy", "2 Timothy"),
    ("ii timothy", "2 Timothy"),
    ("titus", "Titus"),
    ("philem", "Philemon"),
    ("philemon", "Philemon"),
    ("heb", "Hebrews"),
    ("hebrews", "Hebrews"),
    ("jas", "James"),
    ("james", "James"),
    ("1 pet", "1 Peter"),
    ("1 peter", "1 Peter"),
    ("i peter", "1 Peter"),
    ("2 pet", "2 Peter"),
    ("2 peter", "2 Peter"),
    ("ii peter", "2 Peter"),
    ("1 john", "1 John"),
    ("i john", "1 John"),
    ("2 john", "2 John"),
    ("ii john", "2 John"),
    ("3 john", "3 John"),
    ("iii john", "3 John"),
    ("jude", "Jude"),
    ("rev", "Revelation"),
    ("revelation", "Revelation"),
    ("revelation of john", "Revelation"),
];

const BOOKS: &[BookInfo] = &[
    BookInfo {
        source: "Genesis",
        name: "Genesis",
        abbreviation: "Gen",
        testament: "Old",
        position: 1,
    },
    BookInfo {
        source: "Exodus",
        name: "Exodus",
        abbreviation: "Ex",
        testament: "Old",
        position: 2,
    },
    BookInfo {
        source: "Leviticus",
        name: "Leviticus",
        abbreviation: "Lev",
        testament: "Old",
        position: 3,
    },
    BookInfo {
        source: "Numbers",
        name: "Numbers",
        abbreviation: "Num",
        testament: "Old",
        position: 4,
    },
    BookInfo {
        source: "Deuteronomy",
        name: "Deuteronomy",
        abbreviation: "Deut",
        testament: "Old",
        position: 5,
    },
    BookInfo {
        source: "Joshua",
        name: "Joshua",
        abbreviation: "Josh",
        testament: "Old",
        position: 6,
    },
    BookInfo {
        source: "Judges",
        name: "Judges",
        abbreviation: "Judg",
        testament: "Old",
        position: 7,
    },
    BookInfo {
        source: "Ruth",
        name: "Ruth",
        abbreviation: "Ruth",
        testament: "Old",
        position: 8,
    },
    BookInfo {
        source: "I Samuel",
        name: "1 Samuel",
        abbreviation: "1 Sam",
        testament: "Old",
        position: 9,
    },
    BookInfo {
        source: "II Samuel",
        name: "2 Samuel",
        abbreviation: "2 Sam",
        testament: "Old",
        position: 10,
    },
    BookInfo {
        source: "I Kings",
        name: "1 Kings",
        abbreviation: "1 Kgs",
        testament: "Old",
        position: 11,
    },
    BookInfo {
        source: "II Kings",
        name: "2 Kings",
        abbreviation: "2 Kgs",
        testament: "Old",
        position: 12,
    },
    BookInfo {
        source: "I Chronicles",
        name: "1 Chronicles",
        abbreviation: "1 Chr",
        testament: "Old",
        position: 13,
    },
    BookInfo {
        source: "II Chronicles",
        name: "2 Chronicles",
        abbreviation: "2 Chr",
        testament: "Old",
        position: 14,
    },
    BookInfo {
        source: "Ezra",
        name: "Ezra",
        abbreviation: "Ezra",
        testament: "Old",
        position: 15,
    },
    BookInfo {
        source: "Nehemiah",
        name: "Nehemiah",
        abbreviation: "Neh",
        testament: "Old",
        position: 16,
    },
    BookInfo {
        source: "Esther",
        name: "Esther",
        abbreviation: "Est",
        testament: "Old",
        position: 17,
    },
    BookInfo {
        source: "Job",
        name: "Job",
        abbreviation: "Job",
        testament: "Old",
        position: 18,
    },
    BookInfo {
        source: "Psalms",
        name: "Psalm",
        abbreviation: "Ps",
        testament: "Old",
        position: 19,
    },
    BookInfo {
        source: "Proverbs",
        name: "Proverbs",
        abbreviation: "Prov",
        testament: "Old",
        position: 20,
    },
    BookInfo {
        source: "Ecclesiastes",
        name: "Ecclesiastes",
        abbreviation: "Eccl",
        testament: "Old",
        position: 21,
    },
    BookInfo {
        source: "Song of Solomon",
        name: "Song of Solomon",
        abbreviation: "Song",
        testament: "Old",
        position: 22,
    },
    BookInfo {
        source: "Isaiah",
        name: "Isaiah",
        abbreviation: "Isa",
        testament: "Old",
        position: 23,
    },
    BookInfo {
        source: "Jeremiah",
        name: "Jeremiah",
        abbreviation: "Jer",
        testament: "Old",
        position: 24,
    },
    BookInfo {
        source: "Lamentations",
        name: "Lamentations",
        abbreviation: "Lam",
        testament: "Old",
        position: 25,
    },
    BookInfo {
        source: "Ezekiel",
        name: "Ezekiel",
        abbreviation: "Ezek",
        testament: "Old",
        position: 26,
    },
    BookInfo {
        source: "Daniel",
        name: "Daniel",
        abbreviation: "Dan",
        testament: "Old",
        position: 27,
    },
    BookInfo {
        source: "Hosea",
        name: "Hosea",
        abbreviation: "Hos",
        testament: "Old",
        position: 28,
    },
    BookInfo {
        source: "Joel",
        name: "Joel",
        abbreviation: "Joel",
        testament: "Old",
        position: 29,
    },
    BookInfo {
        source: "Amos",
        name: "Amos",
        abbreviation: "Amos",
        testament: "Old",
        position: 30,
    },
    BookInfo {
        source: "Obadiah",
        name: "Obadiah",
        abbreviation: "Obad",
        testament: "Old",
        position: 31,
    },
    BookInfo {
        source: "Jonah",
        name: "Jonah",
        abbreviation: "Jonah",
        testament: "Old",
        position: 32,
    },
    BookInfo {
        source: "Micah",
        name: "Micah",
        abbreviation: "Mic",
        testament: "Old",
        position: 33,
    },
    BookInfo {
        source: "Nahum",
        name: "Nahum",
        abbreviation: "Nah",
        testament: "Old",
        position: 34,
    },
    BookInfo {
        source: "Habakkuk",
        name: "Habakkuk",
        abbreviation: "Hab",
        testament: "Old",
        position: 35,
    },
    BookInfo {
        source: "Zephaniah",
        name: "Zephaniah",
        abbreviation: "Zeph",
        testament: "Old",
        position: 36,
    },
    BookInfo {
        source: "Haggai",
        name: "Haggai",
        abbreviation: "Hag",
        testament: "Old",
        position: 37,
    },
    BookInfo {
        source: "Zechariah",
        name: "Zechariah",
        abbreviation: "Zech",
        testament: "Old",
        position: 38,
    },
    BookInfo {
        source: "Malachi",
        name: "Malachi",
        abbreviation: "Mal",
        testament: "Old",
        position: 39,
    },
    BookInfo {
        source: "Matthew",
        name: "Matthew",
        abbreviation: "Matt",
        testament: "New",
        position: 40,
    },
    BookInfo {
        source: "Mark",
        name: "Mark",
        abbreviation: "Mk",
        testament: "New",
        position: 41,
    },
    BookInfo {
        source: "Luke",
        name: "Luke",
        abbreviation: "Lk",
        testament: "New",
        position: 42,
    },
    BookInfo {
        source: "John",
        name: "John",
        abbreviation: "Jn",
        testament: "New",
        position: 43,
    },
    BookInfo {
        source: "Acts",
        name: "Acts",
        abbreviation: "Acts",
        testament: "New",
        position: 44,
    },
    BookInfo {
        source: "Romans",
        name: "Romans",
        abbreviation: "Rom",
        testament: "New",
        position: 45,
    },
    BookInfo {
        source: "I Corinthians",
        name: "1 Corinthians",
        abbreviation: "1 Cor",
        testament: "New",
        position: 46,
    },
    BookInfo {
        source: "II Corinthians",
        name: "2 Corinthians",
        abbreviation: "2 Cor",
        testament: "New",
        position: 47,
    },
    BookInfo {
        source: "Galatians",
        name: "Galatians",
        abbreviation: "Gal",
        testament: "New",
        position: 48,
    },
    BookInfo {
        source: "Ephesians",
        name: "Ephesians",
        abbreviation: "Eph",
        testament: "New",
        position: 49,
    },
    BookInfo {
        source: "Philippians",
        name: "Philippians",
        abbreviation: "Phil",
        testament: "New",
        position: 50,
    },
    BookInfo {
        source: "Colossians",
        name: "Colossians",
        abbreviation: "Col",
        testament: "New",
        position: 51,
    },
    BookInfo {
        source: "I Thessalonians",
        name: "1 Thessalonians",
        abbreviation: "1 Thess",
        testament: "New",
        position: 52,
    },
    BookInfo {
        source: "II Thessalonians",
        name: "2 Thessalonians",
        abbreviation: "2 Thess",
        testament: "New",
        position: 53,
    },
    BookInfo {
        source: "I Timothy",
        name: "1 Timothy",
        abbreviation: "1 Tim",
        testament: "New",
        position: 54,
    },
    BookInfo {
        source: "II Timothy",
        name: "2 Timothy",
        abbreviation: "2 Tim",
        testament: "New",
        position: 55,
    },
    BookInfo {
        source: "Titus",
        name: "Titus",
        abbreviation: "Titus",
        testament: "New",
        position: 56,
    },
    BookInfo {
        source: "Philemon",
        name: "Philemon",
        abbreviation: "Philem",
        testament: "New",
        position: 57,
    },
    BookInfo {
        source: "Hebrews",
        name: "Hebrews",
        abbreviation: "Heb",
        testament: "New",
        position: 58,
    },
    BookInfo {
        source: "James",
        name: "James",
        abbreviation: "Jas",
        testament: "New",
        position: 59,
    },
    BookInfo {
        source: "I Peter",
        name: "1 Peter",
        abbreviation: "1 Pet",
        testament: "New",
        position: 60,
    },
    BookInfo {
        source: "II Peter",
        name: "2 Peter",
        abbreviation: "2 Pet",
        testament: "New",
        position: 61,
    },
    BookInfo {
        source: "I John",
        name: "1 John",
        abbreviation: "1 Jn",
        testament: "New",
        position: 62,
    },
    BookInfo {
        source: "II John",
        name: "2 John",
        abbreviation: "2 Jn",
        testament: "New",
        position: 63,
    },
    BookInfo {
        source: "III John",
        name: "3 John",
        abbreviation: "3 Jn",
        testament: "New",
        position: 64,
    },
    BookInfo {
        source: "Jude",
        name: "Jude",
        abbreviation: "Jude",
        testament: "New",
        position: 65,
    },
    BookInfo {
        source: "Revelation of John",
        name: "Revelation",
        abbreviation: "Rev",
        testament: "New",
        position: 66,
    },
];
