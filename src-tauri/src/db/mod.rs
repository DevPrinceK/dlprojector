pub mod connection;
pub mod migrations;

use std::path::PathBuf;
use std::sync::{Mutex, MutexGuard};

use rusqlite::Connection;
use tauri::Manager;

use crate::error::{AppError, AppResult};

pub struct AppState {
    pub db_path: PathBuf,
    pub app_data_dir: PathBuf,
    pub media_dir: PathBuf,
    pub backup_dir: PathBuf,
    connection: Mutex<Connection>,
}

impl AppState {
    pub fn initialize(app: &tauri::AppHandle) -> AppResult<Self> {
        let app_data_dir = app
            .path()
            .app_data_dir()
            .map_err(|error| AppError::Tauri(error.to_string()))?;
        std::fs::create_dir_all(&app_data_dir)?;

        let media_dir = app_data_dir.join("media");
        let backup_dir = app_data_dir.join("backups");
        std::fs::create_dir_all(&media_dir)?;
        std::fs::create_dir_all(&backup_dir)?;

        let db_path = app_data_dir.join("dlprojector.sqlite3");
        let pending_restore = app_data_dir.join("restore-pending.sqlite3");
        if pending_restore.exists() {
            std::fs::copy(&pending_restore, &db_path)?;
            std::fs::remove_file(&pending_restore)?;
        }
        if db_path.exists() {
            let migration_backup = backup_dir.join(format!(
                "pre-migration-{}.sqlite3",
                chrono::Utc::now().format("%Y%m%d-%H%M%S")
            ));
            std::fs::copy(&db_path, migration_backup)?;
        }

        let connection = connection::open_database(&db_path)?;
        migrations::run_migrations(&connection)?;

        Ok(Self {
            db_path,
            app_data_dir,
            media_dir,
            backup_dir,
            connection: Mutex::new(connection),
        })
    }

    pub fn conn(&self) -> AppResult<MutexGuard<'_, Connection>> {
        self.connection.lock().map_err(|_| AppError::StateUnavailable)
    }
}
