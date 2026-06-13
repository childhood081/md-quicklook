use std::fs::{self, OpenOptions};
use std::io::Write;
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use tauri::{Emitter, Manager};

mod menu;

struct AppState {
    initial_file: Mutex<Option<String>>,
    config: Mutex<menu::AppConfig>,
}

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

fn backup_path(path: &Path) -> Result<PathBuf, String> {
    let file_name = path
        .file_name()
        .ok_or_else(|| "Invalid file path".to_string())?;
    let mut backup_name = file_name.to_os_string();
    backup_name.push(".bak");

    let mut backup = path.to_path_buf();
    backup.set_file_name(backup_name);
    Ok(backup)
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
/// Does NOT create a .bak backup — call `create_backup` separately when needed.
fn write_content_atomically(path: &Path, content: &str) -> Result<(), String> {
    write_bytes_atomically(path, content.as_bytes())
}

fn write_bytes_atomically(path: &Path, bytes: &[u8]) -> Result<(), String> {
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

/// Scan all CLI args (skipping flags) to find a .md or .markdown file path.
fn find_markdown_file_in_args() -> Option<String> {
    for arg in std::env::args().skip(1) {
        if arg.starts_with('-') {
            continue;
        }
        let path = if let Ok(url) = tauri::Url::parse(&arg) {
            if url.scheme() != "file" {
                continue;
            }
            url.to_file_path().ok()?
        } else {
            PathBuf::from(&arg)
        };

        if let Some(ext) = path.extension().and_then(|e| e.to_str()) {
            if ext.eq_ignore_ascii_case("md") || ext.eq_ignore_ascii_case("markdown") {
                return Some(canonical_display_path(&path.to_string_lossy()));
            }
        }
    }
    None
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
fn create_backup(path: String) -> Result<String, String> {
    let path = PathBuf::from(path);
    ensure_markdown_path(&path)?;
    if !path.is_file() {
        return Err("Cannot create backup: file does not exist".to_string());
    }
    let backup = backup_path(&path)?;
    fs::copy(&path, &backup).map_err(|e| format!("Failed to create backup: {}", e))?;
    Ok(backup.to_string_lossy().to_string())
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
fn initial_file(state: tauri::State<'_, AppState>) -> Option<String> {
    state.initial_file.lock().ok().and_then(|path| path.clone())
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
    let startup_file = find_markdown_file_in_args();
    let startup_file_for_event = startup_file.clone();

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .manage(AppState {
            initial_file: Mutex::new(startup_file),
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
                    | menu::MENU_FILE_SAVE
                    | menu::MENU_FILE_SAVE_AS
                    | menu::MENU_FILE_EXPORT_WORD
                    | menu::MENU_FILE_EXPORT_EXCEL
                    | menu::MENU_VIEW_READING
                    | menu::MENU_VIEW_EDITING
                    | menu::MENU_VIEW_SOURCE
                    | menu::MENU_VIEW_OUTLINE
                    | menu::MENU_VIEW_ZOOM_IN
                    | menu::MENU_VIEW_ZOOM_OUT
                    | menu::MENU_VIEW_ACTUAL_SIZE
                    | menu::MENU_HELP_GUIDE
                    | menu::MENU_HELP_TESTING => {
                        let _ = app_handle.emit("menu-action", id);
                    }

                    // Find action
                    "edit.find" => {
                        let _ = app_handle.emit("menu-action", "edit.find");
                    }

                    _ => {
                        // PredefinedMenuItem actions (quit, about, etc.)
                        // and any unhandled items — no action needed
                    }
                }
            });

            // Emit the startup file path (if any) to the frontend after a short
            // delay to let the webview initialize.
            if let Some(path) = startup_file_for_event {
                let handle = app.handle().clone();
                tauri::async_runtime::spawn(async move {
                    tokio::time::sleep(std::time::Duration::from_millis(500)).await;
                    let _ = handle.emit("open-file", path);
                });
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            read_file,
            save_file,
            create_backup,
            export_xlsx,
            export_docx,
            initial_file,
            switch_language,
            get_language,
        ])
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app_handle, event| {
            match event {
                #[cfg(target_os = "macos")]
                tauri::RunEvent::Opened { urls } => {
                    for url in &urls {
                        let path = url
                            .to_file_path()
                            .unwrap_or_else(|_| std::path::PathBuf::from(url.as_str()))
                            .to_string_lossy()
                            .to_string();
                        let _ = app_handle.emit("open-file", path);
                    }
                }
                _ => {}
            }
        });
}
