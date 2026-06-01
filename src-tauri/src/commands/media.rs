use rusqlite::{params, OptionalExtension};
use tauri::State;

use crate::db::AppState;
use crate::error::{AppError, AppResult};
use crate::models::media::MediaAsset;
use crate::services::media_service;

#[tauri::command]
pub fn import_media_asset(state: State<'_, AppState>, source_path: String) -> AppResult<MediaAsset> {
    let (file_name, destination, file_type, file_size) =
        media_service::copy_media_asset(&source_path, &state.media_dir)?;
    let conn = state.conn()?;
    conn.execute(
        "INSERT INTO media_assets(file_name, file_path, file_type, file_size)
         VALUES (?1, ?2, ?3, ?4)",
        params![
            file_name,
            destination.to_string_lossy().to_string(),
            file_type,
            file_size
        ],
    )?;

    get_media_asset_by_id(&conn, conn.last_insert_rowid())?
        .ok_or_else(|| AppError::Message("Could not load imported media asset.".to_string()))
}

#[tauri::command]
pub fn delete_media_asset(state: State<'_, AppState>, id: i64) -> AppResult<()> {
    let conn = state.conn()?;
    if let Some(asset) = get_media_asset_by_id(&conn, id)? {
        if std::path::Path::new(&asset.file_path).exists() {
            std::fs::remove_file(&asset.file_path)?;
        }
        conn.execute(
            "UPDATE media_assets SET deleted_at = datetime('now'), updated_at = datetime('now') WHERE id = ?1",
            params![id],
        )?;
    }
    Ok(())
}

#[tauri::command]
pub fn list_media_assets(state: State<'_, AppState>) -> AppResult<Vec<MediaAsset>> {
    let conn = state.conn()?;
    let mut statement = conn.prepare(
        "SELECT id, file_name, file_path, file_type, file_size, created_at, updated_at, deleted_at
         FROM media_assets
         WHERE deleted_at IS NULL
         ORDER BY created_at DESC",
    )?;
    let rows = statement.query_map([], map_media_asset)?;
    let mut assets = Vec::new();
    for row in rows {
        assets.push(row?);
    }
    Ok(assets)
}

fn get_media_asset_by_id(conn: &rusqlite::Connection, id: i64) -> AppResult<Option<MediaAsset>> {
    conn.query_row(
        "SELECT id, file_name, file_path, file_type, file_size, created_at, updated_at, deleted_at
         FROM media_assets
         WHERE id = ?1 AND deleted_at IS NULL",
        params![id],
        map_media_asset,
    )
    .optional()
    .map_err(AppError::from)
}

fn map_media_asset(row: &rusqlite::Row<'_>) -> rusqlite::Result<MediaAsset> {
    Ok(MediaAsset {
        id: row.get(0)?,
        file_name: row.get(1)?,
        file_path: row.get(2)?,
        file_type: row.get(3)?,
        file_size: row.get(4)?,
        created_at: row.get(5)?,
        updated_at: row.get(6)?,
        deleted_at: row.get(7)?,
    })
}
