use rusqlite::{params, OptionalExtension};
use tauri::State;

use crate::db::AppState;
use crate::error::{AppError, AppResult};
use crate::models::projection::ProjectionContent;
use crate::models::service_program::{ServiceItem, ServiceItemInput, ServiceProgram, ServiceProgramInput};

#[tauri::command]
pub fn create_service_program(state: State<'_, AppState>, input: ServiceProgramInput) -> AppResult<ServiceProgram> {
    if input.title.trim().is_empty() {
        return Err(AppError::Validation("Service program title is required.".to_string()));
    }

    let mut conn = state.conn()?;
    let tx = conn.transaction()?;
    if input.is_active.unwrap_or(true) {
        tx.execute("UPDATE service_programs SET is_active = 0 WHERE deleted_at IS NULL", [])?;
    }
    tx.execute(
        "INSERT INTO service_programs(title, service_date, notes, is_active)
         VALUES (?1, ?2, ?3, ?4)",
        params![input.title, input.service_date, input.notes, input.is_active.unwrap_or(true)],
    )?;
    let id = tx.last_insert_rowid();
    tx.commit()?;
    get_service_program_by_id(&conn, id)?
        .ok_or_else(|| AppError::Message("Could not load saved service program.".to_string()))
}

#[tauri::command]
pub fn update_service_program(state: State<'_, AppState>, id: i64, input: ServiceProgramInput) -> AppResult<ServiceProgram> {
    if input.title.trim().is_empty() {
        return Err(AppError::Validation("Service program title is required.".to_string()));
    }

    let mut conn = state.conn()?;
    let tx = conn.transaction()?;
    if input.is_active.unwrap_or(false) {
        tx.execute("UPDATE service_programs SET is_active = 0 WHERE deleted_at IS NULL", [])?;
    }
    tx.execute(
        "UPDATE service_programs
         SET title = ?1, service_date = ?2, notes = ?3, is_active = ?4, updated_at = datetime('now')
         WHERE id = ?5 AND deleted_at IS NULL",
        params![input.title, input.service_date, input.notes, input.is_active.unwrap_or(true), id],
    )?;
    tx.commit()?;
    get_service_program_by_id(&conn, id)?.ok_or_else(|| AppError::Message("Service program not found.".to_string()))
}

#[tauri::command]
pub fn delete_service_program(state: State<'_, AppState>, id: i64) -> AppResult<()> {
    let conn = state.conn()?;
    conn.execute(
        "UPDATE service_programs SET deleted_at = datetime('now'), updated_at = datetime('now'), is_active = 0 WHERE id = ?1",
        params![id],
    )?;
    Ok(())
}

#[tauri::command]
pub fn list_service_programs(state: State<'_, AppState>) -> AppResult<Vec<ServiceProgram>> {
    let conn = state.conn()?;
    let mut statement = conn.prepare(
        "SELECT id, title, service_date, notes, is_active, created_at, updated_at, deleted_at
         FROM service_programs
         WHERE deleted_at IS NULL
         ORDER BY service_date DESC, created_at DESC",
    )?;
    let rows = statement.query_map([], map_service_program_shell)?;
    let mut programs = Vec::new();
    for row in rows {
        let mut program = row?;
        program.items = list_items_for_program(&conn, program.id)?;
        programs.push(program);
    }
    Ok(programs)
}

#[tauri::command]
pub fn get_active_service_program(state: State<'_, AppState>) -> AppResult<Option<ServiceProgram>> {
    let conn = state.conn()?;
    let mut program = conn
        .query_row(
            "SELECT id, title, service_date, notes, is_active, created_at, updated_at, deleted_at
             FROM service_programs
             WHERE deleted_at IS NULL AND is_active = 1
             ORDER BY created_at DESC
             LIMIT 1",
            [],
            map_service_program_shell,
        )
        .optional()?;

    if let Some(program) = &mut program {
        program.items = list_items_for_program(&conn, program.id)?;
    }

    Ok(program)
}

#[tauri::command]
pub fn add_service_item(state: State<'_, AppState>, input: ServiceItemInput) -> AppResult<ServiceItem> {
    if input.title.trim().is_empty() {
        return Err(AppError::Validation("Service item title is required.".to_string()));
    }

    let content_json = match input.custom_content_json {
        Some(content) => Some(serde_json::to_string(&content)?),
        None => None,
    };
    let conn = state.conn()?;
    let next_position = input.position.unwrap_or_else(|| {
        conn.query_row(
            "SELECT COALESCE(MAX(position), 0) + 1 FROM service_items WHERE service_program_id = ?1",
            params![input.service_program_id],
            |row| row.get::<_, i64>(0),
        )
        .unwrap_or(1)
    });

    conn.execute(
        "INSERT INTO service_items(service_program_id, item_type, title, linked_entity_id, custom_content_json, position)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![
            input.service_program_id,
            input.item_type,
            input.title,
            input.linked_entity_id,
            content_json,
            next_position
        ],
    )?;

    get_service_item_by_id(&conn, conn.last_insert_rowid())?
        .ok_or_else(|| AppError::Message("Could not load saved service item.".to_string()))
}

