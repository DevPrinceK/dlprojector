use rusqlite::{params, Connection, OptionalExtension};

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

    ensure_column(
        connection,
        "service_programs",
        "deleted_at",
        "TEXT",
    )?;
    ensure_column(
        connection,
        "media_assets",
        "updated_at",
        "TEXT NOT NULL DEFAULT '1970-01-01T00:00:00Z'",
    )?;
    ensure_column(
        connection,
        "media_assets",
        "deleted_at",
        "TEXT",
    )?;
    seed_demo_data(connection)?;

    Ok(())
}

fn ensure_column(
    connection: &Connection,
    table_name: &str,
    column_name: &str,
    column_definition: &str,
) -> AppResult<()> {
    let mut statement = connection.prepare(&format!("PRAGMA table_info({table_name})"))?;
    let rows = statement.query_map([], |row| row.get::<_, String>(1))?;
    let mut exists = false;

    for row in rows {
        if row? == column_name {
            exists = true;
            break;
        }
    }

    if !exists {
        connection.execute_batch(&format!(
            "ALTER TABLE {table_name} ADD COLUMN {column_name} {column_definition};"
        ))?;
    }

    Ok(())
}

fn seed_demo_data(connection: &Connection) -> AppResult<()> {
    let seed_version = "demo-seed-2026-06-01-v2";
    let current_seed: Option<String> = connection
        .query_row(
            "SELECT value FROM app_settings WHERE key = 'demo.seedVersion'",
            [],
            |row| row.get(0),
        )
        .optional()?;

    if current_seed.as_deref() == Some(seed_version) && demo_seed_counts_are_ready(connection)? {
        return Ok(());
    }

    seed_scriptures(connection)?;
    seed_hymns(connection)?;
    seed_announcements(connection)?;
    seed_personalities(connection)?;
    seed_service_program(connection)?;

    connection.execute(
        "INSERT INTO app_settings(key, value, created_at, updated_at)
         VALUES ('demo.seedVersion', ?1, datetime('now'), datetime('now'))
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')",
        params![seed_version],
    )?;

    Ok(())
}

fn demo_seed_counts_are_ready(connection: &Connection) -> AppResult<bool> {
    let hymn_count = count_rows(connection, "hymns", "deleted_at IS NULL")?;
    let announcement_count = count_rows(connection, "announcements", "deleted_at IS NULL")?;
    let personality_count = count_rows(connection, "personalities", "deleted_at IS NULL")?;
    let scripture_count = count_rows(connection, "bible_verses", "1 = 1")?;
    let service_item_count = count_rows(connection, "service_items", "1 = 1")?;

    Ok(hymn_count >= 10
        && announcement_count >= 10
        && personality_count >= 10
        && scripture_count >= 90
        && service_item_count >= 10)
}

fn count_rows(connection: &Connection, table_name: &str, predicate: &str) -> AppResult<i64> {
    let sql = format!("SELECT COUNT(*) FROM {table_name} WHERE {predicate}");
    Ok(connection.query_row(&sql, [], |row| row.get(0))?)
}

fn seed_scriptures(connection: &Connection) -> AppResult<()> {
    let books = [
        (5, "Matthew", "Matt", "New", 40),
        (6, "Mark", "Mk", "New", 41),
        (7, "Luke", "Lk", "New", 42),
        (8, "Acts", "Acts", "New", 44),
        (9, "Ephesians", "Eph", "New", 49),
    ];

    for (id, name, abbreviation, testament, position) in books {
        connection.execute(
            "INSERT OR IGNORE INTO bible_books(id, name, abbreviation, testament, position)
             VALUES (?1, ?2, ?3, ?4, ?5)",
            params![id, name, abbreviation, testament, position],
        )?;
    }

    let scripture_sets = [
        (1, "Genesis", 1, 31),
        (2, "Psalm", 23, 6),
        (3, "John", 3, 21),
        (4, "Romans", 8, 25),
        (5, "Matthew", 5, 20),
    ];

    for (book_id, book_name, chapter, verse_count) in scripture_sets {
        for verse in 1..=verse_count {
            let text = format!(
                "Demo scripture seed for {book_name} {chapter}:{verse}. This local sample helps test search and projection; import the full Bible text before live service."
            );
            connection.execute(
                "INSERT OR IGNORE INTO bible_verses(version_id, book_id, chapter, verse, text)
                 VALUES (1, ?1, ?2, ?3, ?4)",
                params![book_id, chapter, verse, text],
            )?;
        }
    }

    Ok(())
}

fn seed_hymns(connection: &Connection) -> AppResult<()> {
    for index in 1..=10 {
        let number = format!("{:03}", 100 + index);
        let title = format!("Demo Hymn {index}");
        let existing: i64 = connection.query_row(
            "SELECT COUNT(*) FROM hymns WHERE number = ?1 AND deleted_at IS NULL",
            params![number],
            |row| row.get(0),
        )?;
        if existing > 0 {
            continue;
        }

        let lyrics_json = format!(
            r#"{{"title":"{title}","number":"{number}","stanzas":["Verse one of {title}\nLift up your heart in worship today\nGrace has found us on the way\nWe will serve the Lord with joy","Verse two of {title}\nFaithful is the Lord our King\nEvery heart arise and sing\nDLCF Legon gives Him praise"],"chorus":"Hallelujah, amen\nWe worship Christ the Lord"}}"#
        );
        connection.execute(
            "INSERT INTO hymns(number, title, category, author, lyrics_json, is_active)
             VALUES (?1, ?2, ?3, ?4, ?5, 1)",
            params![number, title, "Demo Worship", "DL Projector Seed", lyrics_json],
        )?;
    }

    Ok(())
}

