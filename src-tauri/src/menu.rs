use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::menu::{
    AboutMetadataBuilder, CheckMenuItemBuilder, MenuBuilder, MenuItemBuilder, PredefinedMenuItem,
    SubmenuBuilder,
};
use tauri::{AppHandle, Manager, Runtime};

// ── Menu item IDs ──────────────────────────────────────────────────

// Top-level submenu IDs (not used for matching, but for app menu setup)
pub const APP_SUBMENU_ID: &str = "app-submenu";
pub const FILE_SUBMENU_ID: &str = "file-submenu";
pub const EDIT_SUBMENU_ID: &str = "edit-submenu";
pub const VIEW_SUBMENU_ID: &str = "view-submenu";
pub const LANG_SUBMENU_ID: &str = "lang-submenu";
pub const HELP_SUBMENU_ID: &str = "help-submenu";

// Action item IDs — used in menu event matching
pub const MENU_FILE_OPEN: &str = "file.open";
pub const MENU_FILE_SAVE: &str = "file.save";
pub const MENU_FILE_SAVE_AS: &str = "file.save_as";
pub const MENU_FILE_EXPORT_WORD: &str = "file.export_word";
pub const MENU_FILE_EXPORT_EXCEL: &str = "file.export_excel";

pub const MENU_EDIT_UNDO: &str = "edit.undo";
pub const MENU_EDIT_REDO: &str = "edit.redo";
pub const MENU_EDIT_CUT: &str = "edit.cut";
pub const MENU_EDIT_COPY: &str = "edit.copy";
pub const MENU_EDIT_PASTE: &str = "edit.paste";
pub const MENU_EDIT_SELECT_ALL: &str = "edit.select_all";
pub const MENU_EDIT_FIND: &str = "edit.find";
pub const MENU_EDIT_INSERT_FRONT_MATTER: &str = "edit.insert_front_matter";
pub const MENU_EDIT_EDIT_FRONT_MATTER: &str = "edit.edit_front_matter";
pub const MENU_EDIT_CLEAR_FRONT_MATTER: &str = "edit.clear_front_matter";
pub const MENU_EDIT_GENERATE_TITLE_FROM_FRONT_MATTER: &str =
    "edit.generate_title_from_front_matter";

pub const MENU_VIEW_READING: &str = "view.reading";
pub const MENU_VIEW_EDITING: &str = "view.editing";
pub const MENU_VIEW_SOURCE: &str = "view.source";
pub const MENU_VIEW_OUTLINE: &str = "view.outline";
pub const MENU_VIEW_ZOOM_IN: &str = "view.zoom_in";
pub const MENU_VIEW_ZOOM_OUT: &str = "view.zoom_out";
pub const MENU_VIEW_ACTUAL_SIZE: &str = "view.actual_size";
pub const MENU_VIEW_FULLSCREEN: &str = "view.fullscreen";

pub const MENU_LANG_ZH_CN: &str = "lang.zh_cn";
pub const MENU_LANG_EN_US: &str = "lang.en_us";

pub const MENU_HELP_GUIDE: &str = "help.guide";
pub const MENU_HELP_TESTING: &str = "help.testing";

// ── Language ────────────────────────────────────────────────────────

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum Language {
    #[serde(rename = "zh-CN")]
    ZhCN,
    #[serde(rename = "en-US")]
    EnUS,
}

impl Language {
    pub fn as_str(&self) -> &'static str {
        match self {
            Language::ZhCN => "zh-CN",
            Language::EnUS => "en-US",
        }
    }
}

// ── Config persistence ──────────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize)]
pub struct AppConfig {
    pub language: Language,
}

impl Default for AppConfig {
    fn default() -> Self {
        AppConfig {
            language: Language::ZhCN,
        }
    }
}

fn config_path(app_handle: &AppHandle) -> PathBuf {
    app_handle
        .path()
        .app_config_dir()
        .expect("failed to resolve app config dir")
        .join("settings.json")
}

pub fn load_config(app_handle: &AppHandle) -> AppConfig {
    let path = config_path(app_handle);
    if let Ok(data) = fs::read_to_string(&path) {
        serde_json::from_str(&data).unwrap_or_default()
    } else {
        AppConfig::default()
    }
}

