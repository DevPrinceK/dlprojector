mod commands;
mod db;
mod error;
mod models;
mod services;
mod windows;

use db::AppState;
use error::AppError;
use tauri::Manager;

pub fn run() -> Result<(), AppError> {
    let builder = tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let state = AppState::initialize(app.handle())?;
            services::diagnostics::record(
                &state.diagnostics_path,
                &format!("DL Projector {} started", env!("CARGO_PKG_VERSION")),
            );
            app.manage(state);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::windows::open_projection_window,
            commands::windows::close_projection_window,
            commands::windows::set_projection_fullscreen,
            commands::windows::focus_control_window,
            commands::windows::projection_window_status,
            commands::projection::show_projection_content,
            commands::projection::get_current_projection_content,
            commands::projection::record_projection_history,
            commands::scriptures::search_scriptures,
            commands::scriptures::get_scripture_range,
            commands::scriptures::get_recent_scriptures,
            commands::scriptures::list_bible_versions,
            commands::scriptures::import_bundled_kjv,
            commands::scriptures::import_bible_csv,
            commands::hymns::create_hymn,
            commands::hymns::update_hymn,
            commands::hymns::delete_hymn,
            commands::hymns::search_hymns,
            commands::hymns::get_hymn,
            commands::hymns::import_bundled_ghs,
            commands::announcements::create_announcement,
            commands::announcements::update_announcement,
            commands::announcements::delete_announcement,
            commands::announcements::list_announcements,
            commands::announcements::get_announcement,
            commands::personalities::create_personality,
            commands::personalities::update_personality,
            commands::personalities::delete_personality,
            commands::personalities::list_personalities,
            commands::personalities::get_personality,
            commands::service_programs::create_service_program,
            commands::service_programs::update_service_program,
            commands::service_programs::delete_service_program,
            commands::service_programs::list_service_programs,
            commands::service_programs::duplicate_service_program,
            commands::service_programs::add_service_item,
            commands::service_programs::update_service_item,
            commands::service_programs::delete_service_item,
            commands::service_programs::reorder_service_items,
            commands::service_programs::get_active_service_program,
            commands::media::import_media_asset,
            commands::media::import_media_data_url,
            commands::media::import_media_url,
            commands::media::delete_media_asset,
            commands::media::list_media_assets,
            commands::backup::export_backup,
            commands::backup::import_backup,
            commands::backup::create_auto_backup,
            commands::settings::list_settings,
            commands::settings::save_setting,
            commands::settings::install_sample_data,
            commands::settings::diagnostics_path
        ]);

    let app = builder
        .build(tauri::generate_context!())
        .map_err(|error| AppError::Tauri(error.to_string()))?;

    app.run(|app_handle, event| {
        match event {
            tauri::RunEvent::ExitRequested { .. } => {
                let state = app_handle.state::<AppState>();
                let auto_enabled = state
                    .conn()
                    .ok()
                    .and_then(|conn| {
                        conn.query_row(
                            "SELECT value FROM app_settings WHERE key = 'backup.autoEnabled'",
                            [],
                            |row| row.get::<_, String>(0),
                        )
                        .ok()
                    })
                    .map(|value| value != "false")
                    .unwrap_or(true);
                if auto_enabled {
                    if let Err(error) = commands::backup::create_auto_backup_from_state(state.inner()) {
                        services::diagnostics::record(
                            &state.diagnostics_path,
                            &format!("Automatic backup failed: {error}"),
                        );
                    }
                }
                services::diagnostics::record(&state.diagnostics_path, "Application exit requested");
            }
            tauri::RunEvent::WindowEvent { label, event, .. } if label == "projection" => {
                let state = app_handle.state::<AppState>();
                if let Ok(conn) = state.conn() {
                    match event {
                        tauri::WindowEvent::Moved(position) => {
                            let value = format!("{},{}", position.x, position.y);
                            let _ = conn.execute(
                                "INSERT INTO app_settings(key, value) VALUES ('projection.windowPosition', ?1)
                                 ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')",
                                [value],
                            );
                        }
                        tauri::WindowEvent::Resized(size) => {
                            let value = format!("{},{}", size.width, size.height);
                            let _ = conn.execute(
                                "INSERT INTO app_settings(key, value) VALUES ('projection.windowSize', ?1)
                                 ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')",
                                [value],
                            );
                        }
                        _ => {}
                    }
                };
            }
            _ => {}
        }
    });

    Ok(())
}
