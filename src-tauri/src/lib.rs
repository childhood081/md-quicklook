use std::fs::{self, OpenOptions};
use std::io::Write;
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use tauri::{Emitter, Manager};

mod menu;

struct AppState {
    pending_files: Mutex<PendingFiles>,
    config: Mutex<menu::AppConfig>,
}

struct PendingFiles {
    paths: Vec<String>,
    ready: bool,
}

static FILE_WRITE_LOCK: Mutex<()> = Mutex::new(());

fn ensure_markdown_path(path: &Path) -> Result<(), String> {
    let extension = path
        .extension()
        .and_then(|ext| ext.to_str())
        .ok_or_else(|| "Only Markdown files can be opened or saved".to_string())?;

    if extension.eq_ignore_ascii_case("md") || extension.eq_ignore_ascii_case("markdown") {
        Ok(())
    } else {
        Err("Only Markdown files can be opened or saved".to_string())
    }
}

fn temporary_path(path: &Path) -> Result<PathBuf, String> {
    let file_name = path
        .file_name()
        .ok_or_else(|| "Invalid file path".to_string())?;
    let mut temp_name = file_name.to_os_string();
    temp_name.push(format!(".tmp-{}", std::process::id()));

    let mut temp = path.to_path_buf();
    temp.set_file_name(temp_name);
    Ok(temp)
}

#[cfg(windows)]
fn rollback_path(path: &Path) -> Result<PathBuf, String> {
    let file_name = path
        .file_name()
        .ok_or_else(|| "Invalid file path".to_string())?;
    let mut rollback_name = file_name.to_os_string();
    rollback_name.push(format!(".rollback-{}", std::process::id()));

    let mut rollback = path.to_path_buf();
    rollback.set_file_name(rollback_name);
    Ok(rollback)
}

fn ensure_xlsx_path(path: &Path) -> Result<(), String> {
    let extension = path
        .extension()
        .and_then(|ext| ext.to_str())
        .ok_or_else(|| "Export path must use .xlsx".to_string())?;

    if extension.eq_ignore_ascii_case("xlsx") {
        Ok(())
    } else {
        Err("Export path must use .xlsx".to_string())
    }
}

fn ensure_docx_path(path: &Path) -> Result<(), String> {
    let extension = path
        .extension()
        .and_then(|ext| ext.to_str())
        .ok_or_else(|| "Export path must use .docx".to_string())?;

    if extension.eq_ignore_ascii_case("docx") {
        Ok(())
    } else {
        Err("Export path must use .docx".to_string())
    }
}

/// Atomically write bytes to a file using temp-file + rename.
/// Temporary replacement files are removed on success; no persistent backup is made.
fn write_content_atomically(path: &Path, content: &str) -> Result<(), String> {
    write_bytes_atomically(path, content.as_bytes())
}

fn write_bytes_atomically(path: &Path, bytes: &[u8]) -> Result<(), String> {
    let _guard = FILE_WRITE_LOCK.lock().map_err(|e| e.to_string())?;
    let parent = path
        .parent()
        .filter(|parent| parent.exists())
        .ok_or_else(|| "Parent directory does not exist".to_string())?;

    if path.exists() && !path.is_file() {
        return Err("Path is not a regular file".to_string());
    }

    let temp = temporary_path(path)?;
    if temp.exists() {
        fs::remove_file(&temp).map_err(|e| format!("Failed to remove stale temp file: {}", e))?;
    }

    let mut file = OpenOptions::new()
        .write(true)
        .create_new(true)
        .open(&temp)
        .map_err(|e| format!("Failed to create temp file: {}", e))?;
    file.write_all(bytes)
        .map_err(|e| format!("Failed to write temp file: {}", e))?;
    file.sync_all()
        .map_err(|e| format!("Failed to flush temp file: {}", e))?;
    drop(file);

    #[cfg(windows)]
    {
        let rollback = if path.exists() {
            let rollback = rollback_path(path)?;
            if rollback.exists() {
                fs::remove_file(&rollback)
                    .map_err(|e| format!("Failed to remove stale rollback file: {}", e))?;
            }
            fs::copy(path, &rollback)
                .map_err(|e| format!("Failed to prepare rollback file: {}", e))?;
            Some(rollback)
        } else {
            None
        };

        if path.exists() {
            fs::remove_file(path).map_err(|e| format!("Failed to replace file: {}", e))?;
        }

        if let Err(e) = fs::rename(&temp, path) {
            if let Some(rollback) = rollback.as_ref() {
                let _ = fs::copy(rollback, path);
            }
            return Err(format!("Failed to replace file: {}", e));
        }

        if let Some(rollback) = rollback {
            let _ = fs::remove_file(rollback);
        }
    }

    #[cfg(not(windows))]
    {
        fs::rename(&temp, path).map_err(|e| format!("Failed to replace file: {}", e))?;
    }

    // Ensure the parent directory metadata is flushed (best-effort)
    let _ = fs::File::open(parent).and_then(|dir| dir.sync_all());
    Ok(())
}

