# DLCF Legon Projection Software — Comprehensive MVP Specification

## 1. Product Overview

### Product Name
**DLCF Legon Projection Software (DL PROJECTOR)**

### Purpose
A lightweight, offline-first desktop projection application for church services. The software should help media/projection teams display scriptures, hymns, announcements, and “Personality of the Week” slides cleanly and reliably during live church service.

The system must prioritize **stability, speed, simplicity, and beautiful projection output**. It must not depend on internet connectivity during service.

---

## 2. Core Philosophy

The first version should be simple, practical, and reliable.

Avoid overengineering. Avoid AI features for now. Avoid cloud dependency for the MVP.

The system should behave like a polished church-specific alternative to PowerPoint, with faster scripture and hymn projection workflows.

### Core Goals

1. Work fully offline.
2. Support dual-window projection.
3. Have a clean and beautiful operator interface.
4. Have an elegant full-screen projection display.
5. Be fast enough for live church use.
6. Recover gracefully from errors.
7. Avoid crashes during projection.
8. Store data locally using SQLite.
9. Allow easy import/export and backup.
10. Be simple enough for non-technical church media team members.

---

## 3. Recommended Technology Stack

### Desktop Framework
**Tauri**

Reason:
- Lightweight compared to Electron.
- Better memory efficiency.
- Suitable for offline desktop applications.
- Supports multiple windows.
- Can package for Windows, macOS, and Linux.
- Good fit for projection software where performance and stability matter.

### Frontend
**React + TypeScript**

Reason:
- Strong component-based UI.
- Type safety.
- Good for dashboard-style interfaces.
- Easy state management.
- Suitable for building clean projection layouts.

### Styling
**Tailwind CSS + shadcn/ui**

Reason:
- Fast UI development.
- Clean, modern interface.
- Consistent components.
- Easy theming.

### Local Database
**SQLite**

Reason:
- Fully offline.
- No database server required.
- Reliable local storage.
- Perfect for scriptures, hymns, announcements, profiles, themes, and service programs.

### Tauri Backend
**Rust**

Used for:
- SQLite operations.
- File import/export.
- Window creation and management.
- Backup and restore.
- Local filesystem operations.
- App-level error handling.

### State Management
Use one of:

- Zustand
- Redux Toolkit
- React Context for small state

Recommended: **Zustand**

Reason:
- Lightweight.
- Simple.
- Good for local desktop apps.
- Less boilerplate.

### Database Access
Use a Rust SQLite library such as:

- rusqlite
- sqlx with SQLite support

Recommended: **rusqlite** for MVP simplicity.

---

## 4. Application Architecture

The application should have two primary windows.

### 4.1 Control Window

This is the main operator dashboard.

It stays on the laptop screen and contains all controls.

The operator uses this window to:
- Search scriptures.
- Search hymns.
- Create announcement slides.
- Prepare Personality of the Week.
- Build service program/order.
- Preview content before projection.
- Send selected content to the projection window.
- Move next/previous during projection.
- Clear projection screen.
- Show blank screen.
- Open/close projector window.

### 4.2 Projection Window

This is the clean output window shown on the projector.

It should contain no buttons, sidebars, menus, or editing controls.

It displays only the selected content:
- Scripture slide
- Hymn stanza
- Announcement slide
- Personality of the Week slide
- Blank screen
- Logo screen
- Custom loader screen

The projection window should be movable to the second monitor/projector and set to fullscreen.

---

## 5. Dual Window Behavior

### Expected User Flow

1. Operator opens the desktop app.
2. The Control Window appears on the laptop.
3. Operator clicks **Open Projection Window**.
4. Projection Window opens.
5. Operator moves it to the projector display.
6. Operator clicks **Fullscreen**.
7. Operator controls all content from the Control Window.
8. Congregation only sees the Projection Window.

### Communication Between Windows

Use Tauri event system.

Example events:
- `projection:show-scripture`
- `projection:show-hymn`
- `projection:show-announcement`
- `projection:show-personality`
- `projection:clear`
- `projection:blank`
- `projection:show-loader`
- `projection:next`
- `projection:previous`

The Control Window emits events.
The Projection Window listens and updates display state.

---

## 6. Reliability Requirements

This is very important.

The system will be used during live church service. It must not crash in the middle of projection.

### 6.1 Stability Requirements

The application must:

