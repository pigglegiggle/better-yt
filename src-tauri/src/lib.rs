pub mod commands;
pub mod platform;
pub mod window;

use tauri::menu::{MenuBuilder, MenuItem, PredefinedMenuItem, SubmenuBuilder};
use tauri::tray::TrayIconBuilder;
use tauri::{Manager, WebviewUrl};
use tauri_plugin_opener::OpenerExt;

const INJECT_SCRIPT: &str = include_str!("../../dist/inject.js");

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.unminimize();
                let _ = window.show();
                let _ = window.set_focus();
            }
        }))
        .invoke_handler(tauri::generate_handler![
            commands::get_settings,
            commands::save_settings,
            commands::open_external_url,
            commands::get_app_info,
            commands::clear_cache,
            commands::clear_session,
            commands::toggle_devtools,
        ])
        .setup(|app| {
            let app_handle = app.handle().clone();
            let saved_state = window::load_saved_window_state(&app_handle);
            let settings = commands::get_settings(app_handle.clone());

            // Build Application Menu
            setup_app_menu(app)?;

            // Build System Tray
            setup_tray(app);

            // Construct Main Webview Window with initialization script
            let yt_url = url::Url::parse("https://www.youtube.com")
                .map_err(|e| Box::new(std::io::Error::other(format!("{e}"))))?;
            let url = WebviewUrl::External(yt_url);

            let app_nav = app_handle.clone();

            let mut builder = tauri::WebviewWindowBuilder::new(&app_handle, "main", url)
                .title("Better YT")
                .inner_size(saved_state.width as f64, saved_state.height as f64)
                .min_inner_size(900.0, 600.0)
                .decorations(true)
                .initialization_script(INJECT_SCRIPT);

            // External navigation interception
            builder = builder.on_navigation(move |nav_url| {
                let url_str = nav_url.as_str();
                if commands::is_internal_url(url_str) {
                    true
                } else {
                    let current_settings = commands::get_settings(app_nav.clone());
                    if current_settings.open_external_links_in_browser {
                        let _ = app_nav.opener().open_url(url_str, None::<&str>);
                        false
                    } else {
                        true
                    }
                }
            });

            let win = builder.build()?;
            window::restore_window_state(&win, &saved_state);

            if settings.launch_maximized {
                let _ = win.maximize();
            }

            // Window event listeners for state persistence and close-to-tray
            let app_win = app_handle.clone();
            win.on_window_event(move |event| match event {
                tauri::WindowEvent::CloseRequested { api, .. } => {
                    let current_settings = commands::get_settings(app_win.clone());
                    if current_settings.close_to_tray {
                        api.prevent_close();
                        if let Some(w) = app_win.get_webview_window("main") {
                            let _ = w.hide();
                        }
                    }
                }
                tauri::WindowEvent::Moved(_) | tauri::WindowEvent::Resized(_) => {
                    if let Some(w) = app_win.get_webview_window("main") {
                        window::save_window_state(&app_win, &w);
                    }
                }
                _ => {}
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running YT Desktop application");
}

fn setup_app_menu(app: &mut tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let app_name = "Better YT";

    let app_submenu = SubmenuBuilder::new(app, app_name)
        .item(&PredefinedMenuItem::about(app, Some(app_name), None)?)
        .separator()
        .item(&PredefinedMenuItem::services(app, None)?)
        .separator()
        .item(&PredefinedMenuItem::hide(app, None)?)
        .item(&PredefinedMenuItem::hide_others(app, None)?)
        .item(&PredefinedMenuItem::show_all(app, None)?)
        .separator()
        .item(&PredefinedMenuItem::quit(app, None)?)
        .build()?;

    let edit_submenu = SubmenuBuilder::new(app, "Edit")
        .item(&PredefinedMenuItem::undo(app, None)?)
        .item(&PredefinedMenuItem::redo(app, None)?)
        .separator()
        .item(&PredefinedMenuItem::cut(app, None)?)
        .item(&PredefinedMenuItem::copy(app, None)?)
        .item(&PredefinedMenuItem::paste(app, None)?)
        .item(&PredefinedMenuItem::select_all(app, None)?)
        .build()?;

    let back_item = MenuItem::with_id(app, "menu_back", "Back", true, Some("CmdOrCtrl+["))?;
    let forward_item =
        MenuItem::with_id(app, "menu_forward", "Forward", true, Some("CmdOrCtrl+]"))?;
    let reload_item = MenuItem::with_id(app, "menu_reload", "Reload", true, Some("CmdOrCtrl+R"))?;
    let search_item =
        MenuItem::with_id(app, "menu_search", "Search...", true, Some("CmdOrCtrl+L"))?;
    let settings_item = MenuItem::with_id(
        app,
        "menu_settings",
        "Settings...",
        true,
        Some("CmdOrCtrl+,"),
    )?;

    let view_submenu = SubmenuBuilder::new(app, "View")
        .item(&back_item)
        .item(&forward_item)
        .item(&reload_item)
        .separator()
        .item(&search_item)
        .item(&settings_item)
        .separator()
        .item(&PredefinedMenuItem::fullscreen(app, None)?)
        .build()?;

    let menu = MenuBuilder::new(app)
        .items(&[&app_submenu, &edit_submenu, &view_submenu])
        .build()?;

    app.set_menu(menu)?;

    app.on_menu_event(move |app_handle, event| {
        if let Some(win) = app_handle.get_webview_window("main") {
            match event.id().as_ref() {
                "menu_back" => {
                    let _ = win.eval("window.history.back()");
                }
                "menu_forward" => {
                    let _ = win.eval("window.history.forward()");
                }
                "menu_reload" => {
                    let _ = win.eval("window.location.reload()");
                }
                "menu_search" => {
                    let _ = win.eval("window.__better_yt_search?.toggle()");
                }
                "menu_settings" => {
                    let _ = win.eval("window.__better_yt_settings?.toggle()");
                }
                _ => {}
            }
        }
    });

    Ok(())
}

fn setup_tray(app: &mut tauri::App) {
    let header_item = match MenuItem::with_id(app, "tray_header", "Better YT", false, None::<&str>)
    {
        Ok(item) => item,
        Err(_) => return,
    };
    let toggle_item = match MenuItem::with_id(app, "tray_toggle", "Show / Hide", true, None::<&str>)
    {
        Ok(item) => item,
        Err(_) => return,
    };
    let settings_item =
        match MenuItem::with_id(app, "tray_settings", "Settings", true, None::<&str>) {
            Ok(item) => item,
            Err(_) => return,
        };
    let quit_item = match MenuItem::with_id(app, "tray_quit", "Quit", true, None::<&str>) {
        Ok(item) => item,
        Err(_) => return,
    };

    let tray_menu = match MenuBuilder::new(app)
        .item(&header_item)
        .separator()
        .item(&toggle_item)
        .item(&settings_item)
        .separator()
        .item(&quit_item)
        .build()
    {
        Ok(m) => m,
        Err(_) => return,
    };

    let tray_builder = TrayIconBuilder::new()
        .menu(&tray_menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "tray_toggle" => {
                if let Some(win) = app.get_webview_window("main") {
                    if win.is_visible().unwrap_or(false) {
                        let _ = win.hide();
                    } else {
                        let _ = win.show();
                        let _ = win.set_focus();
                    }
                }
            }
            "tray_settings" => {
                if let Some(win) = app.get_webview_window("main") {
                    let _ = win.show();
                    let _ = win.set_focus();
                    let _ = win.eval("window.__better_yt_settings?.open()");
                }
            }
            "tray_quit" => {
                app.exit(0);
            }
            _ => {}
        });

    if let Some(icon) = app.default_window_icon() {
        let _ = tray_builder.icon(icon.clone()).build(app);
    } else {
        let _ = tray_builder.build(app);
    }
}
