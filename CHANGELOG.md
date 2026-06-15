# Changelog

## [1.9.0-beta] — 2026-06-12

### Distribution & Release
- Bumped version to 1.9.0 across all configuration files
- Updated copyright year to 2026
- Enhanced macOS bundle configuration (minimumSystemVersion 11.0)
- Enhanced Windows NSIS configuration (languages, shortcuts, file associations)
- Added repeatable macOS beta DMG script using hdiutil fallback for current macOS 16 create-dmg compatibility issues
- Added consolidated distribution documentation for macOS, Windows, and App Store preparation
- Added release checklist and known limitations documentation

### Beta Release Notes
- Current macOS DMG is unsigned and not notarized
- Windows installer configuration exists but has not been verified on a real Windows machine
- App Store distribution is not configured
- This entry represents a beta package candidate, not a final public release

## [1.8.1] — 2026-06-12

### Full-App i18n
- Added vue-i18n with full Chinese (zh-CN) and English (en-US) translation
- Created comprehensive locale files (~70 keys each) covering all UI areas
- Translated native menu, toolbar, welcome page, outline panel, rich editor toolbar
- Translated source editor placeholder, store error messages, dialog titles
- Implemented language sync between native menu and frontend via events
- Language persistence across app restarts via Rust backend settings.json
- Source editor placeholder dynamically updates on language change (CodeMirror Compartment)
- Added app-wide i18n architecture documentation and testing checklist

## [1.8.0] — 2026-06-11

### Windows Menu & Cross-Platform Polish
- Added `#[cfg(target_os = "macos")]` guards for macOS-only menu items
- Windows native menu now renders without macOS-specific items (Services, Hide, etc.)
- Added Windows menu documentation

### Export Path Selection
- Refactored Word and Excel export to use native save dialog (`@tauri-apps/plugin-dialog`)
- Users can now choose where to save exported files
- Export functions return bytes, callers handle dialog + invoke
- Added export path documentation

### Excel Export Improvements
- Heading-based sheet names (extracted from Markdown headings preceding tables)
- Number column detection with automatic numeric cell conversion
- Frozen header rows in exported sheets
- Smart no-table handling with clear user prompt
- Sheet name sanitization (31-char limit, illegal character removal, deduplication)
- Added Excel export testing coverage

## [1.7.0] — 2026-06-10

### Native Menu i18n
- Full Chinese (zh-CN) and English (en-US) native menu bar
- Language persistence via Rust settings.json
- Cross-platform menu rendering with `muda` crate
- About dialog with version info

### Word Export Chinese Font Optimization
- SimSun body text, Microsoft YaHei headings, Consolas code blocks
- Proper font configuration via `IFontAttributesProperties`
- Added Word export font testing coverage

### Frontend Features
- Menu-action event listener in App.vue
- Outline panel toggle via menu and keyboard
- Zoom controls (Cmd+= / Cmd+- / Cmd+0)

## [1.6.0] — 2026-06-09

### WYSIWYG Editor
- Milkdown v7.21.2 WYSIWYG Markdown editor
- Full formatting toolbar (bold, italic, headings, lists, code, links, tables)
- Content sync between store and editor
- Typewriter-style editorial paper design

## [1.5.0] — 2026-06-08

### Source Editor
- CodeMirror 6 with Markdown syntax highlighting
- One Dark theme
- Content sync with store

## [1.4.0] — 2026-06-07

### Core Features
- Reading mode with Shiki syntax highlighting for code blocks
- Word export (.docx)
- Excel export (.xlsx)
- Auto-save with 800ms debounce
- Atomic writes (temp-file + rename)
- .bak backup creation
- Welcome page with drag-drop, file picker, recent files
- XSS protection (HTML sanitization)

## [1.0.0] — 2026-06-01

### Initial Release
- Tauri 2 + Vue 3 + TypeScript scaffold
- Basic Markdown file viewer
- Reading mode with markdown-it rendering
