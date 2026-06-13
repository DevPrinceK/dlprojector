use std::path::{Path, PathBuf};

use uuid::Uuid;

use crate::error::{AppError, AppResult};

const ALLOWED_EXTENSIONS: &[&str] = &["png", "jpg", "jpeg", "webp"];
const MAX_IMAGE_BYTES: usize = 20 * 1024 * 1024;
const MAX_IMAGE_WIDTH: u32 = 1920;
const MAX_IMAGE_HEIGHT: u32 = 1080;

pub fn copy_media_asset(
    source_path: &str,
    media_dir: &Path,
) -> AppResult<(String, PathBuf, String, i64)> {
    let source = PathBuf::from(source_path);
    if !source.exists() || !source.is_file() {
        return Err(AppError::Validation(
            "Image file does not exist.".to_string(),
        ));
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
        .filter(|character| {
            character.is_ascii_alphanumeric() || *character == '-' || *character == '_'
        })
        .collect::<String>();
    let safe_name = if original_name.is_empty() {
        "image".to_string()
    } else {
        original_name
    };
    let file_name = format!("{}-{}.{}", safe_name, Uuid::new_v4(), extension);
    let destination = media_dir.join(&file_name);
    std::fs::copy(&source, &destination)?;
    optimize_media_asset(&destination)?;
    let metadata = std::fs::metadata(&destination)?;

    Ok((file_name, destination, extension, metadata.len() as i64))
}

pub fn download_media_asset(
    url: &str,
    media_dir: &Path,
) -> AppResult<(String, PathBuf, String, i64)> {
    if !url.starts_with("https://") && !url.starts_with("http://") {
        return Err(AppError::Validation(
            "Image URL must start with http:// or https://.".to_string(),
        ));
    }

    let response = reqwest::blocking::Client::builder()
        .timeout(std::time::Duration::from_secs(30))
        .build()?
        .get(url)
        .send()?
        .error_for_status()?;
    let content_type = response
        .headers()
        .get(reqwest::header::CONTENT_TYPE)
        .and_then(|value| value.to_str().ok())
        .unwrap_or("")
        .split(';')
        .next()
        .unwrap_or("");
    let extension = match content_type {
        "image/png" => "png",
        "image/jpeg" => "jpg",
        "image/webp" => "webp",
        _ => {
            return Err(AppError::Validation(
                "The URL must point directly to a PNG, JPG, JPEG, or WEBP image.".to_string(),
            ))
        }
    };
    let bytes = response.bytes()?;
    if bytes.len() > MAX_IMAGE_BYTES {
        return Err(AppError::Validation(
            "Image is larger than the 20 MB limit.".to_string(),
        ));
    }

    std::fs::create_dir_all(media_dir)?;
    let file_name = format!("remote-{}.{}", Uuid::new_v4(), extension);
    let destination = media_dir.join(&file_name);
    std::fs::write(&destination, &bytes)?;
    optimize_media_asset(&destination)?;
    let optimized_size = std::fs::metadata(&destination)?.len() as i64;
    Ok((
        file_name,
        destination,
        extension.to_string(),
        optimized_size,
    ))
}

pub fn optimize_media_asset(path: &Path) -> AppResult<()> {
    let image = image::open(path)?;
    if image.width() <= MAX_IMAGE_WIDTH && image.height() <= MAX_IMAGE_HEIGHT {
        return Ok(());
    }
    image
        .thumbnail(MAX_IMAGE_WIDTH, MAX_IMAGE_HEIGHT)
        .save(path)?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn oversized_images_are_resized_for_projection() {
        let root = std::env::temp_dir().join(format!("dlprojector-image-test-{}", Uuid::new_v4()));
        std::fs::create_dir_all(&root).unwrap();
        let path = root.join("oversized.png");
        image::DynamicImage::new_rgb8(3000, 2000)
            .save(&path)
            .unwrap();

        optimize_media_asset(&path).unwrap();

        let optimized = image::open(&path).unwrap();
        assert!(optimized.width() <= MAX_IMAGE_WIDTH);
        assert!(optimized.height() <= MAX_IMAGE_HEIGHT);
        let _ = std::fs::remove_dir_all(root);
    }
}
