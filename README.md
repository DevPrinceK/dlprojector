# DL Projector

DLCF Legon Projection Software is an offline-first desktop projection app for church services. It is built with Tauri, React, TypeScript, Tailwind CSS, Zustand, Rust, and SQLite.

## Quick Start

```powershell
npm install
npm run dev
```

For the full desktop application, install Rust and then run:

```powershell
npm run tauri dev
```

Tauri packaging requires `rustup`, `rustc`, and `cargo`. You can confirm the local native environment with:

```powershell
npm run tauri -- info
```

## Scripts

- `npm run dev` starts the Vite web shell for frontend development.
- `npm run build` type-checks and builds the frontend bundle.
- `npm run test` runs unit tests.
- `npm run tauri dev` starts the Tauri desktop app.
- `npm run tauri build` creates the Windows installer when the Tauri prerequisites are installed.

## Notes

- The app stores runtime data in the operating system app data directory.
- Projection is designed as a separate Tauri window and can be controlled from the operator window.
- When run in a normal browser, the frontend uses safe local fallback data so UI development remains possible without Tauri.
- The SQLite schema includes default seed content for smoke testing and is ready for a full Bible import dataset.
