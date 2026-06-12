# Manual Testing Checklist — md-quicklook v1.1

## Test Environment

- [ ] macOS / Windows (circle platform)
- [ ] Tauri dev mode: `npm run dev` then `npx tauri dev`
- [ ] Tauri production build: `npm run build && npx tauri build`

---

## 1. Open Normal Markdown File

| # | Test Case | Steps | Expected Result | Pass? |
|---|---|---|---|---|
| 1.1 | CLI open | `npx tauri dev -- test.md` | File loads in reading mode, content rendered correctly | ☐ |
| 1.2 | Welcome page — Choose File | Launch without args, click "Choose File", select a `.md` | File opens in reading mode | ☐ |
| 1.3 | Drag-drop open | Launch without args, drag a `.md` onto the window | File opens in reading mode | ☐ |
| 1.4 | Recent files | Open a file, close, reopen app — click recent entry | File reopens from recent list | ☐ |
| 1.5 | Switch files | Open File A, then open File B via Choose File | File B loads, unsaved changes in A are auto-saved first | ☐ |

---

## 2. Open Empty Markdown File

| # | Test Case | Steps | Expected Result | Pass? |
|---|---|---|---|---|
| 2.1 | Empty file | Open a `.md` file with 0 bytes | App shows empty reader, no crash | ☐ |
| 2.2 | Whitespace-only | Open `.md` with only whitespace/newlines | Renders correctly (empty paragraphs), no crash | ☐ |

---

## 3. Open Large Markdown File

| # | Test Case | Steps | Expected Result | Pass? |
|---|---|---|---|---|
| 3.1 | Large file (>100KB) | Open a large `.md` with many headings/sections | Loads within reasonable time, outline shows all headings | ☐ |
| 3.2 | Many code blocks | Open `.md` with 20+ code blocks in different languages | Code highlighting works, no visual glitches | ☐ |
| 3.3 | Many tables | Open `.md` with 10+ tables | All tables render correctly, Excel export works | ☐ |

---

## 4. Auto-Save Behavior

| # | Test Case | Steps | Expected Result | Pass? |
|---|---|---|---|---|
| 4.1 | Auto-save triggers | Switch to Source mode, type some text, wait ~1s | Status shows "Saving..." → "Saved". Original file updated. | ☐ |
| 4.2 | No change = no save | Open file, switch to Source mode, make no edits | Status stays "Saved", no save triggered | ☐ |
| 4.3 | Debounce works | Type rapidly in Source mode | Only one save fires after typing stops (~800ms) | ☐ |
| 4.4 | Concurrent save prevention | Type continuously while saving | No overlapping saves, no data corruption | ☐ |
| 4.5 | .bak on open | Open a `.md` file that didn't have a `.bak` | A `.md.bak` file is created once | ☐ |
| 4.6 | No .bak on auto-save | Edit file, let auto-save fire multiple times | `.bak` timestamp does NOT update on each auto-save | ☐ |
| 4.7 | .bak on manual save | Click "Save" button | `.bak` file is created/updated | ☐ |

---

## 5. Save Failure Scenarios

| # | Test Case | Steps | Expected Result | Pass? |
|---|---|---|---|---|
| 5.1 | Read-only file | Open a `.md` with read-only permissions, edit, save | Toast error appears, status shows "Save failed" | ☐ |
| 5.2 | File deleted while open | Open a file, delete it from disk, then edit | Toast error on save attempt | ☐ |
| 5.3 | Disk full | (Hard to test manually) | Toast error, file not corrupted (temp file approach) | ☐ |
| 5.4 | Save empty content? | Open `.md`, delete all content in Source mode | Should still save (empty file is valid) | ☐ |

---

## 6. Non-Markdown File Handling

| # | Test Case | Steps | Expected Result | Pass? |
|---|---|---|---|---|
| 6.1 | Open .txt file | Try to open a `.txt` file via Welcome Page | Warning toast: "Only .md and .markdown files are supported" | ☐ |
| 6.2 | Open .json file | Try to open a `.json` file | Warning toast, no crash | ☐ |
| 6.3 | Open with wrong extension | Rename a `.txt` to `.md`, try to open | File opens (extension is `.md`) | ☐ |

---

## 7. Excel Export

| # | Test Case | Steps | Expected Result | Pass? |
|---|---|---|---|---|
| 7.1 | Export with tables | Open `test.md` (has tables), click "Export Excel" | `.xlsx` file created next to the `.md`, success toast | ☐ |
| 7.2 | Export without tables | Open a `.md` with no tables, click "Export Excel" | Error toast: "No tables to export" | ☐ |
| 7.3 | Export read-only dir | Open `.md` in read-only directory, try export | Error toast, no crash | ☐ |

---

## 8. Mode Switching

| # | Test Case | Steps | Expected Result | Pass? |
|---|---|---|---|---|
| 8.1 | Reading → Source → Reading | Toggle modes | Content preserved, no data loss | ☐ |
| 8.2 | Source edits appear in Reading | Edit in Source mode, switch to Reading | Changes visible in reader | ☐ |
| 8.3 | Outline in reading mode | Open file with headings, check outline panel | Headings listed, click scrolls to heading | ☐ |

---

## 9. Welcome Page

| # | Test Case | Steps | Expected Result | Pass? |
|---|---|---|---|---|
| 9.1 | Default state | Launch app without args | Welcome page shows with branding, drop zone, choose button | ☐ |
| 9.2 | Recent files persist | Open a file, close app, reopen | File appears in recent list | ☐ |
| 9.3 | Invalid drop | Drag a `.pdf` onto welcome page | Warning toast about unsupported format | ☐ |

---

## 10. Build & Package

| # | Test Case | Steps | Expected Result | Pass? |
|---|---|---|---|---|
| 10.1 | Frontend build | `npm run build` | No errors, `dist/` populated | ☐ |
| 10.2 | Tauri dev | `npx tauri dev` | App launches, dev tools available | ☐ |
| 10.3 | Tauri build | `npx tauri build` | Produces `.dmg`/`.app` (macOS) or `.msi`/`.exe` (Windows) | ☐ |
| 10.4 | File association in built app | Install built app, double-click `.md` in Finder/Explorer | App opens the file | ☐ |

---

## Notes

- For **5.1** (read-only test): `chmod 444 file.md` on macOS/Linux
- For **10.3**: Build artifacts are in `src-tauri/target/release/bundle/`
- Report any crash, data loss, or silent failure as a **P0 bug**