#[tauri::command]
pub fn update_service_item(state: State<'_, AppState>, id: i64, input: ServiceItemInput) -> AppResult<ServiceItem> {
    if input.title.trim().is_empty() {
        return Err(AppError::Validation("Service item title is required.".to_string()));
    }
    let content_json = match input.custom_content_json {
        Some(content) => Some(serde_json::to_string(&content)?),
        None => None,
    };
    let conn = state.conn()?;
    conn.execute(
        "UPDATE service_items
         SET item_type = ?1, title = ?2, linked_entity_id = ?3, custom_content_json = ?4,
             position = COALESCE(?5, position), updated_at = datetime('now')
         WHERE id = ?6 AND service_program_id = ?7",
        params![
            input.item_type,
            input.title,
            input.linked_entity_id,
            content_json,
            input.position,
            id,
            input.service_program_id
        ],
    )?;

    get_service_item_by_id(&conn, id)?
        .ok_or_else(|| AppError::Message("Service item not found.".to_string()))
}

#[tauri::command]
pub fn delete_service_item(state: State<'_, AppState>, id: i64) -> AppResult<()> {
    let conn = state.conn()?;
    conn.execute("DELETE FROM service_items WHERE id = ?1", params![id])?;
    Ok(())
}

#[tauri::command]
pub fn reorder_service_items(
    state: State<'_, AppState>,
    service_program_id: i64,
    item_ids: Vec<i64>,
) -> AppResult<Vec<ServiceItem>> {
    let mut conn = state.conn()?;
    let tx = conn.transaction()?;
    for (index, item_id) in item_ids.iter().enumerate() {
        tx.execute(
            "UPDATE service_items SET position = ?1, updated_at = datetime('now')
             WHERE id = ?2 AND service_program_id = ?3",
            params![(index + 1) as i64, item_id, service_program_id],
        )?;
    }
    tx.commit()?;
    list_items_for_program(&conn, service_program_id)
}

fn get_service_program_by_id(conn: &rusqlite::Connection, id: i64) -> AppResult<Option<ServiceProgram>> {
    let mut program = conn
        .query_row(
            "SELECT id, title, service_date, notes, is_active, created_at, updated_at, deleted_at
             FROM service_programs
             WHERE id = ?1 AND deleted_at IS NULL",
            params![id],
            map_service_program_shell,
        )
        .optional()?;

    if let Some(program) = &mut program {
        program.items = list_items_for_program(conn, program.id)?;
    }

    Ok(program)
}

fn list_items_for_program(conn: &rusqlite::Connection, service_program_id: i64) -> AppResult<Vec<ServiceItem>> {
    let mut statement = conn.prepare(
        "SELECT id, service_program_id, item_type, title, linked_entity_id, custom_content_json,
                position, created_at, updated_at
         FROM service_items
         WHERE service_program_id = ?1
         ORDER BY position ASC",
    )?;
    let rows = statement.query_map(params![service_program_id], map_service_item)?;
    let mut items = Vec::new();
    for row in rows {
        items.push(row?);
    }
    Ok(items)
}

fn get_service_item_by_id(conn: &rusqlite::Connection, id: i64) -> AppResult<Option<ServiceItem>> {
    conn.query_row(
        "SELECT id, service_program_id, item_type, title, linked_entity_id, custom_content_json,
                position, created_at, updated_at
         FROM service_items
         WHERE id = ?1",
        params![id],
        map_service_item,
    )
    .optional()
    .map_err(AppError::from)
}

fn map_service_program_shell(row: &rusqlite::Row<'_>) -> rusqlite::Result<ServiceProgram> {
    Ok(ServiceProgram {
        id: row.get(0)?,
        title: row.get(1)?,
        service_date: row.get(2)?,
        notes: row.get(3)?,
        is_active: row.get::<_, i64>(4)? == 1,
        created_at: row.get(5)?,
        updated_at: row.get(6)?,
        deleted_at: row.get(7)?,
        items: Vec::new(),
    })
}

fn map_service_item(row: &rusqlite::Row<'_>) -> rusqlite::Result<ServiceItem> {
    let custom_json: Option<String> = row.get(5)?;
    let custom_content_json: Option<ProjectionContent> = custom_json
        .and_then(|json| serde_json::from_str::<ProjectionContent>(&json).ok());
    Ok(ServiceItem {
        id: row.get(0)?,
        service_program_id: row.get(1)?,
        item_type: row.get(2)?,
        title: row.get(3)?,
        linked_entity_id: row.get(4)?,
        custom_content_json,
        position: row.get(6)?,
        created_at: row.get(7)?,
        updated_at: row.get(8)?,
        deleted_at: None,
    })
}
