use std::path::Path;

use rusqlite::Connection;

use crate::error::AppResult;

pub fn open_database(path: &Path) -> AppResult<Connection> {
    let connection = Connection::open(path)?;
    connection.pragma_update(None, "journal_mode", "WAL")?;
    connection.pragma_update(None, "foreign_keys", "ON")?;
    connection.pragma_update(None, "busy_timeout", 5000)?;
    Ok(connection)
}
