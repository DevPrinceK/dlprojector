use serde::Serialize;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum AppError {
    #[error("Database error: {0}")]
    Database(#[from] rusqlite::Error),
    #[error("File operation failed: {0}")]
    Io(#[from] std::io::Error),
    #[error("Invalid data: {0}")]
    Validation(String),
    #[error("Serialization failed: {0}")]
    Serialization(#[from] serde_json::Error),
    #[error("Backup failed: {0}")]
    Zip(#[from] zip::result::ZipError),
    #[error("Network operation failed: {0}")]
    Network(#[from] reqwest::Error),
    #[error("Application error: {0}")]
    Tauri(String),
    #[error("Could not access shared app state.")]
    StateUnavailable,
    #[error("{0}")]
    Message(String),
}

impl Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}

pub type AppResult<T> = Result<T, AppError>;
