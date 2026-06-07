# Windows installer artwork

These bitmaps brand the Tauri NSIS installer while retaining Tauri's upgrade,
uninstall, WebView2, and shortcut behavior.

- `sidebar.bmp`: 164 x 314 pixels, shown on Welcome and Finish pages.
- `header.bmp`: 150 x 57 pixels, shown on installer and uninstaller pages.

NSIS expects uncompressed 24-bit bitmap files at these dimensions. Keep the
source artwork within the safe area because Windows display scaling may soften
small text.
