use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager, WebviewWindow};
use url::Url;

use crate::platform;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct AppSettings {
    #[serde(default = "default_false")]
    pub launch_maximized: bool,
    #[serde(default = "default_false")]
    pub minimize_to_tray: bool,
    #[serde(default = "default_false")]
    pub close_to_tray: bool,
    #[serde(default = "default_true")]
    pub open_external_links_in_browser: bool,

    #[serde(default = "default_true")]
    pub hide_shorts: bool,
    #[serde(default = "default_false")]
    pub hide_comments: bool,
    #[serde(default = "default_false")]
    pub hide_recommendations: bool,
    #[serde(default = "default_false")]
    pub hide_home_recommendations: bool,
    #[serde(default = "default_true")]
    pub hide_merch_promo: bool,
    #[serde(default = "default_true")]
    pub sponsor_block_enabled: bool,
    #[serde(default = "default_sponsor_categories")]
    pub sponsor_categories: Vec<String>,

    #[serde(default = "default_speed")]
    pub default_playback_speed: f64,
    #[serde(default = "default_quality")]
    pub preferred_quality: String,

    #[serde(default = "default_theme")]
    pub theme: String,
    #[serde(default = "default_false")]
    pub compact_sidebar: bool,
    #[serde(default = "default_false")]
    pub reduce_animations: bool,

    #[serde(default = "default_false")]
    pub dev_tools_enabled: bool,
}

fn default_false() -> bool {
    false
}
fn default_true() -> bool {
    true
}
fn default_speed() -> f64 {
    1.0
}
fn default_quality() -> String {
    "Auto".to_string()
}
fn default_theme() -> String {
    "system".to_string()
}
fn default_sponsor_categories() -> Vec<String> {
    vec!["sponsor".to_string()]
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            launch_maximized: false,
            minimize_to_tray: false,
            close_to_tray: false,
            open_external_links_in_browser: true,
            hide_shorts: true,
            hide_comments: false,
            hide_recommendations: false,
            hide_home_recommendations: false,
            hide_merch_promo: true,
            sponsor_block_enabled: true,
            sponsor_categories: default_sponsor_categories(),
            default_playback_speed: 1.0,
            preferred_quality: "Auto".to_string(),
            theme: "system".to_string(),
            compact_sidebar: false,
            reduce_animations: false,
            dev_tools_enabled: false,
        }
    }
}

#[derive(Serialize)]
pub struct AppInfo {
    pub name: &'static str,
    pub version: &'static str,
    pub platform: &'static str,
    pub arch: &'static str,
}

fn get_settings_path(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_config_dir()
        .map_err(|e| format!("Failed to get config directory: {e}"))?;

    if !dir.exists() {
        fs::create_dir_all(&dir).map_err(|e| format!("Failed to create config directory: {e}"))?;
    }

    Ok(dir.join("settings.json"))
}

#[tauri::command]
pub fn get_settings(app: AppHandle) -> AppSettings {
    let path = match get_settings_path(&app) {
        Ok(p) => p,
        Err(e) => {
            eprintln!("[YT Desktop] Error resolving settings path: {e}");
            return AppSettings::default();
        }
    };

    if !path.exists() {
        return AppSettings::default();
    }

    match fs::read_to_string(&path) {
        Ok(contents) => serde_json::from_str::<AppSettings>(&contents).unwrap_or_else(|e| {
            eprintln!("[YT Desktop] Corrupt settings file, falling back to defaults: {e}");
            AppSettings::default()
        }),
        Err(e) => {
            eprintln!("[YT Desktop] Error reading settings file: {e}");
            AppSettings::default()
        }
    }
}

#[tauri::command]
pub fn save_settings(app: AppHandle, settings: AppSettings) -> Result<(), String> {
    let path = get_settings_path(&app)?;
    let serialized = serde_json::to_string_pretty(&settings)
        .map_err(|e| format!("Failed to serialize settings: {e}"))?;

    // Atomic write via temporary file
    let temp_path = path.with_extension("tmp");
    fs::write(&temp_path, serialized)
        .map_err(|e| format!("Failed to write temporary settings: {e}"))?;

    fs::rename(temp_path, path).map_err(|e| format!("Failed to finalize settings file: {e}"))?;

    Ok(())
}

#[tauri::command]
pub fn get_app_info() -> AppInfo {
    AppInfo {
        name: "YT Desktop",
        version: env!("CARGO_PKG_VERSION"),
        platform: platform::get_platform(),
        arch: platform::get_arch(),
    }
}

