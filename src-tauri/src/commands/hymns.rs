use rusqlite::{params, OptionalExtension};
use tauri::State;

use crate::db::AppState;
use crate::error::{AppError, AppResult};
use crate::models::hymn::{Hymn, HymnInput};

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
           AND (title LIKE ?1 OR number LIKE ?1 OR lyrics_json LIKE ?1)
         ORDER BY title ASC
         LIMIT 100",
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
