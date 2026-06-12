# md-quicklook

A lightweight, desktop-native Markdown file viewer and source editor built with **Tauri 2 + Vue 3 + TypeScript**.

Open any `.md` or `.markdown` file — locally, offline, and fast. Designed to be your system's default Markdown opener.

## Release Status

Current package status: **v1.9.0 beta**.

- macOS Apple Silicon `.app` and beta `.dmg` can be built locally.
- The current macOS beta `.dmg` is **unsigned and not notarized**.
- Windows packaging configuration exists, but the Windows installer has **not been verified on a real Windows machine**.
- md-quicklook is **not listed on the Mac App Store**.
- Treat current packages as small-scope beta test builds, not a final public release.

## Features

- 📖 **Reading Mode** — Word-style typography with Shiki syntax highlighting for code blocks
- ✏️ **Editing Mode** — WYSIWYG Markdown editor (Milkdown/ProseMirror) with formatting toolbar
- ⌨️ **Source Mode** — Full CodeMirror 6 editor with Markdown syntax support
- 📑 **Outline Panel** — Auto-generated table of contents from headings (reading mode)
- 💾 **Smart Auto-Save** — 800ms debounced save to original file, atomic writes (temp-file + rename)
- 🛡️ **Safe Saves** — Temp-file + atomic rename prevents partial writes; `.bak` backup on open and manual save
- 🌐 **Full-App i18n** — Complete Chinese (zh-CN) and English (en-US) translation with vue-i18n covering native menu, toolbar, welcome page, editor, dialogs, error messages, and all UI text
- 📊 **Excel Export** — Extract Markdown tables to `.xlsx` with multi-sheet, number detection, frozen headers, and heading-based sheet names
- 📝 **Word Export** — Convert Markdown to `.docx` with Chinese font optimization (SimSun body, Microsoft YaHei headings)
- 💾 **Flexible Export Paths** — Native save dialog lets you choose where to save Word and Excel exports
- 🚫 **Smart Excel Handling** — Clear prompt when no tables exist, no empty workbooks
- 🎯 **Welcome Page** — Drag-drop to open, file picker, and recent files list
- 🔒 **XSS Protection** — HTML sanitization with allowlist, safe URL validation
- 🖥️ **Cross-Platform** — macOS and Windows support via Tauri 2

## Development

### Prerequisites

- [Node.js](https://nodejs.org/) (18+)
- [Rust](https://www.rust-lang.org/) (1.77.2+)
- Tauri system dependencies: see [Tauri Prerequisites](https://v2.tauri.app/start/prerequisites/)

### Commands

```bash
# Install dependencies
npm install

# Run in development mode (with hot reload)
npx tauri dev

# Open a specific file in dev mode
npx tauri dev -- path/to/file.md

# Build for production
npm run build          # Frontend build
npx tauri build        # Full Tauri bundle (.dmg on macOS, .exe on Windows)

# Build repeatable macOS beta DMG with hdiutil fallback
scripts/build-macos-dmg.sh

# Build for specific target
npx tauri build --target universal-apple-darwin  # macOS Universal Binary
npx tauri build --target x86_64-pc-windows-msvc  # Windows (cross-compile)
```

### Project Structure

```
md-quicklook/
├── src/                   # Vue 3 frontend
│   ├── components/        # UI components
│   │   ├── AppToolbar.vue
│   │   ├── OutlinePanel.vue
│   │   ├── ReaderView.vue
│   │   ├── RichEditor.vue  # WYSIWYG Milkdown editor
│   │   ├── SourceEditor.vue
│   │   ├── ToastNotification.vue
│   │   └── WelcomePage.vue
│   ├── composables/       # Reusable logic
│   │   └── useToast.ts
│   ├── i18n/              # vue-i18n locales + config
│   │   ├── index.ts
│   │   └── locales/
│   │       ├── zh-CN.ts   # Full Chinese translations
│   │       └── en-US.ts   # Full English translations
│   ├── stores/            # Pinia state management
│   │   └── editor.ts
│   ├── styles/            # CSS
│   ├── utils/             # Markdown rendering, exports
│   │   ├── exportDocx.ts  # Word export with Chinese fonts
│   │   └── exportExcel.ts # Excel table extraction
│   ├── App.vue
│   └── main.ts
├── src-tauri/             # Rust/Tauri backend
│   ├── src/
│   │   ├── lib.rs         # Commands + menu event handling
│   │   ├── main.rs        # Entry point
│   │   └── menu.rs        # Native menu i18n (zh-CN / en-US)
│   ├── Cargo.toml
│   ├── capabilities/
│   └── tauri.conf.json
├── docs/
│   ├── MENU_I18N.md          # Menu internationalization guide
│   ├── DOCX_FONT_TESTING.md  # Word export font verification
│   ├── WINDOWS_MENU.md       # Windows menu behavior & testing
│   ├── EXPORT_PATH.md        # Export path selection mechanism
│   ├── EXCEL_EXPORT_TESTING.md # Excel export testing guide
│   ├── APP_I18N.md           # App internationalization architecture
│   ├── I18N_TESTING.md       # i18n testing checklist
│   ├── MAC_DISTRIBUTION.md   # macOS .app/.dmg distribution guide
│   ├── MAC_DMG_SCRIPT.md     # Repeatable hdiutil beta DMG build script
│   ├── APP_STORE_PREP.md     # Mac App Store preparation
│   ├── WINDOWS_DISTRIBUTION.md # Windows NSIS installer guide
│   ├── RELEASE_CHECKLIST.md  # Pre-release verification checklist
│   ├── KNOWN_LIMITATIONS.md  # Known issues and limitations
│   └── TESTING.md            # Manual testing checklist
├── CHANGELOG.md           # Version history
├── test.md                # Sample Markdown for testing
└── package.json
```

## Setting as Default `.md` Opener

### macOS

1. Build the app: `npx tauri build`
2. Install the `.dmg` to `/Applications`
3. Right-click any `.md` file → **Get Info** → **Open with** → select **md-quicklook** → **Change All**
4. Alternatively, in Finder: select a `.md` file → **File** → **Get Info** → set default app

The app's `Info.plist` declares support for `.md` and `.markdown` extensions via `CFBundleDocumentTypes`.

### Windows

1. Build the app: `npx tauri build`
2. Install the `.msi`
3. Right-click any `.md` file → **Open with** → **Choose another app** → select **md-quicklook** → **Always**
4. The installer registers `.md` and `.markdown` file associations via the Windows registry.

### From CLI

```bash
# Open a file directly (works after installation)
md-quicklook path/to/file.md
```

## Current Limitations

- Current 1.9.0 packages are beta builds; macOS packages are unsigned and not notarized
- Windows installer has not yet been verified on a real Windows machine
- App Store distribution is not configured
- **Single file** at a time — no tab support yet
- File association only works when the app is launched (already-running app file-open events are handled on macOS via `RunEvent::Opened`)
- **No dark mode** for the reader view yet
- **Drag-drop** requires the app to be built with Tauri (not in plain browser)

## Tech Stack

| Layer | Technology |
|---|---|
| Desktop shell | Tauri 2 (Rust) |
| UI framework | Vue 3 + TypeScript |
| State management | Pinia |
| Styling | Tailwind CSS 4 |
| Markdown rendering | markdown-it + Shiki |
| WYSIWYG editor | Milkdown (ProseMirror) |
| Code editor | CodeMirror 6 |
| Excel export | SheetJS (xlsx) |
| Word export | docx |

## License

MIT
