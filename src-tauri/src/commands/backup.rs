use tauri::State;

use crate::db::AppState;
use crate::error::AppResult;
use crate::services::backup_service;

#[tauri::command]
pub fn export_backup(state: State<'_, AppState>, target_path: Option<String>) -> AppResult<String> {
    {
        let conn = state.conn()?;
        conn.execute_batch("PRAGMA wal_checkpoint(FULL);")?;
    }

    let path = backup_service::create_backup_archive(
        &state.db_path,
        &state.media_dir,
        &state.backup_dir,
        target_path,
        "manual",
    )?;

    Ok(path.to_string_lossy().to_string())
}

#[tauri::command]
pub fn import_backup(state: State<'_, AppState>, source_path: String) -> AppResult<()> {
    create_auto_backup_from_state(state.inner())?;
    backup_service::stage_restore(std::path::Path::new(&source_path), &state.app_data_dir)?;
    Ok(())
}

#[tauri::command]
pub fn create_auto_backup(state: State<'_, AppState>) -> AppResult<String> {
    create_auto_backup_from_state(state.inner())
}

pub fn create_auto_backup_from_state(state: &AppState) -> AppResult<String> {
    {
        let conn = state.conn()?;
        conn.execute_batch("PRAGMA wal_checkpoint(FULL);")?;
    }

    let path = backup_service::create_backup_archive(
        &state.db_path,
        &state.media_dir,
        &state.backup_dir,
        None,
        "auto",
    )?;

    Ok(path.to_string_lossy().to_string())
}
