# Backup and Restore

DL Projector stores data in the operating system app data directory. Backups are exported as `.dlcfbackup` archives.

Automatic backups can use the managed app directory or a custom folder configured in Settings. Retention is configurable from 1 to 50 archives, and the oldest automatic backups are removed only after a new backup succeeds.

## Manual Export

1. Open `Settings`.
2. Enter an optional folder or full `.dlcfbackup` path.
3. Click `Export`.

## Restore

1. Open `Settings`.
2. Enter the backup file path.
3. Click `Restore`.
4. Restart the app.

Restore is staged safely so the active SQLite connection is not replaced while the app is running.
