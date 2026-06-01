use rusqlite::{params, OptionalExtension};
use tauri::State;

use crate::db::AppState;
use crate::error::{AppError, AppResult};
use crate::models::announcement::{Announcement, AnnouncementInput};

#[tauri::command]
pub fn create_announcement(state: State<'_, AppState>, input: AnnouncementInput) -> AppResult<Announcement> {
    validate_announcement(&input)?;
    let conn = state.conn()?;
    conn.execute(
        "INSERT INTO announcements(title, message, event_date, event_time, venue, image_path, category, is_active)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        params![
            input.title,
            input.message,
            input.event_date,
            input.event_time,
            input.venue,
            input.image_path,
            input.category,
            input.is_active.unwrap_or(true)
        ],
    )?;
    get_announcement_by_id(&conn, conn.last_insert_rowid())?
        .ok_or_else(|| AppError::Message("Could not load saved announcement.".to_string()))
}

#[tauri::command]
pub fn update_announcement(state: State<'_, AppState>, id: i64, input: AnnouncementInput) -> AppResult<Announcement> {
    validate_announcement(&input)?;
    let conn = state.conn()?;
    conn.execute(
        "UPDATE announcements
         SET title = ?1, message = ?2, event_date = ?3, event_time = ?4, venue = ?5,
             image_path = ?6, category = ?7, is_active = ?8, updated_at = datetime('now')
         WHERE id = ?9 AND deleted_at IS NULL",
        params![
            input.title,
            input.message,
            input.event_date,
            input.event_time,
            input.venue,
            input.image_path,
            input.category,
            input.is_active.unwrap_or(true),
            id
        ],
    )?;
    get_announcement_by_id(&conn, id)?.ok_or_else(|| AppError::Message("Announcement not found.".to_string()))
}

#[tauri::command]
pub fn delete_announcement(state: State<'_, AppState>, id: i64) -> AppResult<()> {
    let conn = state.conn()?;
    conn.execute(
        "UPDATE announcements SET deleted_at = datetime('now'), updated_at = datetime('now') WHERE id = ?1",
        params![id],
    )?;
    Ok(())
}

#[tauri::command]
pub fn list_announcements(state: State<'_, AppState>) -> AppResult<Vec<Announcement>> {
    let conn = state.conn()?;
    let mut statement = conn.prepare(
        "SELECT id, title, message, event_date, event_time, venue, image_path, category,
                is_active, created_at, updated_at, deleted_at
         FROM announcements
         WHERE deleted_at IS NULL
         ORDER BY event_date IS NULL, event_date ASC, created_at DESC",
    )?;
    let rows = statement.query_map([], map_announcement)?;
    let mut announcements = Vec::new();
    for row in rows {
        announcements.push(row?);
    }
    Ok(announcements)
}

#[tauri::command]
pub fn get_announcement(state: State<'_, AppState>, id: i64) -> AppResult<Option<Announcement>> {
    let conn = state.conn()?;
    get_announcement_by_id(&conn, id)
}

fn validate_announcement(input: &AnnouncementInput) -> AppResult<()> {
    if input.title.trim().is_empty() {
        return Err(AppError::Validation("Announcement title is required.".to_string()));
    }
    if input.message.trim().is_empty() {
        return Err(AppError::Validation("Announcement message is required.".to_string()));
    }
    Ok(())
}

fn get_announcement_by_id(conn: &rusqlite::Connection, id: i64) -> AppResult<Option<Announcement>> {
    conn.query_row(
        "SELECT id, title, message, event_date, event_time, venue, image_path, category,
                is_active, created_at, updated_at, deleted_at
         FROM announcements
         WHERE id = ?1 AND deleted_at IS NULL",
        params![id],
        map_announcement,
    )
    .optional()
    .map_err(AppError::from)
}

fn map_announcement(row: &rusqlite::Row<'_>) -> rusqlite::Result<Announcement> {
    Ok(Announcement {
        id: row.get(0)?,
        title: row.get(1)?,
        message: row.get(2)?,
        event_date: row.get(3)?,
        event_time: row.get(4)?,
        venue: row.get(5)?,
        image_path: row.get(6)?,
        category: row.get(7)?,
        is_active: row.get::<_, i64>(8)? == 1,
        created_at: row.get(9)?,
        updated_at: row.get(10)?,
        deleted_at: row.get(11)?,
    })
}
