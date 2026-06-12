# Windows Menu Implementation

## Overview

md-quicklook uses **Tauri 2's native menu API** (via the `muda` crate) which provides cross-platform menu rendering:

| Platform | Menu Location | Backend |
|----------|-------------|---------|
| macOS | System menu bar (top of screen) | `NSMenu` (Cocoa) |
| Windows | In-window menu bar | `HMENU` (Win32) |
| Linux | Depends on compositor | GTK / Mutter |

The same Rust menu code in `src-tauri/src/menu.rs` works on all platforms without modification.

## Windows Behavior

On Windows, the menu bar appears **inside the application window**, below the title bar. This is standard Windows behavior and differs from macOS where menus appear at the top of the screen.

### macOS-Only Items

Some `PredefinedMenuItem` variants are macOS-specific and will **not render** on Windows:

- `PredefinedMenuItem::services` (Services menu)
- `PredefinedMenuItem::hide` (Hide app)
- `PredefinedMenuItem::hide_others` (Hide Others)
- `PredefinedMenuItem::show_all` (Show All)

The Rust code uses `#[cfg(target_os = "macos")]` guards to ensure these items are only included in macOS builds, avoiding empty separator gaps on Windows.

### App Submenu

On macOS, the first submenu (`md-quicklook`) becomes the system application menu. On Windows, it appears as the first regular submenu in the in-window menu bar.

## Differences from macOS Menu

| Feature | macOS | Windows |
|---------|-------|---------|
| Menu location | Top of screen (system bar) | Inside window |
| App submenu | Merged into system app menu | Regular in-window submenu |
| Services item | Yes | N/A (not rendered) |
| Hide/Show All items | Yes | N/A (not rendered) |
| Keyboard shortcuts | `Cmd` key | `Ctrl` key |
| Accelerator display | `CmdOrCtrl` resolves to `Cmd` | `CmdOrCtrl` resolves to `Ctrl` |

## Testing on Windows

1. Build the app: `npx tauri build`
2. Install the `.msi` package
3. Launch md-quicklook
4. Verify the menu bar appears inside the window with: File, Edit, View, Language, Help
5. Verify keyboard shortcuts work (Ctrl+O, Ctrl+S, etc.)
6. Verify language switch (Language → English/简体中文)
7. Verify menu actions (Open File, Save, Export Word, Export Excel) work correctly

## Action Parity Checklist

Windows and macOS use the same menu item IDs and the same `menu-action` event bridge:

| Action | Menu ID | Expected frontend behavior |
| --- | --- | --- |
| Open File | `file.open` | Open Markdown dialog, then `store.loadFile()` |
| Save | `file.save` | `store.manualSave()` |
| Save As | `file.save_as` | Native save dialog, then `save_file` |
| Export Word | `file.export_word` | `store.exportToWord()` |
| Export Excel | `file.export_excel` | `store.exportTablesToExcel()` |
| Reading Mode | `view.reading` | `store.setMode('reading')` |
| Editing Mode | `view.editing` | `store.setMode('editing')` |
| Source Mode | `view.source` | `store.setMode('source')` |

The Windows menu should follow the same persisted language state as macOS. Switching language rebuilds the native menu and emits `language-changed` to the Vue frontend.

## Known Limitations

- The menu bar cannot be hidden on Windows (it's always visible when a file is open)
- Menu item icons are not supported (text-only on all platforms)
- Submenu nesting beyond one level is not used and may look different on Windows
- The app submenu includes the "Quit" entry which on Windows closes the entire application (standard behavior)
- Menu font size and styling are controlled by the OS, not the application
