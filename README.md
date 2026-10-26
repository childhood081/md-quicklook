# AI 文档快看

AI 文档快看是一个轻量、离线、原生桌面的文档查看与导出工具，专为 AI 生成的 Markdown 文档优化。基于 **Tauri 2 + Vue 3 + TypeScript** 构建。

打开任何 `.md` 或 `.markdown` 文件 — 完全离线，无需账号。设计为 AI 产出的 Markdown 文档首选查看和导出工具。

## Release Status

Current package status:

- Direct-download packages use the internal `1.9.0` version line and remain beta builds.
- Mac App Store version `1.0.0 (23)` has passed review and is waiting for manual developer release.
- macOS Apple Silicon `.app` and beta `.dmg` build successfully from `main`.
- The current macOS beta `.dmg` is **unsigned and not notarized**.
- Windows installer artifacts build in GitHub Actions, but installation still needs final verification on a real Windows machine.
- The App Store version is not public until the developer clicks **Release This Version** in App Store Connect.

## Features

- 📖 **Reading Mode** — Word-style typography with Shiki syntax highlighting for code blocks
- ✏️ **Editing Mode** — WYSIWYG Markdown editor (Milkdown/ProseMirror) with formatting toolbar
- ⌨️ **Source Mode** — Full CodeMirror 6 editor with Markdown syntax support
- 📑 **Outline Panel** — Auto-generated table of contents from headings (reading mode)
- 💾 **Smart Auto-Save** — 800ms debounced save to original file, atomic writes (temp-file + rename)
- 🛡️ **Safe Saves** — Temporary replacement writes; opening and saving no longer create `.md.bak` files
- **Document Tabs** — Open several documents in one window; each tab keeps its own content, mode, zoom, and save status. Closing the last tab returns to recent files.
- 🌐 **Full-App i18n** — Complete Chinese (zh-CN) and English (en-US) translation with vue-i18n covering native menu, toolbar, welcome page, editor, dialogs, error messages, and all UI text
- 📊 **Excel Export** — Convert table-only Markdown files to `.xlsx` with number detection, frozen headers, and safe sheet names
- 📝 **Word Export** — Convert Markdown to `.docx` with reading-mode-inspired styling and Chinese font optimization
- 📄 **PDF Export** — Print the reading-mode HTML/CSS through the system print dialog for the closest visual match
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
npm test               # Document workspace regression tests (Node.js 22.6+)
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
│   │   ├── exportDocx.ts  # Word export with shared export theme
│   │   ├── exportExcel.ts # Table-only Markdown Excel export
│   │   ├── exportPdf.ts   # PDF export via system print
│   │   └── documentExportTheme.ts # Shared export style tokens
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
│   ├── RELEASE_CHECKLIST.md          # Pre-release verification checklist
│   ├── KNOWN_LIMITATIONS.md          # Known issues and limitations
│   ├── WINDOWS_DISTRIBUTION.md       # Windows NSIS installer guide
│   ├── MAC_DISTRIBUTION.md           # macOS .app/.dmg distribution guide
│   ├── APP_STORE_PREP.md             # Mac App Store preparation
│   ├── EXPORT_VISUAL_CONSISTENCY.md  # Word / Excel / PDF export behavior
│   ├── PDF_EXPORT.md                 # PDF system print export details
│   ├── PDF_EXPORT_TESTING.md         # PDF manual test checklist
│   ├── EXCEL_EXPORT_TESTING.md       # Excel table-only export testing
│   ├── FRONT_MATTER_TESTING.md       # Front Matter behavior and tests
│   └── WINDOWS_MENU_TESTING.md       # Windows/macOS native menu testing
├── CHANGELOG.md           # Version history
└── package.json
```

## Setting as Default `.md` Opener

### macOS

1. Build the app: `npx tauri build`
2. Install the `.dmg` to `/Applications`
3. Right-click any `.md` file → **Get Info** → **Open with** → select **AI 文档快看** → **Change All**
4. Alternatively, in Finder: select a `.md` file → **File** → **Get Info** → set default app

The app's `Info.plist` declares support for `.md` and `.markdown` extensions via `CFBundleDocumentTypes`.

### Windows

1. Build the app: `npx tauri build`
2. Install the NSIS installer
3. Right-click any `.md` file → **Open with** → **Choose another app** → select **AI 文档快看** → **Always**
4. The installer registers `.md` and `.markdown` file associations via the Windows registry.

### From CLI

```bash
# Open a file directly (works after installation)
md-quicklook path/to/file.md
```

## Current Limitations

- Direct-download 1.9.0 packages are beta builds; their macOS packages are unsigned and not notarized
- The Windows installer has not yet completed final installation and uninstall verification on a real Windows machine
- Mac App Store `1.0.0 (23)` is approved and waiting for manual developer release
- Tabs keep document text in memory but only mount one active editor. Editor undo history and scroll/cursor positions are reset when switching tabs or modes; content is retained.
- Windows file association opens files through startup CLI args and forwards later Explorer launches to the existing app window through the Tauri 2 single-instance plugin.
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
