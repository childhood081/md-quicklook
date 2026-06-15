# Export Path Selection

## Overview

When exporting to Word (.docx) or Excel (.xlsx), md-quicklook prompts the user with a **native save file dialog** to choose the output path and filename. The user can save to any location, not just the same directory as the original Markdown file.

## How It Works

1. The export function validates whether the current document can be exported.
   - Word: any opened Markdown document can be exported.
   - Excel: only table-only Markdown documents are accepted.
2. A native save dialog opens with:
   - A suggested filename based on the current Markdown file name
   - A file type filter matching the export format
3. The user chooses a save location and filename
4. The file bytes are generated after the path is selected.
5. The bytes are written atomically to the chosen path (temp file → rename)
6. A success toast shows the exported filename

### User Cancellation

If the user clicks **Cancel** in the save dialog:
- No file is written
- No error toast is shown (the operation silently returns)
- The editor state is not affected

## Default Filename Rules

| Scenario | Default Name |
|----------|-------------|
| File `report.md` open, export to Word | `report.docx` |
| File `readme.markdown` open, export to Excel | `readme.xlsx` |
| No file open (should not happen) | `untitled.docx` / `untitled.xlsx` |

The default filename is derived from the current Markdown file's name, with the extension replaced.

## File Type Filters

### Word Export
- Filter: `Word Document (*.docx)`
- Default extension: `.docx`

### Excel Export
- Filter: `Excel Workbook (*.xlsx)`
- Default extension: `.xlsx`

## Implementation

The save dialog is implemented using `@tauri-apps/plugin-dialog` which is already a project dependency.

### Store (src/stores/editor.ts)

```typescript
const savePath = await save({
  title: 'Export Word',
  defaultPath: defaultExportName('docx'),
  filters: [{ name: 'Word Document', extensions: ['docx'] }],
})
if (!savePath) throw new Error('Export cancelled')
const bytes = await generateDocxBytes(currentContent.value)
await invoke('export_docx', { outputPath: savePath, bytes: Array.from(bytes) })
```

### Rust Backend (src-tauri/src/lib.rs)

```rust
#[tauri::command]
fn export_docx(output_path: String, bytes: Vec<u8>) -> Result<String, String> {
    let output_path = PathBuf::from(output_path);
    ensure_docx_path(&output_path)?;
    write_bytes_atomically(&output_path, &bytes)?;
    Ok(output_path.to_string_lossy().to_string())
}
```

The `ensure_docx_path` and `ensure_xlsx_path` functions validate that the output path has the correct extension.

### Tauri Capability

Export path selection requires both open and save dialog permissions:

```json
{
  "permissions": [
    "core:default",
    "dialog:allow-open",
    "dialog:allow-save"
  ]
}
```

Without `dialog:allow-save`, Word / Excel export can build successfully but fail at runtime when opening the native save dialog.

## i18n Behavior

- Save dialog titles and filters use the current Vue i18n locale.
- Success toast uses `export.exportedTo`.
- User cancellation throws the localized `export.exportCancelled` sentinel internally; components suppress this as a non-error.
- Native dialog buttons are controlled by the operating system and may not match the app language.

## Supported Save Locations

- Any writable directory on the local filesystem
- External drives
- Network locations (if mounted)

Unsupported: saving directly to cloud-synced folders that may not behave like regular filesystems (the atomic write uses `rename()` which may fail on some virtual filesystems).
