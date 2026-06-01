use rusqlite::params;
use tauri::State;

use crate::db::AppState;
use crate::error::AppResult;
use crate::models::projection::ProjectionContent;

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
