# Backup and Restore

DL Projector stores data in the operating system app data directory. Backups are exported as `.dlcfbackup` archives.

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