fn seed_announcements(connection: &Connection) -> AppResult<()> {
    for index in 1..=10 {
        let title = format!("Demo Announcement {index}");
        let existing: i64 = connection.query_row(
            "SELECT COUNT(*) FROM announcements WHERE title = ?1 AND deleted_at IS NULL",
            params![title],
            |row| row.get(0),
        )?;
        if existing > 0 {
            continue;
        }

        let message = format!(
            "This is announcement {index} for testing slide layouts, dates, venues, and projection readability."
        );
        let event_time = format!("{:02}:30", 8 + (index % 10));
        connection.execute(
            "INSERT INTO announcements(title, message, event_date, event_time, venue, image_path, category, is_active)
             VALUES (?1, ?2, date('now', printf('+%d days', ?3)), ?4, ?5, NULL, ?6, 1)",
            params![
                title,
                message,
                index,
                event_time,
                "DLCF Legon Auditorium",
                "Demo"
            ],
        )?;
    }

    Ok(())
}

fn seed_personalities(connection: &Connection) -> AppResult<()> {
    let departments = [
        "Choir",
        "Ushering",
        "Prayer",
        "Bible Study",
        "Media",
        "Evangelism",
        "Welfare",
        "Technical",
        "Drama",
        "Protocol",
    ];

    for index in 1..=10 {
        let full_name = format!("Demo Member {index}");
        let existing: i64 = connection.query_row(
            "SELECT COUNT(*) FROM personalities WHERE full_name = ?1 AND deleted_at IS NULL",
            params![full_name],
            |row| row.get(0),
        )?;
        if existing > 0 {
            continue;
        }

        let department = departments[(index - 1) as usize];
        let role = if index % 2 == 0 { "Coordinator" } else { "Member" };
        let short_bio = format!(
            "Demo profile {index} for testing Personality of the Week slides and photo placeholders."
        );
        connection.execute(
            "INSERT INTO personalities(full_name, department, role, favorite_scripture, short_bio, photo_path, week_date, is_active)
             VALUES (?1, ?2, ?3, ?4, ?5, NULL, date('now', printf('+%d days', ?6)), 1)",
            params![full_name, department, role, "Romans 8:28", short_bio, index],
        )?;
    }

    Ok(())
}

fn seed_service_program(connection: &Connection) -> AppResult<()> {
    let program_id = match connection
        .query_row(
            "SELECT id FROM service_programs WHERE is_active = 1 AND deleted_at IS NULL ORDER BY id ASC LIMIT 1",
            [],
            |row| row.get::<_, i64>(0),
        )
        .optional()?
    {
        Some(id) => id,
        None => {
            connection.execute(
                "INSERT INTO service_programs(title, service_date, notes, is_active)
                 VALUES ('Demo Worship Service', date('now'), 'Seeded demo service flow.', 1)",
                [],
            )?;
            connection.last_insert_rowid()
        }
    };

    let items = [
        ("Praise and Worship", "custom", "Praise and Worship", "Let us worship the Lord together."),
        ("Congregational Hymn", "custom", "Congregational Hymn", "Prepare to sing with joy."),
        ("Scripture Reading", "custom", "Scripture Reading", "Romans 8:28"),
        ("Choir Ministration", "custom", "Choir Ministration", "The choir will minister now."),
        ("Message", "custom", "Message", "Prepare your heart for the Word."),
        ("Offering", "custom", "Offering", "Give cheerfully unto the Lord."),
        ("Announcements", "custom", "Announcements", "Please listen to these announcements."),
        ("Personality of the Week", "custom", "Personality of the Week", "Celebrating faithful service."),
        ("Closing Prayer", "custom", "Closing Prayer", "Let us pray."),
        ("Fellowship Benediction", "custom", "Fellowship Benediction", "Surely goodness and mercy shall follow us."),
    ];

    for (index, (title, item_type, content_title, body)) in items.iter().enumerate() {
        let existing: i64 = connection.query_row(
            "SELECT COUNT(*) FROM service_items WHERE service_program_id = ?1 AND title = ?2",
            params![program_id, title],
            |row| row.get(0),
        )?;
        if existing > 0 {
            continue;
        }

        let content_json = format!(
            r#"{{"type":"custom","title":"{content_title}","body":"{body}"}}"#
        );
        connection.execute(
            "INSERT INTO service_items(service_program_id, item_type, title, custom_content_json, position)
             VALUES (?1, ?2, ?3, ?4, ?5)",
            params![program_id, item_type, title, content_json, (index + 10) as i64],
        )?;
    }

    Ok(())
}