fn canonical_display_path(path: &str) -> String {
    fs::canonicalize(path)
        .unwrap_or_else(|_| PathBuf::from(path))
        .to_string_lossy()
        .to_string()
}

/// Scan process arguments (skipping the executable) for a Markdown file path.
/// Native paths are handled before URLs because `C:\\...` is otherwise parsed
/// as a URL with the scheme `c` on Windows.
fn find_markdown_files<I, S>(args: I, cwd: Option<&Path>) -> Vec<String>
where
    I: IntoIterator<Item = S>,
    S: AsRef<str>,
{
    let mut paths = Vec::new();
    for arg in args.into_iter().skip(1) {
        let arg = arg.as_ref();
        if arg.starts_with('-') {
            continue;
        }

        let path = if arg
            .get(..7)
            .is_some_and(|prefix| prefix.eq_ignore_ascii_case("file://"))
        {
            match tauri::Url::parse(arg)
                .ok()
                .and_then(|url| url.to_file_path().ok())
            {
                Some(path) => path,
                None => continue,
            }
        } else if arg.contains("://") {
            continue;
        } else {
            let path = PathBuf::from(arg);
            if path.is_relative() {
                cwd.map_or(path.clone(), |base| base.join(path))
            } else {
                path
            }
        };

        if let Some(ext) = path.extension().and_then(|e| e.to_str()) {
            if ext.eq_ignore_ascii_case("md") || ext.eq_ignore_ascii_case("markdown") {
                let path = canonical_display_path(&path.to_string_lossy());
                if !paths.contains(&path) {
                    paths.push(path);
                }
            }
        }
    }
    paths
}

#[cfg(test)]
fn find_markdown_file<I, S>(args: I, cwd: Option<&Path>) -> Option<String>
where
    I: IntoIterator<Item = S>,
    S: AsRef<str>,
{
    find_markdown_files(args, cwd).into_iter().next()
}

fn emit_open_files(app: &tauri::AppHandle, paths: Vec<String>) {
    let state = app.state::<AppState>();
    let Ok(mut pending) = state.pending_files.lock() else {
        return;
    };
    if !pending.ready {
        for path in paths {
            if !pending.paths.contains(&path) {
                pending.paths.push(path);
            }
        }
        return;
    }
    drop(pending);
    for path in paths {
        let _ = app.emit("open-file", path);
    }
}

#[cfg(test)]
mod argument_tests {
    use super::*;

    #[test]
    fn accepts_windows_drive_paths_with_spaces_and_unicode() {
        let path = r"C:\Users\张三\Documents\示例 文档.md";
        let result = find_markdown_file(["md-quicklook.exe", path], None);

        assert_eq!(result.as_deref(), Some(path));
    }

    #[test]
    fn accepts_file_urls() {
        #[cfg(windows)]
        let url =
            "file:///C:/Users/example/Documents/%E7%A4%BA%E4%BE%8B%20%E6%96%87%E6%A1%A3.markdown";
        #[cfg(not(windows))]
        let url =
            "file:///Users/example/Documents/%E7%A4%BA%E4%BE%8B%20%E6%96%87%E6%A1%A3.markdown";
        let result = find_markdown_file(["md-quicklook", url], None);

        assert_eq!(
            result
                .as_deref()
                .and_then(|path| Path::new(path).file_name())
                .and_then(|name| name.to_str()),
            Some("示例 文档.markdown")
        );
    }

