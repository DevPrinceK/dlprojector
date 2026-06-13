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
    let (configured_directory, retention) = {
        let conn = state.conn()?;
        let directory = conn
            .query_row(
                "SELECT value FROM app_settings WHERE key = 'backup.directory'",
                [],
                |row| row.get::<_, String>(0),
            )
            .unwrap_or_default();
        let retention = conn
            .query_row(
                "SELECT value FROM app_settings WHERE key = 'backup.retention'",
                [],
                |row| row.get::<_, String>(0),
            )
            .ok()
            .and_then(|value| value.parse::<usize>().ok())
            .unwrap_or(10)
            .clamp(1, 50);
        (directory, retention)
    };
    {
        let conn = state.conn()?;
        conn.execute_batch("PRAGMA wal_checkpoint(FULL);")?;
    }

    let backup_directory = if configured_directory.trim().is_empty() {
        state.backup_dir.clone()
    } else {
        std::path::PathBuf::from(configured_directory)
    };
    let path = backup_service::create_backup_archive(
        &state.db_path,
        &state.media_dir,
        &backup_directory,
        None,
        "auto",
    )?;
    backup_service::prune_auto_backups(&backup_directory, retention)?;

    Ok(path.to_string_lossy().to_string())
}