pub fn save_config(app_handle: &AppHandle, config: &AppConfig) {
    let path = config_path(app_handle);
    if let Some(parent) = path.parent() {
        let _ = fs::create_dir_all(parent);
    }
    if let Ok(json) = serde_json::to_string_pretty(config) {
        let _ = fs::write(&path, json);
    }
}

// ── Menu building ───────────────────────────────────────────────────

/// Build a localized application menu.
/// On macOS, the first submenu becomes the application menu.
pub fn build_menu<R: Runtime>(
    app_handle: &AppHandle<R>,
    language: Language,
) -> tauri::Result<tauri::menu::Menu<R>> {
    match language {
        Language::ZhCN => build_menu_zh(app_handle),
        Language::EnUS => build_menu_en(app_handle),
    }
}

fn build_menu_zh<R: Runtime>(app_handle: &AppHandle<R>) -> tauri::Result<tauri::menu::Menu<R>> {
    let about_meta = || {
        AboutMetadataBuilder::new()
            .name(Some(String::from("AI 文档快看")))
            .version(Some(String::from("1.9.0")))
            .authors(Some(vec![String::from("AI 文档快看 contributors")]))
            .website(Some(String::from("https://github.com")))
            .build()
    };

    // ── App submenu ──
    let app_submenu_builder =
        SubmenuBuilder::with_id(app_handle, APP_SUBMENU_ID, "AI 文档快看").item(
            &PredefinedMenuItem::about(app_handle, Some("关于 AI 文档快看"), Some(about_meta()))?,
        );
    #[cfg(target_os = "macos")]
    let app_submenu_builder = app_submenu_builder
        .separator()
        .item(&PredefinedMenuItem::services(app_handle, Some("服务"))?)
        .separator()
        .item(&PredefinedMenuItem::hide(
            app_handle,
            Some("隐藏 AI 文档快看"),
        )?)
        .item(&PredefinedMenuItem::hide_others(
            app_handle,
            Some("隐藏其他"),
        )?)
        .item(&PredefinedMenuItem::show_all(app_handle, Some("显示全部"))?);
    let app_submenu = app_submenu_builder
        .separator()
        .item(&PredefinedMenuItem::quit(
            app_handle,
            Some("退出 AI 文档快看"),
        )?)
        .build()?;

    // ── File submenu ──
    let file_submenu = SubmenuBuilder::with_id(app_handle, FILE_SUBMENU_ID, "文件")
        .item(
            &MenuItemBuilder::with_id(MENU_FILE_OPEN, "打开文件...")
                .accelerator("CmdOrCtrl+O")
                .build(app_handle)?,
        )
        .separator()
        .item(
            &MenuItemBuilder::with_id(MENU_FILE_SAVE, "保存")
                .accelerator("CmdOrCtrl+S")
                .build(app_handle)?,
        )
        .item(
            &MenuItemBuilder::with_id(MENU_FILE_SAVE_AS, "另存为...")
                .accelerator("CmdOrCtrl+Shift+S")
                .build(app_handle)?,
        )
        .separator()
        .item(&MenuItemBuilder::with_id(MENU_FILE_EXPORT_WORD, "导出 Word...").build(app_handle)?)
        .item(&MenuItemBuilder::with_id(MENU_FILE_EXPORT_EXCEL, "导出 Excel...").build(app_handle)?)
        .separator()
        .item(&PredefinedMenuItem::close_window(
            app_handle,
            Some("关闭窗口"),
        )?)
        .build()?;

    // ── Edit submenu ──
    let edit_submenu = SubmenuBuilder::with_id(app_handle, EDIT_SUBMENU_ID, "编辑")
        .item(
            &MenuItemBuilder::with_id(MENU_EDIT_UNDO, "撤销")
                .accelerator("CmdOrCtrl+Z")
                .build(app_handle)?,
        )
        .item(
            &MenuItemBuilder::with_id(MENU_EDIT_REDO, "重做")
                .accelerator("CmdOrCtrl+Y")
                .build(app_handle)?,
        )
        .separator()
        .item(
            &MenuItemBuilder::with_id(MENU_EDIT_CUT, "剪切")
                .accelerator("CmdOrCtrl+X")
                .build(app_handle)?,
        )
        .item(
            &MenuItemBuilder::with_id(MENU_EDIT_COPY, "复制")
                .accelerator("CmdOrCtrl+C")
                .build(app_handle)?,
        )
        .item(
            &MenuItemBuilder::with_id(MENU_EDIT_PASTE, "粘贴")
                .accelerator("CmdOrCtrl+V")
                .build(app_handle)?,
        )
        .item(
            &MenuItemBuilder::with_id(MENU_EDIT_SELECT_ALL, "全选")
                .accelerator("CmdOrCtrl+A")
                .build(app_handle)?,
        )
        .separator()
        .item(
            &MenuItemBuilder::with_id(MENU_EDIT_FIND, "查找...")
                .accelerator("CmdOrCtrl+F")
                .build(app_handle)?,
        )
        .separator()
        .item(
            &MenuItemBuilder::with_id(MENU_EDIT_INSERT_FRONT_MATTER, "插入 Front Matter")
                .build(app_handle)?,
        )
        .item(
            &MenuItemBuilder::with_id(MENU_EDIT_EDIT_FRONT_MATTER, "编辑 Front Matter")
                .build(app_handle)?,
        )
        .item(
            &MenuItemBuilder::with_id(MENU_EDIT_CLEAR_FRONT_MATTER, "清空 Front Matter")
                .build(app_handle)?,
        )
        .item(
            &MenuItemBuilder::with_id(
                MENU_EDIT_GENERATE_TITLE_FROM_FRONT_MATTER,
                "从 Front Matter 生成标题",
            )
            .build(app_handle)?,
        )
        .build()?;

    // ── View submenu ──
    let view_submenu = SubmenuBuilder::with_id(app_handle, VIEW_SUBMENU_ID, "视图")
        .item(
            &MenuItemBuilder::with_id(MENU_VIEW_READING, "阅读模式")
                .accelerator("CmdOrCtrl+1")
                .build(app_handle)?,
        )
        .item(
            &MenuItemBuilder::with_id(MENU_VIEW_EDITING, "编辑模式")
                .accelerator("CmdOrCtrl+2")
                .build(app_handle)?,
        )
        .item(
            &MenuItemBuilder::with_id(MENU_VIEW_SOURCE, "源码模式")
                .accelerator("CmdOrCtrl+3")
                .build(app_handle)?,
        )
        .separator()
        .item(
            &MenuItemBuilder::with_id(MENU_VIEW_OUTLINE, "显示 / 隐藏目录")
                .accelerator("CmdOrCtrl+B")
                .build(app_handle)?,
        )
        .separator()
        .item(
            &MenuItemBuilder::with_id(MENU_VIEW_ZOOM_IN, "放大")
                .accelerator("CmdOrCtrl+Plus")
                .build(app_handle)?,
        )
        .item(
            &MenuItemBuilder::with_id(MENU_VIEW_ZOOM_OUT, "缩小")
                .accelerator("CmdOrCtrl+-")
                .build(app_handle)?,
        )
        .item(
            &MenuItemBuilder::with_id(MENU_VIEW_ACTUAL_SIZE, "实际大小")
                .accelerator("CmdOrCtrl+0")
                .build(app_handle)?,
        )
        .separator()
        .item(
            &MenuItemBuilder::with_id(MENU_VIEW_FULLSCREEN, "全屏")
                .accelerator("F11")
                .build(app_handle)?,
        )
        .build()?;

    // ── Language submenu (zh-CN active) ──
    let lang_submenu = SubmenuBuilder::with_id(app_handle, LANG_SUBMENU_ID, "语言")
        .item(
            &CheckMenuItemBuilder::with_id(MENU_LANG_ZH_CN, "简体中文")
                .checked(true)
                .build(app_handle)?,
        )
        .item(
            &CheckMenuItemBuilder::with_id(MENU_LANG_EN_US, "English")
                .checked(false)
                .build(app_handle)?,
        )
        .build()?;

    // ── Help submenu ──
    let help_submenu = SubmenuBuilder::with_id(app_handle, HELP_SUBMENU_ID, "帮助")
        .item(&MenuItemBuilder::with_id(MENU_HELP_GUIDE, "使用说明").build(app_handle)?)
        .item(&MenuItemBuilder::with_id(MENU_HELP_TESTING, "测试清单").build(app_handle)?)
        .separator()
        .item(&PredefinedMenuItem::about(
            app_handle,
            Some("关于"),
            Some(about_meta()),
        )?)
        .build()?;

    // ── Build the menu bar ──
    MenuBuilder::new(app_handle)
        .item(&app_submenu)
        .item(&file_submenu)
        .item(&edit_submenu)
        .item(&view_submenu)
        .item(&lang_submenu)
        .item(&help_submenu)
        .build()
}

