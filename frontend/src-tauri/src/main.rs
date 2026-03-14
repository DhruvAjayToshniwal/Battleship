#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;
use tauri_plugin_shell::ShellExt;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let sidecar = app.shell().sidecar("battleship-server").unwrap();
            let (_rx, child) = sidecar.spawn().expect("Failed to spawn battleship-server sidecar");

            // Store child so it lives as long as the app and gets dropped on exit
            app.manage(SidecarChild(std::sync::Mutex::new(Some(child))));

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

struct SidecarChild(std::sync::Mutex<Option<tauri_plugin_shell::process::CommandChild>>);

impl Drop for SidecarChild {
    fn drop(&mut self) {
        if let Ok(mut guard) = self.0.lock() {
            if let Some(child) = guard.take() {
                let _ = child.kill();
            }
        }
    }
}