    #[test]
    fn resolves_relative_paths_from_the_launching_process_directory() {
        let cwd = Path::new("/example/launch-directory");
        let result = find_markdown_file(["md-quicklook", "notes/readme.md"], Some(cwd));

        assert_eq!(
            result,
            Some(cwd.join("notes/readme.md").to_string_lossy().to_string())
        );
    }

    #[test]
    fn ignores_flags_urls_and_non_markdown_files() {
        let result = find_markdown_file(
            [
                "md-quicklook",
                "--verbose",
                "https://example.com/readme.md",
                "notes.txt",
            ],
            None,
        );

        assert!(result.is_none());
    }

    #[test]
    fn accepts_multiple_documents_in_one_launch_and_ignores_duplicates() {
        let result = find_markdown_files(
            [
                "md-quicklook.exe",
                "--flag",
                "first.md",
                "中文 文档.markdown",
                "first.md",
                "notes.txt",
            ],
            Some(Path::new("/launch")),
        );
        assert_eq!(result.len(), 2);
        assert!(result[0].ends_with("first.md"));
        assert!(result[1].ends_with("中文 文档.markdown"));
    }

    #[test]
    fn saving_and_exporting_do_not_create_persistent_backup_or_word_owner_files() {
        let unique = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        let dir =
            std::env::temp_dir().join(format!("quicklook-save-{}-{}", std::process::id(), unique));
        fs::create_dir(&dir).unwrap();
        let md = dir.join("中文.md");
        let word = dir.join("中文.docx");
        save_file(md.to_string_lossy().to_string(), "first".into()).unwrap();
        save_file(md.to_string_lossy().to_string(), "latest".into()).unwrap();
        export_docx(
            word.to_string_lossy().to_string(),
            b"PK-test-payload".to_vec(),
        )
        .unwrap();
        assert_eq!(fs::read_to_string(&md).unwrap(), "latest");
        let mut files: Vec<_> = fs::read_dir(&dir)
            .unwrap()
            .map(|entry| entry.unwrap().file_name())
            .collect();
        files.sort();
        assert_eq!(
            files,
            vec![
                std::ffi::OsString::from("中文.docx"),
                std::ffi::OsString::from("中文.md")
            ]
        );
        fs::remove_dir_all(dir).unwrap();
    }
}

#[tauri::command]
fn resolve_file_path(path: String) -> Result<String, String> {
    let path = PathBuf::from(path);
    ensure_markdown_path(&path)?;
    let resolved = if path.exists() {
        fs::canonicalize(&path)
    } else {
        let parent = path
            .parent()
            .ok_or_else(|| "Invalid file path".to_string())?;
        let name = path
            .file_name()
            .ok_or_else(|| "Invalid file path".to_string())?;
        fs::canonicalize(parent).map(|parent| parent.join(name))
    }
    .map_err(|e| format!("Failed to resolve file path: {}", e))?;
    ensure_markdown_path(&resolved)?;
    Ok(resolved.to_string_lossy().to_string())
}

#[tauri::command]
fn read_file(path: String) -> Result<String, String> {
    let path = PathBuf::from(path);
    ensure_markdown_path(&path)?;
    if !path.is_file() {
        return Err("Path is not a regular file".to_string());
    }

    fs::read_to_string(&path).map_err(|e| format!("Failed to read file: {}", e))
}

#[tauri::command]
fn save_file(path: String, content: String) -> Result<(), String> {
    let path = PathBuf::from(path);
    ensure_markdown_path(&path)?;
    write_content_atomically(&path, &content)
}

#[tauri::command]
fn export_xlsx(output_path: String, bytes: Vec<u8>) -> Result<String, String> {
    if bytes.is_empty() {
        return Err("Export content is empty".to_string());
    }

    let output_path = PathBuf::from(output_path);
    ensure_xlsx_path(&output_path)?;
    write_bytes_atomically(&output_path, &bytes)?;
    Ok(output_path.to_string_lossy().to_string())
}

