use std::path::{Path, PathBuf};

use uuid::Uuid;

use crate::error::{AppError, AppResult};

const ALLOWED_EXTENSIONS: &[&str] = &["png", "jpg", "jpeg", "webp"];

pub fn copy_media_asset(source_path: &str, media_dir: &Path) -> AppResult<(String, PathBuf, String, i64)> {
    let source = PathBuf::from(source_path);
    if !source.exists() || !source.is_file() {
        return Err(AppError::Validation("Image file does not exist.".to_string()));
    }

    let extension = source
        .extension()
        .and_then(|value| value.to_str())
        .map(|value| value.to_lowercase())
        .ok_or_else(|| AppError::Validation("Image file must have an extension.".to_string()))?;

    if !ALLOWED_EXTENSIONS.contains(&extension.as_str()) {
        return Err(AppError::Validation(
            "Only PNG, JPG, JPEG, and WEBP images are supported.".to_string(),
        ));
    }

    std::fs::create_dir_all(media_dir)?;
    let original_name = source
        .file_stem()
        .and_then(|value| value.to_str())
        .unwrap_or("image")
        .chars()
        .filter(|character| character.is_ascii_alphanumeric() || *character == '-' || *character == '_')
        .collect::<String>();
    let safe_name = if original_name.is_empty() {
        "image".to_string()
    } else {
        original_name
    };
    let file_name = format!("{}-{}.{}", safe_name, Uuid::new_v4(), extension);
    let destination = media_dir.join(&file_name);
    std::fs::copy(&source, &destination)?;
    let metadata = std::fs::metadata(&destination)?;

    Ok((file_name, destination, extension, metadata.len() as i64))
}