- Handle all errors gracefully.
- Never show raw technical errors on the projection screen.
- Avoid blocking the UI during database operations.
- Avoid heavy operations during live projection.
- Cache currently projected content in memory.
- Continue displaying the last projected slide even if the control window has a temporary issue.
- Use safe fallbacks when media files are missing.
- Validate imported files before saving.
- Avoid runtime panics in Rust.
- Use TypeScript strict mode.
- Prevent null/undefined rendering errors.
- Use React error boundaries.

### 6.2 Projection Safety

The Projection Window must:

- Keep showing the last valid content until new valid content arrives.
- Not crash because of missing image, malformed text, or invalid data.
- Have fallback display states:
  - Blank screen
  - DLCF Legon logo screen
  - “Please wait” loader
  - Last known content

### 6.3 Database Safety

SQLite operations should:

- Use transactions where needed.
- Avoid corrupt writes.
- Use proper migrations.
- Create automatic local backups.
- Never delete records permanently without confirmation.
- Support soft delete where appropriate.

### 6.4 Backup Strategy

The app should support:

- Manual export backup.
- Manual import restore.
- Automatic backup on app close.
- Automatic backup before database migration.
- Backup file format: `.dlcfbackup` or `.zip`.

Backup should include:

- SQLite database.
- Uploaded images.
- Theme files.
- Config file.

### 6.5 Crash Recovery

On restart, the app should restore:

- Last opened service program.
- Last projection mode.
- Recently projected items.
- Current theme.
- Window configuration where possible.

---

## 7. Main Modules

## 7.1 Dashboard

The dashboard is the home screen of the Control Window.

It should show:

- Quick access buttons.
- Today’s service program.
- Recent scriptures.
- Recent hymns.
- Active projection status.
- Button to open Projection Window.
- Button to show logo screen.
- Button to blank screen.
- Button to clear screen.

Suggested layout:

- Left sidebar navigation.
- Main content area.
- Right live preview/queue panel.

---

## 7.2 Scripture Projection Module

### Purpose
Allow operators to quickly find and project Bible verses.

### MVP Features
- Search by book, chapter, and verse.
- Example searches:
  - `John 3:16`
  - `Romans 8:28`
  - `Psalm 23`
  - `Genesis 1:1-5`
- Display one verse at a time.
- Display a range of verses.
- Next/previous verse navigation.
- Preview before projecting.
- Project instantly.
- Store recently used scriptures.

### Data Requirements
Bible text should be imported into SQLite.

Suggested tables:
- bible_versions
- bible_books
- bible_verses

### Bible Version Support
For MVP, support one default Bible version initially.

Example:
- KJV (Default)
- ASV
- WEB

The app should be designed to support multiple versions later.

### Scripture Slide Design
Projection should show:
- Reference at top or bottom (configurable).
- Verse text centered.
- Version label.
- Clean typography.
- High contrast.
- Configurable font size.

Example:

```text
John 3:16

For God so loved the world, that he gave his only begotten Son...
```

---

## 7.3 Hymn Projection Module

### Purpose
Allow operators to search and project hymns verse by verse.

### MVP Features

- Add hymn manually.
- Edit hymn.
- Delete/soft delete hymn.
- Search by title.
- Search by hymn number.
- Search by first line.
- Project stanza by stanza.
- Next/previous stanza.
- Chorus support.
- Preview before projection.

### Hymn Data Fields

Each hymn should have:

- Hymn number
- Title
- Category
- Lyrics
- Stanzas
- Chorus
- Author, optional
- Created date
- Updated date

### Hymn Display Rules

Projection should show:

- Hymn title, optional.
- Current stanza.
- Chorus where needed.
- Large readable text.
- Centered layout.
- Good line spacing.

### Hymn Storage Format

Store hymn stanzas in structured format.

Example:

```json
{
  "title": "Amazing Grace",
  "number": "001",
  "stanzas": [
    "Amazing grace, how sweet the sound...",
    "Twas grace that taught my heart to fear..."
  ],
  "chorus": ""
}
```

---

## 7.4 Announcement Projection Module

### Purpose
Create and project church announcements without PowerPoint.

### MVP Features

- Create announcement.
- Edit announcement.
- Add title.
- Add message.
- Add date and time.
- Add optional image.
- Add category.
- Project announcement.
- Show announcements as individual slides.
- Mark announcement as active/inactive.

### Announcement Fields

- Title
- Message
- Date
- Time
- Venue/location
- Image path
- Category
- Active status
- Created date
- Updated date

### Projection Design

Announcement slides should be beautiful and readable.

Example layout:

- Large title.
- Supporting message.
- Date/time badge.
- Venue badge.
- Optional background image with overlay.

