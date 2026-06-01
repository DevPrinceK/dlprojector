use rusqlite::{params, Connection};

use crate::error::AppResult;

const MIGRATIONS: &[(&str, &str)] = &[
    ("001_initial", include_str!("../../migrations/001_initial.sql")),
    ("002_bible_tables", include_str!("../../migrations/002_bible_tables.sql")),
    (
        "003_projection_history",
        include_str!("../../migrations/003_projection_history.sql"),
    ),
];

pub fn run_migrations(connection: &Connection) -> AppResult<()> {
    connection.execute_batch(
        "CREATE TABLE IF NOT EXISTS schema_migrations (
            version TEXT PRIMARY KEY,
            applied_at TEXT NOT NULL DEFAULT (datetime('now'))
        );",
    )?;

    for (version, sql) in MIGRATIONS {
        let exists: i64 = connection.query_row(
            "SELECT COUNT(*) FROM schema_migrations WHERE version = ?1",
            params![version],
            |row| row.get(0),
        )?;

        if exists == 0 {
            connection.execute_batch(sql)?;
            connection.execute(
                "INSERT INTO schema_migrations(version) VALUES (?1)",
                params![version],
            )?;
        }
    }

    Ok(())
}
