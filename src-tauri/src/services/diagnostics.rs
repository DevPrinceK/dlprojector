use std::io::Write;
use std::path::Path;

pub fn record(log_path: &Path, message: &str) {
    let timestamp = chrono::Utc::now().to_rfc3339();
    if let Some(parent) = log_path.parent() {
        let _ = std::fs::create_dir_all(parent);
    }
    if let Ok(mut file) = std::fs::OpenOptions::new()
        .create(true)
        .append(true)
        .open(log_path)
    {
        let _ = writeln!(file, "[{timestamp}] {message}");
    }
}