---

## 7.5 Personality of the Week Module

### Purpose

Project a weekly profile slide for a selected church member.

### MVP Features

- Add person.
- Add photo.
- Add name.
- Add department.
- Add role.
- Add favorite scripture.
- Add short bio.
- Project profile slide.
- Edit profile.
- Archive old profiles.

### Fields

- Full name
- Photo path
- Department
- Role
- Favorite scripture
- Short note/bio
- Week date
- Active status

### Projection Design
Should feel elegant and celebratory.

Suggested layout:

- Large photo.
- Full name.
- Department.
- Role.
- Favorite scripture.
- Decorative church-themed background.

---

## 7.6 Service Program Module

### Purpose
Allow the projection team to prepare the order of service before the service begins.

### MVP Features

- Create service program.
- Add service items.
- Reorder items with drag and drop.
- Attach scripture/hymn/announcement/personality item to a service step.
- Mark current item.
- Move next/previous.
- Project selected item.
- Save reusable service templates.

### Example Service Program

```text
1. Opening Prayer
2. Praise and Worship
3. Hymn 45
4. Scripture Reading: Romans 8:28
5. Sermon
6. Announcements
7. Personality of the Week
8. Closing Prayer
```

### Service Item Types

- Text
- Scripture
- Hymn
- Announcement
- Personality
- Blank
- Logo
- Custom slide

---

## 7.7 Projection Control Panel

This should always be accessible.

Controls:

- Open Projection Window
- Fullscreen Projection
- Show Logo
- Show Loader
- Blank Screen
- Clear Screen
- Previous
- Next
- Project Current
- Emergency Reset Projection

### Emergency Reset Projection

This should:

- Stop current projection state.
- Clear unsafe data.
- Show a stable logo or blank screen.
- Keep app running.

---

## 8. Custom Loader

The app should include a beautiful custom loader that animates the text:

```text
DLCF Legon
```

### Loader Usage

Show loader:

- When app starts.
- When projection window opens.
- When content is loading.
- When operator manually chooses “Show Loader”.

### Loader Design

The loader should be elegant, church-friendly, and modern.

Suggested animation:

- Letters of “DLCF Legon” fade in one by one.
- Subtle glow pulse.
- Optional rotating ring or soft light sweep.
- Dark navy or deep purple background.
- Gold/white text.
- Smooth animation.
- No distracting effects.

### Loader Text

Primary:

```text
DLCF Legon
```

Optional subtitle:

```text
Preparing Projection...
```

### Loader Performance

Use CSS animations only.
Avoid heavy animation libraries for the loader.
No large video loader.

---

## 9. UI/UX Design Requirements

The app should look clean, modern, and calm.

### Design Personality

- Minimal
- Premium
- Church-friendly
- Calm
- Readable
- Fast
- Operator-focused

### Suggested Theme

Primary colors:

- Deep navy
- Royal purple
- Gold accent
- White text

Avoid overly flashy colors.

### Control Window Layout

Recommended structure:

```text
-------------------------------------------------
| Sidebar | Main Workspace              | Preview |
|         |                             | Queue   |
|         |                             | Controls|
-------------------------------------------------
```

### Sidebar Items

- Dashboard
- Scriptures
- Hymns
- Announcements
- Personality
- Service Program
- Media Library
- Settings

### Preview Panel

The preview panel should show:

- Selected content.
- How it will appear on projection.
- Project button.
- Add to service button.
- Next/previous where applicable.

### Keyboard Shortcuts

Important for live service.

Suggested shortcuts:

- Space: Next
- Arrow Right: Next
- Arrow Left: Previous
- B: Blank screen
- L: Show logo
- Esc: Exit fullscreen, only on control window
- Ctrl + F: Search
- Ctrl + P: Project selected
- Ctrl + O: Open projection window

Make shortcuts configurable later.

---

## 10. Projection Design Requirements

Projection output must prioritize readability.

### General Rules

- Big text.
- High contrast.
- Simple background.
- Avoid clutter.
- No UI controls.
- No mouse cursor if possible.
- Smooth transitions.
- Never show raw errors.

### Slide Types

- Scripture slide.
- Hymn slide.
- Announcement slide.
- Personality slide.
- Logo slide.
- Blank slide.
- Loader slide.

### Transitions

Keep transitions simple:

- Fade
- Slide up
- Crossfade

Avoid distracting transitions.

---

## 11. Local Media Library

### Purpose

Manage images used in announcements and personality profiles.

### MVP Features

