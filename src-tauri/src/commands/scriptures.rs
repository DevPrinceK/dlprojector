use std::collections::BTreeMap;

use rusqlite::{params, Connection};
use tauri::State;

use crate::db::AppState;
use crate::error::{AppError, AppResult};
use crate::models::projection::ProjectionContent;
use crate::models::scripture::{BibleVerse, ScriptureReference, ScriptureSearchResult};

#[tauri::command]
pub fn search_scriptures(state: State<'_, AppState>, query: String) -> AppResult<Vec<ScriptureSearchResult>> {
    let conn = state.conn()?;
    let verses = if let Some(reference) = parse_reference(&query) {
        search_by_reference(&conn, &reference)?
    } else {
        search_by_text(&conn, &query)?
    };
    Ok(group_results(verses))
}

#[tauri::command]
pub fn get_scripture_range(state: State<'_, AppState>, reference: String) -> AppResult<Option<ScriptureSearchResult>> {
    Ok(search_scriptures(state, reference)?.into_iter().next())
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
                if let Ok(parsed) = serde_json::from_value::<ScriptureSearchResult>(result.clone()) {
                    results.push(parsed);
                }
            }
        }
    }

    Ok(results)
}

fn search_by_reference(conn: &Connection, reference: &ScriptureReference) -> AppResult<Vec<BibleVerse>> {
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
           AND bv.is_default = 1
         ORDER BY v.verse ASC",
    )?;

    let rows = statement.query_map(
        params![reference.book, reference.chapter, start, end],
        map_bible_verse,
    )?;
    let mut verses = Vec::new();
    for row in rows {
        verses.push(row?);
    }
    Ok(verses)
}

fn search_by_text(conn: &Connection, query: &str) -> AppResult<Vec<BibleVerse>> {
    let like_query = format!("%{}%", query.trim());
    let mut statement = conn.prepare(
        "SELECT v.id, v.version_id, v.book_id, b.name, v.chapter, v.verse, v.text, bv.abbreviation
         FROM bible_verses v
         JOIN bible_books b ON b.id = v.book_id
         JOIN bible_versions bv ON bv.id = v.version_id
         WHERE (v.text LIKE ?1 OR b.name LIKE ?1)
           AND bv.is_default = 1
         ORDER BY b.position ASC, v.chapter ASC, v.verse ASC
         LIMIT 60",
    )?;

    let rows = statement.query_map(params![like_query], map_bible_verse)?;
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
        .map_or((raw_reference, None), |(chapter, verse)| (chapter, Some(verse)));

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

    let lower = trimmed.to_lowercase();
    let canonical = match lower.as_str() {
        "psalms" | "ps" => "Psalm",
        "jn" => "John",
        "rom" => "Romans",
        "gen" => "Genesis",
        _ => trimmed,
    };
    Ok(canonical.to_string())
}
