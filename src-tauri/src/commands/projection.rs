use rusqlite::params;
use tauri::{AppHandle, Emitter, Manager, State};

use crate::db::AppState;
use crate::error::{AppError, AppResult};
use crate::models::projection::ProjectionContent;
use crate::windows::projection_window;

#[tauri::command]
pub fn show_projection_content(
    app: AppHandle,
    state: State<'_, AppState>,
    content: ProjectionContent,
) -> AppResult<()> {
    {
        let snapshot = serde_json::to_string(&content)?;
        let conn = state.conn()?;
        conn.execute(
            "INSERT INTO app_settings(key, value, created_at, updated_at)
             VALUES ('projection.lastContent', ?1, datetime('now'), datetime('now'))
             ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')",
            params![snapshot],
        )?;
    }

    if app.get_webview_window("projection").is_none() {
        projection_window::open(&app)?;
    }

    let window = app
        .get_webview_window("projection")
        .ok_or_else(|| AppError::Message("Projection window is not open.".to_string()))?;

    window
        .emit("projection:content", content)
        .map_err(|error| AppError::Tauri(error.to_string()))
}

#[tauri::command]
pub fn get_current_projection_content(
    state: State<'_, AppState>,
) -> AppResult<Option<ProjectionContent>> {
    let conn = state.conn()?;
    let mut statement = conn.prepare(
        "SELECT value FROM app_settings WHERE key = 'projection.lastContent' LIMIT 1",
    )?;
    let mut rows = statement.query([])?;

    if let Some(row) = rows.next()? {
        let value: String = row.get(0)?;
        let content = serde_json::from_str::<ProjectionContent>(&value)?;
        return Ok(Some(content));
    }

    Ok(None)
}

#[tauri::command]
pub fn record_projection_history(state: State<'_, AppState>, content: ProjectionContent) -> AppResult<()> {
    let snapshot = serde_json::to_string(&content)?;
    let conn = state.conn()?;
    conn.execute(
        "INSERT INTO projection_history(content_type, content_ref, content_snapshot_json)
         VALUES (?1, ?2, ?3)",
        params![
            content.content_type,
            content.reference.or(content.title),
            snapshot
        ],
    )?;
    Ok(())
}
