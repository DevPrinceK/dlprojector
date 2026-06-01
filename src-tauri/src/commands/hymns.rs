use std::collections::HashMap;

use rusqlite::{params, OptionalExtension};
use serde::Deserialize;
use serde_json::{json, Value};
use tauri::State;

use crate::db::AppState;
use crate::error::{AppError, AppResult};
use crate::models::hymn::{Hymn, HymnImportResult, HymnInput};

const GHS_JSON: &str = include_str!("../../resources/hymns/GHS.json");

#[tauri::command]
pub fn create_hymn(state: State<'_, AppState>, input: HymnInput) -> AppResult<Hymn> {
    validate_hymn(&input)?;
    let lyrics_json = serde_json::to_string(&input.lyrics_json)?;
    let conn = state.conn()?;
    conn.execute(
        "INSERT INTO hymns(number, title, category, author, lyrics_json, is_active)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![
            input.number,
            input.title,
            input.category,
            input.author,
            lyrics_json,
            input.is_active.unwrap_or(true)
        ],
    )?;
    let id = conn.last_insert_rowid();
    get_hymn_by_id(&conn, id)?.ok_or_else(|| AppError::Message("Could not load saved hymn.".to_string()))
}

#[tauri::command]
pub fn update_hymn(state: State<'_, AppState>, id: i64, input: HymnInput) -> AppResult<Hymn> {
    validate_hymn(&input)?;
    let lyrics_json = serde_json::to_string(&input.lyrics_json)?;
    let conn = state.conn()?;
    conn.execute(
        "UPDATE hymns
         SET number = ?1, title = ?2, category = ?3, author = ?4, lyrics_json = ?5,
             is_active = ?6, updated_at = datetime('now')
         WHERE id = ?7 AND deleted_at IS NULL",
        params![
            input.number,
            input.title,
            input.category,
            input.author,
            lyrics_json,
            input.is_active.unwrap_or(true),
            id
        ],
    )?;
    get_hymn_by_id(&conn, id)?.ok_or_else(|| AppError::Message("Hymn not found.".to_string()))
}

#[tauri::command]
pub fn delete_hymn(state: State<'_, AppState>, id: i64) -> AppResult<()> {
    let conn = state.conn()?;
    conn.execute(
        "UPDATE hymns SET deleted_at = datetime('now'), updated_at = datetime('now') WHERE id = ?1",
        params![id],
    )?;
    Ok(())
}

#[tauri::command]
pub fn search_hymns(state: State<'_, AppState>, query: String) -> AppResult<Vec<Hymn>> {
    let like_query = format!("%{}%", query.trim());
    let conn = state.conn()?;
    let mut statement = conn.prepare(
        "SELECT id, number, title, category, author, lyrics_json, is_active, created_at, updated_at, deleted_at
         FROM hymns
         WHERE deleted_at IS NULL
           AND (title LIKE ?1 OR number LIKE ?1 OR category LIKE ?1 OR author LIKE ?1 OR lyrics_json LIKE ?1)
         ORDER BY author ASC, number ASC, title ASC
         LIMIT 500",
    )?;
    let rows = statement.query_map(params![like_query], map_hymn)?;
    let mut hymns = Vec::new();
    for row in rows {
        hymns.push(row?);
    }
    Ok(hymns)
}

#[tauri::command]
pub fn get_hymn(state: State<'_, AppState>, id: i64) -> AppResult<Option<Hymn>> {
    let conn = state.conn()?;
    get_hymn_by_id(&conn, id)
}

