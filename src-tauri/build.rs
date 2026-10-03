use std::fs;
use std::path::Path;

fn main() {
    // Ensure dist/inject.js exists so include_str! compiles even before first npm build
    let dist_dir = Path::new("../dist");
    let inject_file = dist_dir.join("inject.js");
    if !inject_file.exists() {
        let _ = fs::create_dir_all(dist_dir);
        let _ = fs::write(
            &inject_file,
            "/* YT Desktop Injected Script - Run npm run build to compile bundle */",
        );
    }

    tauri_build::build();
}
