use rusqlite::OptionalExtension;
use tauri::{AppHandle, Manager, PhysicalPosition, PhysicalSize, WebviewUrl, WebviewWindowBuilder};

use crate::db::AppState;
use crate::error::{AppError, AppResult};

pub fn open(app: &AppHandle) -> AppResult<()> {
    if let Some(window) = app.get_webview_window("projection") {
        window
            .show()
            .map_err(|error| AppError::Tauri(error.to_string()))?;
        window
            .set_focus()
            .map_err(|error| AppError::Tauri(error.to_string()))?;
        return Ok(());
    }

    let window = WebviewWindowBuilder::new(app, "projection", WebviewUrl::App("index.html".into()))
        .title("DL Projector Output")
        .inner_size(1280.0, 720.0)
        .min_inner_size(800.0, 450.0)
        .resizable(true)
        .build()
        .map_err(|error| AppError::Tauri(error.to_string()))?;

    let state = app.state::<AppState>();
    if let Ok(conn) = state.conn() {
        let position: Option<String> = conn
            .query_row(
                "SELECT value FROM app_settings WHERE key = 'projection.windowPosition'",
                [],
                |row| row.get(0),
            )
            .optional()?;
        let size: Option<String> = conn
            .query_row(
                "SELECT value FROM app_settings WHERE key = 'projection.windowSize'",
                [],
                |row| row.get(0),
            )
            .optional()?;
        if let Some((x, y)) = position.as_deref().and_then(parse_pair::<i32>) {
            let _ = window.set_position(PhysicalPosition::new(x, y));
        }
        if let Some((width, height)) = size.as_deref().and_then(parse_pair::<u32>) {
            let _ = window.set_size(PhysicalSize::new(width.max(800), height.max(450)));
        }
    }

    Ok(())
}

fn parse_pair<T: std::str::FromStr>(value: &str) -> Option<(T, T)> {
    let (first, second) = value.split_once(',')?;
    Some((first.parse().ok()?, second.parse().ok()?))
}

pub fn close(app: &AppHandle) -> AppResult<()> {
    if let Some(window) = app.get_webview_window("projection") {
        window
            .close()
            .map_err(|error| AppError::Tauri(error.to_string()))?;
    }
    Ok(())
}

pub fn set_fullscreen(app: &AppHandle, fullscreen: bool) -> AppResult<()> {
    let window = app
        .get_webview_window("projection")
        .ok_or_else(|| AppError::Message("Projection window is not open.".to_string()))?;
    window
        .set_fullscreen(fullscreen)
        .map_err(|error| AppError::Tauri(error.to_string()))
}
