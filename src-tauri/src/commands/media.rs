use base64::Engine;
use rusqlite::{params, OptionalExtension};
use tauri::State;

use crate::db::AppState;
use crate::error::{AppError, AppResult};
use crate::models::media::MediaAsset;
use crate::services::media_service;

#[tauri::command]
pub fn import_media_asset(
    state: State<'_, AppState>,
    source_path: String,
) -> AppResult<MediaAsset> {
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
pub fn import_media_data_url(
    state: State<'_, AppState>,
    file_name: String,
    data_url: String,
) -> AppResult<MediaAsset> {
    let (metadata, encoded) = data_url
        .split_once(',')
        .ok_or_else(|| AppError::Validation("Invalid image data.".to_string()))?;
    let extension = if metadata.contains("image/png") {
        "png"
    } else if metadata.contains("image/jpeg") {
        "jpg"
    } else if metadata.contains("image/webp") {
        "webp"
    } else {
        return Err(AppError::Validation(
            "Image must be PNG, JPG, JPEG, or WEBP.".to_string(),
        ));
    };
    let bytes = base64::engine::general_purpose::STANDARD
        .decode(encoded)
        .map_err(|_| AppError::Validation("Image data could not be decoded.".to_string()))?;
    std::fs::create_dir_all(&state.media_dir)?;
    let safe_stem = file_name
        .chars()
        .map(|ch| if ch.is_ascii_alphanumeric() { ch } else { '-' })
        .collect::<String>()
        .trim_matches('-')
        .to_string();
    let safe_stem = if safe_stem.is_empty() {
        "image".to_string()
    } else {
        safe_stem
    };
    let stored_name = format!("{}-{}.{}", safe_stem, uuid::Uuid::new_v4(), extension);
    let destination = state.media_dir.join(&stored_name);
    std::fs::write(&destination, &bytes)?;

    let conn = state.conn()?;
    conn.execute(
        "INSERT INTO media_assets(file_name, file_path, file_type, file_size)
         VALUES (?1, ?2, ?3, ?4)",
        params![
            stored_name,
            destination.to_string_lossy().to_string(),
            extension,
            bytes.len() as i64
        ],
    )?;

    get_media_asset_by_id(&conn, conn.last_insert_rowid())?
        .ok_or_else(|| AppError::Message("Could not load imported media asset.".to_string()))
}

#[tauri::command]
pub async fn import_media_url(state: State<'_, AppState>, url: String) -> AppResult<MediaAsset> {
    let media_dir = state.media_dir.clone();
    let downloaded = tauri::async_runtime::spawn_blocking(move || {
        media_service::download_media_asset(&url, &media_dir)
    })
    .await
    .map_err(|error| AppError::Message(format!("Image download task failed: {error}")))??;
    let (file_name, destination, file_type, file_size) = downloaded;
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
