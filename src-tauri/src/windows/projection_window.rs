use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindowBuilder};

use crate::error::{AppError, AppResult};

pub fn open(app: &AppHandle) -> AppResult<()> {
    if let Some(window) = app.get_webview_window("projection") {
        window.show().map_err(|error| AppError::Tauri(error.to_string()))?;
        window
            .set_focus()
            .map_err(|error| AppError::Tauri(error.to_string()))?;
        return Ok(());
    }

    WebviewWindowBuilder::new(
        app,
        "projection",
        WebviewUrl::App("index.html?window=projection".into()),
    )
    .title("DL Projector Output")
    .inner_size(1280.0, 720.0)
    .min_inner_size(800.0, 450.0)
    .resizable(true)
    .build()
    .map_err(|error| AppError::Tauri(error.to_string()))?;

    Ok(())
}

pub fn close(app: &AppHandle) -> AppResult<()> {
    if let Some(window) = app.get_webview_window("projection") {
        window.close().map_err(|error| AppError::Tauri(error.to_string()))?;
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
