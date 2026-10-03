// Window Geometry & State Management for Better-YT
// Handles window dimensions, multi-monitor bounds validation,
// preventing off-screen restoration, and persisting window states.

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager, Monitor, PhysicalPosition, PhysicalSize, WebviewWindow};

const DEFAULT_WIDTH: u32 = 1440;
const DEFAULT_HEIGHT: u32 = 900;
const MIN_WIDTH: u32 = 900;
const MIN_HEIGHT: u32 = 600;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct SavedWindowState {
    pub x: i32,
    pub y: i32,
    pub width: u32,
    pub height: u32,
    pub maximized: bool,
}

impl Default for SavedWindowState {
    fn default() -> Self {
        Self {
            x: 100,
            y: 100,
            width: DEFAULT_WIDTH,
            height: DEFAULT_HEIGHT,
            maximized: false,
        }
    }
}

fn get_state_path(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_config_dir()
        .map_err(|e| format!("Failed to get config directory: {e}"))?;

    if !dir.exists() {
        let _ = fs::create_dir_all(&dir);
    }

    Ok(dir.join("window_state.json"))
}

pub fn load_saved_window_state(app: &AppHandle) -> SavedWindowState {
    let path = match get_state_path(app) {
        Ok(p) => p,
        Err(_) => return SavedWindowState::default(),
    };

    if !path.exists() {
        return SavedWindowState::default();
    }

    match fs::read_to_string(&path) {
        Ok(content) => serde_json::from_str(&content).unwrap_or_default(),
        Err(_) => SavedWindowState::default(),
    }
}

pub fn save_window_state(app: &AppHandle, window: &WebviewWindow) {
    let is_maximized = window.is_maximized().unwrap_or(false);

    // If maximized, only record maximized = true, keeping previous valid dimensions
    let mut state = load_saved_window_state(app);
    state.maximized = is_maximized;

    if !is_maximized {
        if let Ok(pos) = window.outer_position() {
            state.x = pos.x;
            state.y = pos.y;
        }
        if let Ok(size) = window.outer_size() {
            state.width = size.width.max(MIN_WIDTH);
            state.height = size.height.max(MIN_HEIGHT);
        }
    }

    if let Ok(path) = get_state_path(app) {
        let temp = path.with_extension("tmp");
        if let Ok(data) = serde_json::to_string(&state) {
            let _ = fs::write(&temp, data);
            let _ = fs::rename(temp, path);
        }
    }
}

/**
 * Validates whether a window bounding box overlaps reasonably with at least
 * one available display monitor.
 */
pub fn is_window_visible_on_any_monitor(
    x: i32,
    y: i32,
    width: u32,
    height: u32,
    monitors: &[Monitor],
) -> bool {
    if monitors.is_empty() {
        return true;
    }

    for monitor in monitors {
        let pos = monitor.position();
        let size = monitor.size();

        let mon_left = pos.x;
        let mon_top = pos.y;
        let mon_right = pos.x + size.width as i32;
        let mon_bottom = pos.y + size.height as i32;

        let win_left = x;
        let win_top = y;
        let win_right = x + width as i32;
        let win_bottom = y + height as i32;

        // Check if there is at least 100px overlap horizontally and vertically
        let overlap_x = (win_right - 100 >= mon_left) && (win_left + 100 <= mon_right);
        let overlap_y = (win_bottom - 50 >= mon_top) && (win_top + 50 <= mon_bottom);

        if overlap_x && overlap_y {
            return true;
        }
    }

    false
}

/**
 * Applies saved state to the WebviewWindow, restoring size, position, and maximized status,
 * or centering the window if monitor setup changed and window would be off-screen.
 */
pub fn restore_window_state(window: &WebviewWindow, state: &SavedWindowState) {
    let monitors = window.available_monitors().unwrap_or_default();

    let width = state.width.max(MIN_WIDTH);
    let height = state.height.max(MIN_HEIGHT);

    let _ = window.set_size(PhysicalSize::new(width, height));

    if is_window_visible_on_any_monitor(state.x, state.y, width, height, &monitors) {
        let _ = window.set_position(PhysicalPosition::new(state.x, state.y));
    } else {
        // If monitor configuration changed or position is off-screen, center window
        let _ = window.center();
    }

    if state.maximized {
        let _ = window.maximize();
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_saved_window_state_defaults() {
        let default_state = SavedWindowState::default();
        assert_eq!(default_state.width, 1440);
        assert_eq!(default_state.height, 900);
        assert_eq!(default_state.maximized, false);
    }
}