#[tauri::command]
pub fn open_external_url(app: AppHandle, url: String) -> Result<(), String> {
    use tauri_plugin_opener::OpenerExt;

    // Validate that URL is well-formed
    let parsed = Url::parse(&url).map_err(|e| format!("Invalid URL: {e}"))?;
    if parsed.scheme() != "http" && parsed.scheme() != "https" {
        return Err("Only HTTP/HTTPS URLs are allowed".to_string());
    }

    app.opener()
        .open_url(&url, None::<&str>)
        .map_err(|e| format!("Failed to launch browser: {e}"))?;

    Ok(())
}

#[tauri::command]
pub fn clear_cache(app: AppHandle) -> Result<(), String> {
    if let Ok(cache_dir) = app.path().app_cache_dir() {
        if cache_dir.exists() {
            let _ = fs::remove_dir_all(&cache_dir);
            let _ = fs::create_dir_all(&cache_dir);
        }
    }
    Ok(())
}

#[tauri::command]
pub fn clear_session(app: AppHandle) -> Result<(), String> {
    if let Ok(data_dir) = app.path().app_data_dir() {
        if data_dir.exists() {
            // Remove webview storage files
            let _ = fs::remove_dir_all(&data_dir);
            let _ = fs::create_dir_all(&data_dir);
        }
    }
    Ok(())
}

#[tauri::command]
pub fn toggle_devtools(window: WebviewWindow) {
    #[cfg(debug_assertions)]
    {
        if window.is_devtools_open() {
            window.close_devtools();
        } else {
            window.open_devtools();
        }
    }
    #[cfg(not(debug_assertions))]
    {
        let _ = window;
    }
}

pub fn is_internal_url(url_str: &str) -> bool {
    if url_str.starts_with("tauri://")
        || url_str.starts_with("http://localhost")
        || url_str.starts_with("http://127.0.0.1")
        || url_str == "about:blank"
    {
        return true;
    }

    let parsed = match Url::parse(url_str) {
        Ok(u) => u,
        Err(_) => return false,
    };

    if parsed.scheme() != "https" && parsed.scheme() != "http" {
        return false;
    }

    let host = match parsed.host_str() {
        Some(h) => h.to_lowercase(),
        None => return false,
    };

    // YouTube main and subdomains
    if host == "youtube.com"
        || host == "www.youtube.com"
        || host == "m.youtube.com"
        || host == "music.youtube.com"
    {
        return true;
    }
    if host.ends_with(".youtube.com") {
        let parts: Vec<&str> = host.split('.').collect();
        if parts.len() >= 3
            && parts[parts.len() - 2] == "youtube"
            && parts[parts.len() - 1] == "com"
        {
            return true;
        }
    }

    // Google accounts, auth, and consent
    if host == "accounts.google.com"
        || host == "myaccount.google.com"
        || host == "policies.google.com"
        || host == "consent.youtube.com"
        || host == "support.google.com"
    {
        return true;
    }

    false
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_settings() {
        let defaults = AppSettings::default();
        assert_eq!(defaults.launch_maximized, false);
        assert_eq!(defaults.hide_shorts, true);
        assert_eq!(defaults.open_external_links_in_browser, true);
        assert_eq!(defaults.sponsor_categories, vec!["sponsor".to_string()]);
        assert_eq!(defaults.default_playback_speed, 1.0);
    }

    #[test]
    fn test_settings_deserialization_with_missing_keys() {
        let partial_json = r#"{"hideShorts": false, "theme": "dark"}"#;
        let parsed: AppSettings = serde_json::from_str(partial_json).unwrap();
        assert_eq!(parsed.hide_shorts, false);
        assert_eq!(parsed.theme, "dark");
        // Check defaults are populated
        assert_eq!(parsed.default_playback_speed, 1.0);
        assert_eq!(parsed.open_external_links_in_browser, true);
    }

    #[test]
    fn test_is_internal_url_rust() {
        assert!(is_internal_url("https://www.youtube.com/watch?v=123"));
        assert!(is_internal_url("https://accounts.google.com/signin"));
        assert!(is_internal_url("https://music.youtube.com/"));
        assert!(!is_internal_url("https://github.com/"));
        assert!(!is_internal_url("https://youtube.com.attacker.com/"));
        assert!(!is_internal_url("https://evil.com/?yt=youtube.com"));
    }
}
