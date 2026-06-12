# Menu Internationalization (i18n)

## Overview

md-quicklook provides a native application menu bar with full Chinese (zh-CN) and English (en-US) support. The menu is built using Tauri 2's native menu API and persists the language choice across application restarts.

## Default Language

The default language is **Simplified Chinese (zh-CN)**. On first launch, the menu bar displays Chinese labels.

## Switching Languages

There are two ways to switch the menu language:

1. **Menu bar**: Navigate to `语言` / `Language` submenu and select either `简体中文` or `English`.
2. **Programmatically**: Call the `switch_language` Tauri command from the frontend.

The menu bar rebuilds immediately when the language is switched, updating all submenu labels, accelerators, and check marks.

## Persistence

The selected language is saved to the app's config directory as `settings.json`:

- **macOS**: `~/Library/Application Support/md-quicklook/settings.json`
- **Windows**: `C:\Users\<user>\AppData\Roaming\md-quicklook\settings.json`
- **Linux**: `~/.config/md-quicklook/settings.json`

On next launch, the saved language is loaded and the menu is built accordingly.

## Menu Structure

### Chinese (zh-CN)

| Submenu | Items |
|---------|-------|
| md-quicklook | 关于 md-quicklook, 服务, 隐藏 md-quicklook, 隐藏其他, 显示全部, 退出 md-quicklook |
| 文件 | 打开文件... (Cmd+O), 保存 (Cmd+S), 另存为... (Cmd+Shift+S), 导出 Word..., 导出 Excel..., 关闭窗口 |
| 编辑 | 撤销, 重做, 剪切, 复制, 粘贴, 全选, 查找... (Cmd+F) |
| 视图 | 阅读模式 (Cmd+1), 编辑模式 (Cmd+2), 源码模式 (Cmd+3), 显示/隐藏目录 (Cmd+B), 放大, 缩小, 实际大小, 全屏 |
| 语言 | 简体中文 ✓, English |
| 帮助 | 使用说明, 测试清单, 关于 |

### English (en-US)

| Submenu | Items |
|---------|-------|
| md-quicklook | About md-quicklook, Services, Hide md-quicklook, Hide Others, Show All, Quit md-quicklook |
| File | Open File... (Cmd+O), Save (Cmd+S), Save As... (Cmd+Shift+S), Export Word..., Export Excel..., Close Window |
| Edit | Undo, Redo, Cut, Copy, Paste, Select All, Find... (Cmd+F) |
| View | Reading Mode (Cmd+1), Editing Mode (Cmd+2), Source Mode (Cmd+3), Show/Hide Outline (Cmd+B), Zoom In, Zoom Out, Actual Size, Full Screen |
| Language | 简体中文, English ✓ |
| Help | User Guide, Testing Checklist, About |

## macOS Notes

- On macOS, the first submenu (`md-quicklook`) becomes the application menu. Tauri 2 automatically handles this.
- The About dialog metadata (name, version, authors, website) is set via `AboutMetadataBuilder`.
- `PredefinedMenuItem::services` is macOS-only and will be hidden on other platforms.

## Windows Differences

- The Services menu item is macOS-only and will not appear on Windows.
- The app submenu items (Hide, Hide Others, Show All) are macOS-only and may not appear on Windows.

## Architecture

The menu system is implemented in `src-tauri/src/menu.rs`:

- **`Language` enum**: `ZhCN` / `EnUS` with serde serialization for persistence
- **`AppConfig` struct**: Holds the current language setting
- **`build_menu()` / `build_menu_zh()` / `build_menu_en()`**: Renders the menu bar for each language
- **`load_config()` / `save_config()`**: Persists settings to `settings.json`
- **Menu item IDs**: All action items have constant string IDs (e.g., `file.open`, `view.reading`)

Menu events are dispatched in `src-tauri/src/lib.rs` via `app.on_menu_event()`, which emits `menu-action` events to the frontend. The frontend (`src/App.vue`) listens for these events and calls the appropriate store actions.

## Limitations

- Only Simplified Chinese and English are supported. Traditional Chinese and other languages are not included.
- The menu language is independent of the system locale; it does not auto-detect the user's OS language.
- The CheckMenuItem checked state is determined at menu build time; dynamically updating a single check item requires rebuilding the entire menu bar.
