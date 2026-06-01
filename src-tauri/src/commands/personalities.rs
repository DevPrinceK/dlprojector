use rusqlite::{params, OptionalExtension};
use tauri::State;

use crate::db::AppState;
use crate::error::{AppError, AppResult};
use crate::models::personality::{Personality, PersonalityInput};

#[tauri::command]
pub fn create_personality(state: State<'_, AppState>, input: PersonalityInput) -> AppResult<Personality> {
    validate_personality(&input)?;
    let conn = state.conn()?;
    conn.execute(
        "INSERT INTO personalities(full_name, department, role, favorite_scripture, short_bio, photo_path, week_date, is_active)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        params![
            input.full_name,
            input.department,
            input.role,
            input.favorite_scripture,
            input.short_bio,
            input.photo_path,
            input.week_date,
            input.is_active.unwrap_or(true)
        ],
    )?;
    get_personality_by_id(&conn, conn.last_insert_rowid())?
        .ok_or_else(|| AppError::Message("Could not load saved profile.".to_string()))
}

#[tauri::command]
pub fn update_personality(state: State<'_, AppState>, id: i64, input: PersonalityInput) -> AppResult<Personality> {
    validate_personality(&input)?;
    let conn = state.conn()?;
    conn.execute(
        "UPDATE personalities
         SET full_name = ?1, department = ?2, role = ?3, favorite_scripture = ?4,
             short_bio = ?5, photo_path = ?6, week_date = ?7, is_active = ?8,
             updated_at = datetime('now')
         WHERE id = ?9 AND deleted_at IS NULL",
        params![
            input.full_name,
            input.department,
            input.role,
            input.favorite_scripture,
            input.short_bio,
            input.photo_path,
            input.week_date,
            input.is_active.unwrap_or(true),
            id
        ],
    )?;
    get_personality_by_id(&conn, id)?.ok_or_else(|| AppError::Message("Profile not found.".to_string()))
}

#[tauri::command]
pub fn delete_personality(state: State<'_, AppState>, id: i64) -> AppResult<()> {
    let conn = state.conn()?;
    conn.execute(
        "UPDATE personalities SET deleted_at = datetime('now'), updated_at = datetime('now') WHERE id = ?1",
        params![id],
    )?;
    Ok(())
}

#[tauri::command]
pub fn list_personalities(state: State<'_, AppState>) -> AppResult<Vec<Personality>> {
    let conn = state.conn()?;
    let mut statement = conn.prepare(
        "SELECT id, full_name, department, role, favorite_scripture, short_bio, photo_path,
                week_date, is_active, created_at, updated_at, deleted_at
         FROM personalities
         WHERE deleted_at IS NULL
         ORDER BY week_date IS NULL, week_date DESC, created_at DESC",
    )?;
    let rows = statement.query_map([], map_personality)?;
    let mut personalities = Vec::new();
    for row in rows {
        personalities.push(row?);
    }
    Ok(personalities)
}

#[tauri::command]
pub fn get_personality(state: State<'_, AppState>, id: i64) -> AppResult<Option<Personality>> {
    let conn = state.conn()?;
    get_personality_by_id(&conn, id)
}

fn validate_personality(input: &PersonalityInput) -> AppResult<()> {
    if input.full_name.trim().is_empty() {
        return Err(AppError::Validation("Full name is required.".to_string()));
    }
    Ok(())
}

fn get_personality_by_id(conn: &rusqlite::Connection, id: i64) -> AppResult<Option<Personality>> {
    conn.query_row(
        "SELECT id, full_name, department, role, favorite_scripture, short_bio, photo_path,
                week_date, is_active, created_at, updated_at, deleted_at
         FROM personalities
         WHERE id = ?1 AND deleted_at IS NULL",
        params![id],
        map_personality,
    )
    .optional()
    .map_err(AppError::from)
}

fn map_personality(row: &rusqlite::Row<'_>) -> rusqlite::Result<Personality> {
    Ok(Personality {
        id: row.get(0)?,
        full_name: row.get(1)?,
        department: row.get(2)?,
        role: row.get(3)?,
        favorite_scripture: row.get(4)?,
        short_bio: row.get(5)?,
        photo_path: row.get(6)?,
        week_date: row.get(7)?,
        is_active: row.get::<_, i64>(8)? == 1,
        created_at: row.get(9)?,
        updated_at: row.get(10)?,
        deleted_at: row.get(11)?,
    })
}
