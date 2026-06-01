use std::fs::File;
use std::io::{Read, Write};
use std::path::{Path, PathBuf};

use chrono::Utc;
use zip::write::SimpleFileOptions;

use crate::error::{AppError, AppResult};

pub fn backup_file_name(prefix: &str) -> String {
    format!("{}-{}.dlcfbackup", prefix, Utc::now().format("%Y%m%d-%H%M%S"))
}

pub fn create_backup_archive(
    db_path: &Path,
    media_dir: &Path,
    backup_dir: &Path,
    target_path: Option<String>,
    prefix: &str,
) -> AppResult<PathBuf> {
    let target = resolve_target_path(backup_dir, target_path, prefix)?;
    if let Some(parent) = target.parent() {
        std::fs::create_dir_all(parent)?;
    }

    let file = File::create(&target)?;
    let mut archive = zip::ZipWriter::new(file);
    let options = SimpleFileOptions::default().compression_method(zip::CompressionMethod::Deflated);

    archive.start_file("database.sqlite3", options)?;
    let db_bytes = std::fs::read(db_path)?;
    archive.write_all(&db_bytes)?;

    if media_dir.exists() {
        for entry in std::fs::read_dir(media_dir)? {
            let entry = entry?;
            let path = entry.path();
            if path.is_file() {
                let file_name = path
                    .file_name()
                    .and_then(|value| value.to_str())
                    .ok_or_else(|| AppError::Validation("Invalid media file name.".to_string()))?;
                archive.start_file(format!("media/{file_name}"), options)?;
                archive.write_all(&std::fs::read(&path)?)?;
            }
        }
    }

    archive.finish()?;
    Ok(target)
}

pub fn stage_restore(backup_path: &Path, app_data_dir: &Path) -> AppResult<PathBuf> {
    if !backup_path.exists() {
        return Err(AppError::Validation("Backup file does not exist.".to_string()));
    }

    let file = File::open(backup_path)?;
    let mut archive = zip::ZipArchive::new(file)?;
    let mut database_file = archive.by_name("database.sqlite3")?;
    let mut bytes = Vec::new();
    database_file.read_to_end(&mut bytes)?;

    let pending_restore = app_data_dir.join("restore-pending.sqlite3");
    std::fs::write(&pending_restore, bytes)?;

    Ok(pending_restore)
}

fn resolve_target_path(backup_dir: &Path, target_path: Option<String>, prefix: &str) -> AppResult<PathBuf> {
    match target_path {
        Some(raw) if !raw.trim().is_empty() => {
            let path = PathBuf::from(raw);
            if path.extension().is_some() {
                Ok(path)
            } else {
                Ok(path.join(backup_file_name(prefix)))
            }
        }
        _ => Ok(backup_dir.join(backup_file_name(prefix))),
    }
}