- Upload image.
- Store image locally.
- Preview image.
- Use image in announcement.
- Use image in personality slide.
- Validate image file type.
- Compress/copy image safely into app data directory.

### Supported File Types

- PNG
- JPG
- JPEG
- WEBP

### Safety

If image is missing:

- Show placeholder.
- Do not crash.
- Log warning internally.

---

## 12. Database Schema

Suggested tables:

### app_settings

- id
- key
- value
- created_at
- updated_at

### bible_versions

- id
- name
- abbreviation
- language
- is_default
- created_at

### bible_books

- id
- name
- abbreviation
- testament
- position

### bible_verses

- id
- version_id
- book_id
- chapter
- verse
- text

### hymns

- id
- number
- title
- category
- author
- lyrics_json
- is_active
- created_at
- updated_at
- deleted_at

### announcements

- id
- title
- message
- event_date
- event_time
- venue
- image_path
- category
- is_active
- created_at
- updated_at
- deleted_at

### personalities

- id
- full_name
- department
- role
- favorite_scripture
- short_bio
- photo_path
- week_date
- is_active
- created_at
- updated_at
- deleted_at

### service_programs

- id
- title
- service_date
- notes
- is_active
- created_at
- updated_at

### service_items

- id
- service_program_id
- item_type
- title
- linked_entity_id
- custom_content_json
- position
- created_at
- updated_at

### projection_history

- id
- content_type
- content_ref
- content_snapshot_json
- projected_at

### media_assets

- id
- file_name
- file_path
- file_type
- file_size
- created_at

---

## 13. Project Structure

Recommended project structure:

```text
dlprojector/
├── README.md
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.ts
├── components.json
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── routes/
│   │   ├── ControlRoutes.tsx
│   │   └── ProjectionRoutes.tsx
│   ├── windows/
│   │   ├── control/
│   │   │   ├── ControlApp.tsx
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── ScripturesPage.tsx
│   │   │   ├── HymnsPage.tsx
│   │   │   ├── AnnouncementsPage.tsx
│   │   │   ├── PersonalityPage.tsx
│   │   │   ├── ServiceProgramPage.tsx
│   │   │   ├── SettingsPage.tsx
│   │   │   └── components/
│   │   └── projection/
│   │       ├── ProjectionApp.tsx
│   │       ├── ProjectionRenderer.tsx
│   │       ├── slides/
│   │       │   ├── ScriptureSlide.tsx
│   │       │   ├── HymnSlide.tsx
│   │       │   ├── AnnouncementSlide.tsx
│   │       │   ├── PersonalitySlide.tsx
│   │       │   ├── LogoSlide.tsx
│   │       │   ├── BlankSlide.tsx
│   │       │   └── LoaderSlide.tsx
│   │       └── styles/
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   ├── preview/
│   │   ├── forms/
│   │   └── common/
│   ├── features/
│   │   ├── scriptures/
│   │   │   ├── scripture.api.ts
│   │   │   ├── scripture.types.ts
│   │   │   ├── scripture.utils.ts
│   │   │   └── scripture.store.ts
│   │   ├── hymns/
│   │   ├── announcements/
│   │   ├── personalities/
│   │   ├── service-program/
│   │   ├── projection/
│   │   └── settings/
│   ├── hooks/
│   ├── lib/
│   │   ├── tauri.ts
│   │   ├── events.ts
│   │   ├── shortcuts.ts
│   │   ├── validators.ts
│   │   └── error-handling.ts
│   ├── stores/
│   │   ├── projection.store.ts
│   │   ├── app.store.ts
│   │   └── ui.store.ts
│   ├── styles/
│   │   └── globals.css
│   └── types/
│       ├── projection.ts
│       ├── hymn.ts
│       ├── scripture.ts
│       └── common.ts
├── src-tauri/
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   ├── build.rs
│   ├── migrations/
│   │   ├── 001_initial.sql
│   │   ├── 002_bible_tables.sql
│   │   └── 003_projection_history.sql
│   └── src/
│       ├── main.rs
│       ├── db/
│       │   ├── mod.rs
│       │   ├── connection.rs
│       │   ├── migrations.rs
│       │   └── backup.rs
│       ├── commands/
│       │   ├── mod.rs
│       │   ├── scriptures.rs
│       │   ├── hymns.rs
│       │   ├── announcements.rs
│       │   ├── personalities.rs
│       │   ├── service_programs.rs
│       │   ├── projection.rs
│       │   ├── media.rs
│       │   └── settings.rs
│       ├── windows/
│       │   ├── mod.rs
│       │   └── projection_window.rs
│       ├── models/
│       │   ├── mod.rs
│       │   ├── scripture.rs
│       │   ├── hymn.rs
│       │   ├── announcement.rs
│       │   ├── personality.rs
│       │   ├── service_program.rs
│       │   └── settings.rs
│       ├── services/
│       │   ├── media_service.rs
│       │   ├── backup_service.rs
│       │   ├── import_service.rs
│       │   └── projection_service.rs
│       └── error.rs
├── public/
│   ├── logo.svg
│   ├── default-backgrounds/
│   └── placeholders/
└── docs/
    ├── user-guide.md
    ├── keyboard-shortcuts.md
    └── backup-restore.md
```

