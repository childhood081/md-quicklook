# File Association — Setting md-quicklook as Default `.md` Opener

md-quicklook registers itself as an editor for `.md` and `.markdown` files during installation.
This document explains how to set it as the default opener on each platform and how to test the
file association plumbing.

---

## How File Association Works

### macOS

**Bundle registration** (automatic on install):

The app's `Info.plist` declares `CFBundleDocumentTypes` with:
- Extensions: `md`, `markdown`
- Role: `Editor`
- MIME type: (inferred from extension)

This is configured in `src-tauri/tauri.conf.json` under `bundle.fileAssociations`.

**Two launch scenarios:**

| Scenario | Mechanism | Code Location |
|---|---|---|
| App not running → double-click `.md` | File path passed as CLI arg | `lib.rs` → `find_markdown_file_in_args()` |
| App already running → double-click another `.md` | Platform-dependent behavior; should use a Tauri 2 compatible AppHandle event/plugin path if expanded | No runtime file-open handler currently installed |

**Setting as default opener manually:**

1. Build and install the app from `.dmg`
2. Right-click any `.md` file → **Get Info** (⌘I)
3. Under **Open with:**, select **md-quicklook** from the dropdown
4. Click **Change All...** to make it the default for all `.md` files
5. Confirm the dialog

**CLI alternative:**

```bash
# Associate .md files with md-quicklook (requires app to be in /Applications)
duti -s com.mdquicklook.desktop md all
```

### Windows

**Registry registration** (automatic on install):

The NSIS/WiX installer writes registry entries under:
- `HKCU\Software\Classes\.md\OpenWithProgids` → `md-quicklook`
- `HKCU\Software\Classes\md-quicklook\shell\open\command` → `"C:\...\md-quicklook.exe" "%1"`

This is triggered by `bundle.fileAssociations` in `tauri.conf.json`.

**Two launch scenarios:**

| Scenario | Mechanism | Code Location |
|---|---|---|
| App not running → double-click `.md` | File path passed as CLI arg (`%1`) | `lib.rs` → `find_markdown_file_in_args()` |
| App already running → double-click another `.md` | New process launched (second instance) with file path as CLI arg | `lib.rs` → `find_markdown_file_in_args()` |

> **Note:** On Windows, each file open launches a new application instance. The second instance
> opens the file in a new window. Single-instance forwarding (where the second instance sends
> the file path to the first) requires `tauri-plugin-single-instance`, which is not yet
> included in this version.

**Setting as default opener manually:**

1. Build and install from `.msi`
2. Right-click any `.md` file → **Open with** → **Choose another app**
3. Select **md-quicklook** from the list (check "Always use this app to open .md files")
4. Click **OK**

**Verifying registry entries (PowerShell):**

```powershell
Get-ItemProperty "HKCU:\Software\Classes\.md\OpenWithProgids"
Get-ItemProperty "HKCU:\Software\Classes\md-quicklook\shell\open\command"
```

---

## Configuration Reference

The file association is declared in `src-tauri/tauri.conf.json`:

```json
{
  "bundle": {
    "fileAssociations": [
      {
        "ext": ["md", "markdown"],
        "name": "Markdown",
        "description": "Markdown document",
        "role": "Editor"
      }
    ]
  }
}
```

| Field | macOS | Windows | Description |
|---|---|---|---|
| `ext` | `CFBundleDocumentTypes.CFBundleTypeExtensions` | Registry `.ext` keys | File extensions (without leading dot) |
| `name` | `CFBundleTypeName` | — | Display name for the file type |
| `description` | — | Explorer "Type" column | Human-readable description |
| `role` | `CFBundleTypeRole` | — | `Editor` = read/write, `Viewer` = read-only |

---

## How to Test File Association

### Prerequisites

1. Build a release bundle: `npm run build && npx tauri build`
2. Install the resulting package (`.dmg` on macOS, `.msi` on Windows)

### Test Cases

| # | Scenario | Steps | Expected | macOS | Windows |
|---|---|---|---|---|---|
| 1 | App not running, double-click `.md` | Double-click a `.md` file in Finder/Explorer | App launches, file opens in reading mode | ✓ | ✓ |
| 2 | Drag `.md` onto app icon (Dock/Taskbar) | Drag a `.md` file onto the app icon | App launches, file opens | ✓ | ✓ |
| 3 | App running, double-click another `.md` | With app open, double-click a different `.md` | File opens (new window on Windows) | ✓ | ✓ (new instance) |
| 4 | CLI: open with path | `md-quicklook /path/to/file.md` | File opens | ✓ | ✓ |
| 5 | Open `.markdown` file | Double-click a `.markdown` file | App opens the file | ✓ | ✓ |
| 6 | Open non-`.md` file | Set a `.txt` to open with md-quicklook | Warning toast shown | ✓ | ✓ |
| 7 | Open `.md` with spaces in path | Double-click `My Notes.md` | File opens correctly (path escaped) | ✓ | ✓ |

### Dev Mode Testing

In development mode, file associations are NOT registered. Test via CLI:

```bash
npx tauri dev -- /path/to/file.md
```

Or launch without args and use the Welcome Page's "Choose File" button.

---

## Current Limitations

1. **Windows multi-instance**: Opening a second `.md` file while the app is running launches a
   second process on Windows, rather than opening in the existing window. This requires the
   `single-instance` plugin for proper forwarding.

2. **No deep-link / custom protocol**: Only file extension associations are registered. There
   is no `md-quicklook://` URL scheme.

3. **No auto-recovery of unsaved files**: If the app crashes, unsaved changes are in the
   `.tmp-*` temp file (in the same directory as the original). They are NOT automatically
   recovered on restart.

4. **File extension check is strict**: The app validates that opened files have `.md` or
   `.markdown` extensions. Files without these extensions (even if they contain Markdown)
   will be rejected with a warning toast.

---

## Troubleshooting

### macOS

**"App is damaged and can't be opened"** after install:
```bash
xattr -cr /Applications/md-quicklook.app
```

**File association not working after install:**
```bash
# Force rebuild Launch Services database
/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister -kill -r -domain local -domain system -domain user
```

**Check Info.plist for correct file associations:**
```bash
plutil -p /Applications/md-quicklook.app/Contents/Info.plist | grep -A 10 CFBundleDocumentTypes
```

### Windows

**File association not applying:**
- Re-run the `.msi` installer (repair mode)
- Or manually set via **Open with** → **Choose another app**

**Registry entries missing:**
```powershell
# Check if the installer registered the app
Get-ChildItem "HKCU:\Software\Classes" | Where-Object { $_.PSChildName -like "*md-quicklook*" }
```

**Uninstall and reinstall:**
- **Settings** → **Apps** → **md-quicklook** → **Uninstall**
- Then re-run the `.msi` installer