#[tauri::command]
pub fn import_bundled_ghs(state: State<'_, AppState>) -> AppResult<HymnImportResult> {
    let parsed: GospelHymnsDb = serde_json::from_str(GHS_JSON)?;
    let mut conn = state.conn()?;
    let tx = conn.transaction()?;
    let mut hymns_imported = 0_i64;

    for source_hymn in parsed.hymns.values() {
        let raw_number = source_hymn.number.trim();
        let number = format!("GHS {:03}", raw_number.parse::<i64>().unwrap_or(0));
        let title = source_hymn.title.trim();
        if title.is_empty() {
            continue;
        }

        let chorus = source_hymn
            .chorus
            .as_ref()
            .and_then(|value| value.as_str())
            .map(str::trim)
            .filter(|value| !value.is_empty())
            .unwrap_or("");
        let stanzas: Vec<String> = source_hymn
            .verses
            .iter()
            .map(|verse| verse.trim().to_string())
            .filter(|verse| !verse.is_empty())
            .collect();

        let lyrics_json = json!({
            "title": title,
            "number": number,
            "hymnal": "GHS",
            "sourceNumber": raw_number,
            "stanzas": stanzas,
            "chorus": chorus,
            "audioUrl": source_hymn.sound.as_deref().unwrap_or("")
        });
        let lyrics_json = serde_json::to_string(&lyrics_json)?;
        let category = source_hymn.category.as_deref().map(normalize_category);

        let existing_id: Option<i64> = tx
            .query_row(
                "SELECT id FROM hymns WHERE deleted_at IS NULL AND author = 'GHS' AND number = ?1 LIMIT 1",
                params![number],
                |row| row.get(0),
            )
            .optional()?;

        if let Some(id) = existing_id {
            tx.execute(
                "UPDATE hymns
                 SET title = ?1, category = ?2, author = 'GHS', lyrics_json = ?3,
                     is_active = 1, updated_at = datetime('now')
                 WHERE id = ?4",
                params![title, category, lyrics_json, id],
            )?;
        } else {
            tx.execute(
                "INSERT INTO hymns(number, title, category, author, lyrics_json, is_active)
                 VALUES (?1, ?2, ?3, 'GHS', ?4, 1)",
                params![number, title, category, lyrics_json],
            )?;
        }

        hymns_imported += 1;
    }

    tx.execute(
        "INSERT INTO app_settings(key, value, created_at, updated_at)
         VALUES ('hymns.import.ghs', datetime('now'), datetime('now'), datetime('now'))
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')",
        [],
    )?;
    tx.commit()?;

    let hymns_total: i64 = conn.query_row(
        "SELECT COUNT(*) FROM hymns WHERE deleted_at IS NULL AND author = 'GHS'",
        [],
        |row| row.get(0),
    )?;

    Ok(HymnImportResult {
        hymnal: "GHS".to_string(),
        hymns_imported,
        hymns_total,
    })
}

fn validate_hymn(input: &HymnInput) -> AppResult<()> {
    if input.title.trim().is_empty() {
        return Err(AppError::Validation("Hymn title is required.".to_string()));
    }
    if input.lyrics_json.get("stanzas").is_none() {
        return Err(AppError::Validation("Hymn stanzas are required.".to_string()));
    }
    Ok(())
}

fn get_hymn_by_id(conn: &rusqlite::Connection, id: i64) -> AppResult<Option<Hymn>> {
    conn.query_row(
        "SELECT id, number, title, category, author, lyrics_json, is_active, created_at, updated_at, deleted_at
         FROM hymns
         WHERE id = ?1 AND deleted_at IS NULL",
        params![id],
        map_hymn,
    )
    .optional()
    .map_err(AppError::from)
}

fn map_hymn(row: &rusqlite::Row<'_>) -> rusqlite::Result<Hymn> {
    let lyrics_json: String = row.get(5)?;
    Ok(Hymn {
        id: row.get(0)?,
        number: row.get(1)?,
        title: row.get(2)?,
        category: row.get(3)?,
        author: row.get(4)?,
        lyrics_json: serde_json::from_str(&lyrics_json).unwrap_or_else(|_| serde_json::json!({ "stanzas": [] })),
        is_active: row.get::<_, i64>(6)? == 1,
        created_at: row.get(7)?,
        updated_at: row.get(8)?,
        deleted_at: row.get(9)?,
    })
}

fn normalize_category(category: &str) -> String {
    category
        .split_whitespace()
        .collect::<Vec<_>>()
        .join(" ")
        .trim()
        .to_string()
}

#[derive(Debug, Deserialize)]
struct GospelHymnsDb {
    hymns: HashMap<String, GospelHymn>,
}

#[derive(Debug, Deserialize)]
struct GospelHymn {
    number: String,
    title: String,
    chorus: Option<Value>,
    verses: Vec<String>,
    sound: Option<String>,
    category: Option<String>,
}