---

## 14. Core Data Types

### ProjectionContent

```ts
export type ProjectionContentType =
  | "scripture"
  | "hymn"
  | "announcement"
  | "personality"
  | "logo"
  | "blank"
  | "loader"
  | "custom";

export interface ProjectionContent {
  type: ProjectionContentType;
  title?: string;
  subtitle?: string;
  body?: string;
  reference?: string;
  imagePath?: string;
  metadata?: Record<string, unknown>;
}
```

### Projection State

```ts
export interface ProjectionState {
  currentContent: ProjectionContent | null;
  previousContent: ProjectionContent | null;
  isBlank: boolean;
  isProjectorConnected: boolean;
  lastUpdatedAt: string | null;
}
```

---

## 15. Tauri Commands

Suggested commands:

### Window Commands

- `open_projection_window`
- `close_projection_window`
- `set_projection_fullscreen`
- `focus_control_window`

### Scripture Commands

- `search_scriptures`
- `get_scripture_range`
- `get_recent_scriptures`

### Hymn Commands

- `create_hymn`
- `update_hymn`
- `delete_hymn`
- `search_hymns`
- `get_hymn`

### Announcement Commands

- `create_announcement`
- `update_announcement`
- `delete_announcement`
- `list_announcements`
- `get_announcement`

### Personality Commands

- `create_personality`
- `update_personality`
- `delete_personality`
- `list_personalities`
- `get_personality`

### Service Program Commands

- `create_service_program`
- `update_service_program`
- `delete_service_program`
- `add_service_item`
- `reorder_service_items`
- `get_active_service_program`

### Media Commands

- `import_media_asset`
- `delete_media_asset`
- `list_media_assets`

### Backup Commands

- `export_backup`
- `import_backup`
- `create_auto_backup`

---

## 16. Error Handling

### Frontend

Use:

- Error boundaries.
- Toast notifications.
- Safe empty states.
- Form validation.
- Fallback UI for projection slides.

### Backend

Use a centralized error type in Rust.

Avoid:

```rust
unwrap()
expect()
panic!()
```

Use proper `Result<T, AppError>` return types.

### User-Friendly Errors

Examples:

- “Could not load hymn. Please try again.”
- “Image file is missing. Showing placeholder.”
- “Projection window is not open.”
- “Backup failed. Please check storage permission.”

---

## 17. Performance Requirements

### General

- App should launch quickly.
- Search should feel instant.
- Projection update should happen within milliseconds.
- No heavy work should happen on the projection render thread.
- Large imports should show progress.
- Images should be optimized before use.

### Search

For scripture and hymns:

- Add indexes to searchable fields.
- Consider SQLite FTS5 for hymns and scripture search.
- Keep recent/frequently used items cached.

### Image Handling

- Copy media into app data directory.
- Generate smaller preview thumbnails.
- Use optimized image rendering.
- Avoid loading huge images directly into projection when possible.

---

## 18. Packaging

The app should be packaged as a desktop installer.

### Supported Platforms

For MVP:

- Windows first

Later:

- macOS
- Linux

### Windows Packaging

Use Tauri build to generate:

- `.msi` installer
- `.exe` installer if configured

### App Data Directory

Store database and media in the official app data directory, not inside the installation folder.

Example:

- Windows: `%APPDATA%/DLProjector`
- macOS: `~/Library/Application Support/DLProjector`
- Linux: `~/.local/share/DLProjector`

---

## 19. Settings

The Settings page should include:

### Projection Settings

- Default font size.
- Default background.
- Scripture layout.
- Hymn layout.
- Transition style.
- Show/hide scripture version.
- Show/hide hymn title.

### App Settings

- Theme mode.
- Backup location.
- Auto-backup enabled.
- Keyboard shortcuts.
- Default Bible version.