#[tauri::command]
fn export_docx(output_path: String, bytes: Vec<u8>) -> Result<String, String> {
    if bytes.is_empty() {
        return Err("Export content is empty".to_string());
    }

    let output_path = PathBuf::from(output_path);
    ensure_docx_path(&output_path)?;
    write_bytes_atomically(&output_path, &bytes)?;
    Ok(output_path.to_string_lossy().to_string())
}

#[tauri::command]
fn print_webview(window: tauri::WebviewWindow) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        return window
            .print()
            .map_err(|e| format!("Failed to open print dialog: {}", e));
    }

    #[cfg(not(target_os = "macos"))]
    {
        window
            .eval("window.print()")
            .map_err(|e| format!("Failed to open print dialog: {}", e))
    }
}

#[tauri::command]
fn initial_files(state: tauri::State<'_, AppState>) -> Result<Vec<String>, String> {
    let mut pending = state.pending_files.lock().map_err(|e| e.to_string())?;
    pending.ready = true;
    Ok(std::mem::take(&mut pending.paths))
}

#[tauri::command]
fn quit_app(app: tauri::AppHandle) {
    app.exit(0);
}

/// Switch the menu language and persist the choice.
#[tauri::command]
fn switch_language(
    lang: String,
    state: tauri::State<'_, AppState>,
    app_handle: tauri::AppHandle,
) -> Result<String, String> {
    let language = match lang.as_str() {
        "zh-CN" => menu::Language::ZhCN,
        "en-US" => menu::Language::EnUS,
        _ => return Err("Unsupported language. Use 'zh-CN' or 'en-US'".to_string()),
    };

    // Persist
    let mut config = state.config.lock().map_err(|e| e.to_string())?;
    config.language = language;
    menu::save_config(&app_handle, &config);

    // Rebuild menu
    let new_menu = menu::build_menu(&app_handle, language).map_err(|e| e.to_string())?;
    app_handle.set_menu(new_menu).map_err(|e| e.to_string())?;

    // Notify frontend
    let _ = app_handle.emit("language-changed", language.as_str());

    Ok(language.as_str().to_string())
}

