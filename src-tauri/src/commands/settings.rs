use rusqlite::params;
use tauri::State;

use crate::db::AppState;
use crate::error::AppResult;
use crate::models::settings::AppSetting;

#[tauri::command]
pub fn list_settings(state: State<'_, AppState>) -> AppResult<Vec<AppSetting>> {
    let conn = state.conn()?;
    let mut statement = conn.prepare("SELECT key, value FROM app_settings ORDER BY key ASC")?;
    let rows = statement.query_map([], |row| {
        Ok(AppSetting {
            key: row.get(0)?,
            value: row.get(1)?,
        })
    })?;
    let mut settings = Vec::new();
    for row in rows {
        settings.push(row?);
    }
    Ok(settings)
}

#[tauri::command]
pub fn save_setting(
    state: State<'_, AppState>,
    key: String,
    value: String,
) -> AppResult<AppSetting> {
    let conn = state.conn()?;
    conn.execute(
        "INSERT INTO app_settings(key, value, created_at, updated_at)
         VALUES (?1, ?2, datetime('now'), datetime('now'))
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')",
        params![key, value],
    )?;
    Ok(AppSetting { key, value })
}