### Display Settings

- Open projection window.
- Fullscreen projection window.
- Remember projection window position.
- Default projection screen, if possible.

---

## 20. MVP Screens

### Control Window Screens

1. Splash/loading screen with custom DLCF Legon loader.
2. Dashboard.
3. Scripture search page.
4. Hymn library page.
5. Announcement management page.
6. Personality of the Week page.
7. Service Program page.
8. Media Library page.
9. Settings page.

### Projection Window Screens

1. Loader screen.
2. Logo screen.
3. Blank screen.
4. Scripture slide.
5. Hymn slide.
6. Announcement slide.
7. Personality slide.

---

## 21. Development Phases

### Phase 1: App Shell

- Set up Tauri + React + TypeScript.
- Add Tailwind and shadcn/ui.
- Create Control Window.
- Create Projection Window.
- Add event communication between windows.
- Add custom DLCF Legon loader.
- Add basic projection state.

### Phase 2: SQLite Foundation

- Set up SQLite.
- Add migrations.
- Add app settings.
- Add backup basics.
- Add error handling.

### Phase 3: Hymn Module

- Add hymn CRUD.
- Add hymn search.
- Add hymn projection.
- Add next/previous stanza.

### Phase 4: Scripture Module

- Add Bible import format.
- Add scripture search.
- Add scripture projection.
- Add next/previous verse.

### Phase 5: Announcements

- Add announcement CRUD.
- Add image support.
- Add announcement projection.

### Phase 6: Personality of the Week

- Add profile CRUD.
- Add photo support.
- Add projection design.

### Phase 7: Service Program

- Add service program builder.
- Add ordering.
- Add projection flow.
- Add next/previous service item.

### Phase 8: Hardening

- Add error boundaries.
- Add auto-backups.
- Add projection fallbacks.
- Add keyboard shortcuts.
- Add testing.
- Add installer build.

---

## 22. Testing Requirements

### Unit Tests

Test:

- Scripture reference parser.
- Hymn stanza parser.
- Search functions.
- Projection state transitions.
- Form validation.

### Integration Tests

Test:

- Creating and projecting hymn.
- Creating and projecting announcement.
- Opening projection window.
- Backup and restore.
- Media import.

### Manual Service Simulation

Before release, test a full mock service:

1. Open app.
2. Open projection window.
3. Load service program.
4. Project hymn.
5. Move through hymn stanzas.
6. Project scripture.
7. Project announcement.
8. Project Personality of the Week.
9. Blank screen.
10. Show logo.
11. Close and reopen app.
12. Confirm recovery.

---

## 23. Non-Goals for MVP

Do not include these in MVP:

- AI scripture search.
- Cloud sync.
- Multi-user collaboration.
- Mobile remote control.
- Livestream overlays.
- Sermon note parser.
- Online Bible API dependency.
- Payment/subscription system.
- Role-based access control.
- Complex animation engine.

These can be added later.

---

## 24. Future Version Ideas

After MVP works reliably:

- Cloud backup/sync.
- Mobile remote control.
- Import hymns from Excel/CSV.
- Import announcements from templates.
- Multiple Bible versions.
- Livestream lower thirds.
- Sermon preparation mode.
- AI scripture finder.
- AI announcement slide generator.
- Department-specific announcements.
- Church calendar integration.
- Multi-branch support.

---

## 25. Important Implementation Notes for Coding Agent

Build this as a production-quality offline desktop app.

Prioritize:

- Stability.
- Error handling.
- Clean architecture.
- Type safety.
- Fast search.
- Beautiful projection.
- Simple user experience.

Do not build unnecessary AI or cloud features in the MVP.

The projection window must be isolated enough that if a control action fails, the currently displayed content remains visible.

The operator should never feel like the app is fragile.

The application should feel smooth, calm, and reliable during live church service.

---

## 26. Definition of Done

The MVP is done when:

1. The app installs and runs on Windows.
2. The app works offline.
3. The Control Window and Projection Window work correctly.
4. The operator can project scriptures.
5. The operator can project hymns stanza by stanza.
6. The operator can create and project announcements.
7. The operator can create and project Personality of the Week.
8. The operator can build a simple service program.
9. The projection window can go fullscreen.
10. Keyboard shortcuts work.
11. App has custom animated “DLCF Legon” loader.
12. App has local SQLite persistence.
13. App has backup/export support.
14. App handles missing data/media without crashing.
15. Projection never shows raw errors.
16. App survives a full mock service simulation without crashing.
