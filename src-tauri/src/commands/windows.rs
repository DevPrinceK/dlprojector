use tauri::{AppHandle, Manager};

use crate::error::{AppError, AppResult};
use crate::windows::projection_window;

#[tauri::command]
pub fn open_projection_window(app: AppHandle) -> AppResult<()> {
    projection_window::open(&app)
}

#[tauri::command]
pub fn close_projection_window(app: AppHandle) -> AppResult<()> {
    projection_window::close(&app)
}

#[tauri::command]
pub fn set_projection_fullscreen(app: AppHandle, fullscreen: bool) -> AppResult<()> {
    projection_window::set_fullscreen(&app, fullscreen)
}

#[tauri::command]
pub fn focus_control_window(app: AppHandle) -> AppResult<()> {
    let window = app
        .get_webview_window("main")
        .ok_or_else(|| AppError::Message("Control window is not open.".to_string()))?;
    window
        .set_focus()
        .map_err(|error| AppError::Tauri(error.to_string()))
}

#[tauri::command]
pub fn projection_window_status(app: AppHandle) -> AppResult<String> {
    let labels = app
        .webview_windows()
        .keys()
        .cloned()
        .collect::<Vec<_>>()
        .join(", ");
    Ok(format!("open windows: {labels}"))
}