/// Get current language setting.
#[tauri::command]
fn get_language(state: tauri::State<'_, AppState>) -> Result<String, String> {
    let config = state.config.lock().map_err(|e| e.to_string())?;
    Ok(config.language.as_str().to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let startup_files =
        find_markdown_files(std::env::args(), std::env::current_dir().ok().as_deref());

    let builder = tauri::Builder::default();

    // Windows launches the registered application again when a document is
    // opened from Explorer. Forward that second process's path to the existing
    // window so cold and warm file-association launches behave the same way.
    #[cfg(windows)]
    let builder = builder.plugin(tauri_plugin_single_instance::init(|app, argv, cwd| {
        let cwd = PathBuf::from(cwd);
        emit_open_files(app, find_markdown_files(argv, Some(&cwd)));

        if let Some(window) = app.get_webview_window("main") {
            let _ = window.unminimize();
            let _ = window.show();
            let _ = window.set_focus();
        }
    }));

    builder
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .manage(AppState {
            pending_files: Mutex::new(PendingFiles {
                paths: startup_files,
                ready: false,
            }),
            config: Mutex::new(menu::AppConfig::default()),
        })
        .setup(move |app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            let handle = app.handle().clone();

            if let Some(main_window) = handle.get_webview_window("main") {
                main_window.show()?;
                main_window.set_focus()?;
            }

            // Load config and build the initial menu
            let config = menu::load_config(&handle);
            let language = config.language;

            // Store the loaded config
            {
                let state = handle.state::<AppState>();
                let mut c = state.config.lock().unwrap();
                *c = config;
            }

            let menu = menu::build_menu(&handle, language)?;
            handle.set_menu(menu)?;

            // Notify frontend of initial language
            let _ = handle.emit("language-changed", language.as_str());

            // Handle menu events
            app.on_menu_event(move |app_handle, event| {
                let id = event.id().0.as_str();

                match id {
                    // ── Language switch ──
                    menu::MENU_LANG_ZH_CN => {
                        let state = app_handle.state::<AppState>();
                        if let Ok(mut config) = state.config.lock() {
                            config.language = menu::Language::ZhCN;
                            menu::save_config(app_handle, &config);
                        }
                        if let Ok(new_menu) = menu::build_menu(app_handle, menu::Language::ZhCN) {
                            let _ = app_handle.set_menu(new_menu);
                        }
                        let _ = app_handle.emit("language-changed", "zh-CN");
                    }
                    menu::MENU_LANG_EN_US => {
                        let state = app_handle.state::<AppState>();
                        if let Ok(mut config) = state.config.lock() {
                            config.language = menu::Language::EnUS;
                            menu::save_config(app_handle, &config);
                        }
                        if let Ok(new_menu) = menu::build_menu(app_handle, menu::Language::EnUS) {
                            let _ = app_handle.set_menu(new_menu);
                        }
                        let _ = app_handle.emit("language-changed", "en-US");
                    }

                    // ── Menu actions that need frontend coordination ──
                    // These are emitted as events; the frontend (App.vue) listens and acts.
                    menu::MENU_FILE_OPEN
                    | menu::MENU_APP_QUIT
                    | menu::MENU_FILE_SAVE
                    | menu::MENU_FILE_SAVE_AS
                    | menu::MENU_FILE_EXPORT_WORD
                    | menu::MENU_FILE_EXPORT_EXCEL
                    | menu::MENU_FILE_EXPORT_PDF
                    | menu::MENU_FILE_CLOSE_DOCUMENT
                    | menu::MENU_EDIT_UNDO
                    | menu::MENU_EDIT_REDO
                    | menu::MENU_EDIT_CUT
                    | menu::MENU_EDIT_COPY
                    | menu::MENU_EDIT_PASTE
                    | menu::MENU_EDIT_SELECT_ALL
                    | menu::MENU_EDIT_FIND
                    | menu::MENU_EDIT_INSERT_FRONT_MATTER
                    | menu::MENU_EDIT_EDIT_FRONT_MATTER
                    | menu::MENU_EDIT_CLEAR_FRONT_MATTER
                    | menu::MENU_EDIT_GENERATE_TITLE_FROM_FRONT_MATTER
                    | menu::MENU_VIEW_READING
                    | menu::MENU_VIEW_EDITING
                    | menu::MENU_VIEW_SOURCE
                    | menu::MENU_VIEW_OUTLINE
                    | menu::MENU_VIEW_ZOOM_IN
                    | menu::MENU_VIEW_ZOOM_OUT
                    | menu::MENU_VIEW_ACTUAL_SIZE
                    | menu::MENU_VIEW_FULLSCREEN
                    | menu::MENU_HELP_GUIDE
                    | menu::MENU_HELP_TESTING => {
                        let _ = app_handle.emit("menu-action", id);
                    }

                    _ => {
                        // PredefinedMenuItem actions (quit, about, etc.)
                        // and any unhandled items — no action needed
                    }
                }
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            resolve_file_path,
            read_file,
            save_file,
            export_xlsx,
            export_docx,
            print_webview,
            initial_files,
            quit_app,
            switch_language,
            get_language,
        ])
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app_handle, event| {
            #[cfg(target_os = "macos")]
            if let tauri::RunEvent::Opened { urls } = event {
                let mut paths = Vec::new();
                for url in &urls {
                    let path_buf = url
                        .to_file_path()
                        .unwrap_or_else(|_| std::path::PathBuf::from(url.as_str()));
                    if ensure_markdown_path(&path_buf).is_err() {
                        continue;
                    }
                    let path = canonical_display_path(&path_buf.to_string_lossy());
                    paths.push(path);
                }
                emit_open_files(app_handle, paths);
            }
            // Suppress unused-variable warnings on non-macOS platforms
            // where the cfg-gated block above does not compile.
            #[cfg(not(target_os = "macos"))]
            {
                let _ = &app_handle;
                let _ = &event;
            }
        });
}
