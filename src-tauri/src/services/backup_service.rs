use std::fs::File;
use std::io::{Read, Write};
use std::path::{Path, PathBuf};

use chrono::Utc;
use zip::write::SimpleFileOptions;

use crate::error::{AppError, AppResult};

pub fn backup_file_name(prefix: &str) -> String {
    format!(
        "{}-{}.dlcfbackup",
        prefix,
        Utc::now().format("%Y%m%d-%H%M%S")
    )
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
        return Err(AppError::Validation(
            "Backup file does not exist.".to_string(),
        ));
    }

    let file = File::open(backup_path)?;
    let mut archive = zip::ZipArchive::new(file)?;
    let pending_restore = app_data_dir.join("restore-pending.sqlite3");
    let pending_media = app_data_dir.join("restore-pending-media");
    if pending_media.exists() {
        std::fs::remove_dir_all(&pending_media)?;
    }

    for index in 0..archive.len() {
        let mut entry = archive.by_index(index)?;
        let Some(enclosed) = entry.enclosed_name() else {
            return Err(AppError::Validation(
                "Backup contains an unsafe file path.".to_string(),
            ));
        };

        if enclosed == Path::new("database.sqlite3") {
            let mut bytes = Vec::new();
            entry.read_to_end(&mut bytes)?;
            std::fs::write(&pending_restore, bytes)?;
        } else if let Ok(relative) = enclosed.strip_prefix("media") {
            if relative.as_os_str().is_empty() || entry.is_dir() {
                continue;
            }
            let destination = pending_media.join(relative);
            if let Some(parent) = destination.parent() {
                std::fs::create_dir_all(parent)?;
            }
            let mut output = File::create(destination)?;
            std::io::copy(&mut entry, &mut output)?;
        }
    }

    if !pending_restore.exists() {
        return Err(AppError::Validation(
            "Backup does not contain a database.".to_string(),
        ));
    }

    Ok(pending_restore)
}

pub fn prune_auto_backups(backup_dir: &Path, retain: usize) -> AppResult<()> {
    if !backup_dir.exists() {
        return Ok(());
    }
    let mut backups = std::fs::read_dir(backup_dir)?
        .filter_map(Result::ok)
        .map(|entry| entry.path())
        .filter(|path| {
            path.file_name()
                .and_then(|name| name.to_str())
                .is_some_and(|name| name.starts_with("auto-") && name.ends_with(".dlcfbackup"))
        })
        .collect::<Vec<_>>();
    backups.sort_by_key(|path| {
        std::fs::metadata(path)
            .and_then(|metadata| metadata.modified())
            .ok()
    });
    let remove_count = backups.len().saturating_sub(retain.max(1));
    for path in backups.into_iter().take(remove_count) {
        std::fs::remove_file(path)?;
    }
    Ok(())
}

fn resolve_target_path(
    backup_dir: &Path,
    target_path: Option<String>,
    prefix: &str,
) -> AppResult<PathBuf> {
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn backup_round_trip_stages_database_and_media() {
        let root =
            std::env::temp_dir().join(format!("dlprojector-backup-test-{}", uuid::Uuid::new_v4()));
        let media = root.join("media");
        let backups = root.join("backups");
        let restore = root.join("restore");
        std::fs::create_dir_all(&media).unwrap();
        std::fs::create_dir_all(&backups).unwrap();
        std::fs::create_dir_all(&restore).unwrap();
        let database = root.join("database.sqlite3");
        std::fs::write(&database, b"database-bytes").unwrap();
        std::fs::write(media.join("photo.png"), b"image-bytes").unwrap();

        let archive = create_backup_archive(&database, &media, &backups, None, "test").unwrap();
        stage_restore(&archive, &restore).unwrap();

        assert_eq!(
            std::fs::read(restore.join("restore-pending.sqlite3")).unwrap(),
            b"database-bytes"
        );
        assert_eq!(
            std::fs::read(restore.join("restore-pending-media").join("photo.png")).unwrap(),
            b"image-bytes"
        );
        let _ = std::fs::remove_dir_all(root);
    }

    #[test]
    fn automatic_backup_retention_removes_oldest_archives() {
        let root = std::env::temp_dir().join(format!(
            "dlprojector-retention-test-{}",
            uuid::Uuid::new_v4()
        ));
        std::fs::create_dir_all(&root).unwrap();
        for index in 0..4 {
            std::fs::write(root.join(format!("auto-{index}.dlcfbackup")), [index]).unwrap();
            std::thread::sleep(std::time::Duration::from_millis(5));
        }

        prune_auto_backups(&root, 2).unwrap();
        let remaining = std::fs::read_dir(&root).unwrap().count();
        assert_eq!(remaining, 2);
        let _ = std::fs::remove_dir_all(root);
    }
}