fn build_menu_en<R: Runtime>(app_handle: &AppHandle<R>) -> tauri::Result<tauri::menu::Menu<R>> {
    let about_meta = || {
        AboutMetadataBuilder::new()
            .name(Some(String::from("md-quicklook")))
            .version(Some(String::from("1.9.0")))
            .authors(Some(vec![String::from("md-quicklook contributors")]))
            .website(Some(String::from("https://github.com")))
            .build()
    };

    // ── App submenu ──
    let app_submenu_builder =
        SubmenuBuilder::with_id(app_handle, APP_SUBMENU_ID, "md-quicklook").item(
            &PredefinedMenuItem::about(app_handle, Some("About md-quicklook"), Some(about_meta()))?,
        );
    #[cfg(target_os = "macos")]
    let app_submenu_builder = app_submenu_builder
        .separator()
        .item(&PredefinedMenuItem::services(app_handle, Some("Services"))?)
        .separator()
        .item(&PredefinedMenuItem::hide(
            app_handle,
            Some("Hide md-quicklook"),
        )?)
        .item(&PredefinedMenuItem::hide_others(
            app_handle,
            Some("Hide Others"),
        )?)
        .item(&PredefinedMenuItem::show_all(app_handle, Some("Show All"))?);
    let app_submenu = app_submenu_builder
        .separator()
        .item(&PredefinedMenuItem::quit(
            app_handle,
            Some("Quit md-quicklook"),
        )?)
        .build()?;

    // ── File submenu ──
    let file_submenu = SubmenuBuilder::with_id(app_handle, FILE_SUBMENU_ID, "File")
        .item(
            &MenuItemBuilder::with_id(MENU_FILE_OPEN, "Open File...")
                .accelerator("CmdOrCtrl+O")
                .build(app_handle)?,
        )
        .separator()
        .item(
            &MenuItemBuilder::with_id(MENU_FILE_SAVE, "Save")
                .accelerator("CmdOrCtrl+S")
                .build(app_handle)?,
        )
        .item(
            &MenuItemBuilder::with_id(MENU_FILE_SAVE_AS, "Save As...")
                .accelerator("CmdOrCtrl+Shift+S")
                .build(app_handle)?,
        )
        .separator()
        .item(&MenuItemBuilder::with_id(MENU_FILE_EXPORT_WORD, "Export Word...").build(app_handle)?)
        .item(
            &MenuItemBuilder::with_id(MENU_FILE_EXPORT_EXCEL, "Export Excel...")
                .build(app_handle)?,
        )
        .separator()
        .item(&PredefinedMenuItem::close_window(
            app_handle,
            Some("Close Window"),
        )?)
        .build()?;

    // ── Edit submenu ──
    let edit_submenu = SubmenuBuilder::with_id(app_handle, EDIT_SUBMENU_ID, "Edit")
        .item(
            &MenuItemBuilder::with_id(MENU_EDIT_UNDO, "Undo")
                .accelerator("CmdOrCtrl+Z")
                .build(app_handle)?,
        )
        .item(
            &MenuItemBuilder::with_id(MENU_EDIT_REDO, "Redo")
                .accelerator("CmdOrCtrl+Y")
                .build(app_handle)?,
        )
        .separator()
        .item(
            &MenuItemBuilder::with_id(MENU_EDIT_CUT, "Cut")
                .accelerator("CmdOrCtrl+X")
                .build(app_handle)?,
        )
        .item(
            &MenuItemBuilder::with_id(MENU_EDIT_COPY, "Copy")
                .accelerator("CmdOrCtrl+C")
                .build(app_handle)?,
        )
        .item(
            &MenuItemBuilder::with_id(MENU_EDIT_PASTE, "Paste")
                .accelerator("CmdOrCtrl+V")
                .build(app_handle)?,
        )
        .item(
            &MenuItemBuilder::with_id(MENU_EDIT_SELECT_ALL, "Select All")
                .accelerator("CmdOrCtrl+A")
                .build(app_handle)?,
        )
        .separator()
        .item(
            &MenuItemBuilder::with_id(MENU_EDIT_FIND, "Find...")
                .accelerator("CmdOrCtrl+F")
                .build(app_handle)?,
        )
        .separator()
        .item(
            &MenuItemBuilder::with_id(MENU_EDIT_INSERT_FRONT_MATTER, "Insert Front Matter")
                .build(app_handle)?,
        )
        .item(
            &MenuItemBuilder::with_id(MENU_EDIT_EDIT_FRONT_MATTER, "Edit Front Matter")
                .build(app_handle)?,
        )
        .item(
            &MenuItemBuilder::with_id(MENU_EDIT_CLEAR_FRONT_MATTER, "Clear Front Matter")
                .build(app_handle)?,
        )
        .item(
            &MenuItemBuilder::with_id(
                MENU_EDIT_GENERATE_TITLE_FROM_FRONT_MATTER,
                "Generate Title from Front Matter",
            )
            .build(app_handle)?,
        )
        .build()?;

    // ── View submenu ──
    let view_submenu = SubmenuBuilder::with_id(app_handle, VIEW_SUBMENU_ID, "View")
        .item(
            &MenuItemBuilder::with_id(MENU_VIEW_READING, "Reading Mode")
                .accelerator("CmdOrCtrl+1")
                .build(app_handle)?,
        )
        .item(
            &MenuItemBuilder::with_id(MENU_VIEW_EDITING, "Editing Mode")
                .accelerator("CmdOrCtrl+2")
                .build(app_handle)?,
        )
        .item(
            &MenuItemBuilder::with_id(MENU_VIEW_SOURCE, "Source Mode")
                .accelerator("CmdOrCtrl+3")
                .build(app_handle)?,
        )
        .separator()
        .item(
            &MenuItemBuilder::with_id(MENU_VIEW_OUTLINE, "Show / Hide Outline")
                .accelerator("CmdOrCtrl+B")
                .build(app_handle)?,
        )
        .separator()
        .item(
            &MenuItemBuilder::with_id(MENU_VIEW_ZOOM_IN, "Zoom In")
                .accelerator("CmdOrCtrl+Plus")
                .build(app_handle)?,
        )
        .item(
            &MenuItemBuilder::with_id(MENU_VIEW_ZOOM_OUT, "Zoom Out")
                .accelerator("CmdOrCtrl+-")
                .build(app_handle)?,
        )
        .item(
            &MenuItemBuilder::with_id(MENU_VIEW_ACTUAL_SIZE, "Actual Size")
                .accelerator("CmdOrCtrl+0")
                .build(app_handle)?,
        )
        .separator()
        .item(
            &MenuItemBuilder::with_id(MENU_VIEW_FULLSCREEN, "Full Screen")
                .accelerator("F11")
                .build(app_handle)?,
        )
        .build()?;

    // ── Language submenu (English active) ──
    let lang_submenu = SubmenuBuilder::with_id(app_handle, LANG_SUBMENU_ID, "Language")
        .item(
            &CheckMenuItemBuilder::with_id(MENU_LANG_ZH_CN, "简体中文")
                .checked(false)
                .build(app_handle)?,
        )
        .item(
            &CheckMenuItemBuilder::with_id(MENU_LANG_EN_US, "English")
                .checked(true)
                .build(app_handle)?,
        )
        .build()?;

    // ── Help submenu ──
    let help_submenu = SubmenuBuilder::with_id(app_handle, HELP_SUBMENU_ID, "Help")
        .item(&MenuItemBuilder::with_id(MENU_HELP_GUIDE, "User Guide").build(app_handle)?)
        .item(&MenuItemBuilder::with_id(MENU_HELP_TESTING, "Testing Checklist").build(app_handle)?)
        .separator()
        .item(&PredefinedMenuItem::about(
            app_handle,
            Some("About"),
            Some(about_meta()),
        )?)
        .build()?;

    // ── Build the menu bar ──
    MenuBuilder::new(app_handle)
        .item(&app_submenu)
        .item(&file_submenu)
        .item(&edit_submenu)
        .item(&view_submenu)
        .item(&lang_submenu)
        .item(&help_submenu)
        .build()
}
