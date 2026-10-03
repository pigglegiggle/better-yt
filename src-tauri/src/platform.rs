// Platform-specific Utilities for Better-YT

#[cfg(target_os = "macos")]
pub const PLATFORM_NAME: &str = "macOS";

#[cfg(target_os = "windows")]
pub const PLATFORM_NAME: &str = "Windows";

#[cfg(target_os = "linux")]
pub const PLATFORM_NAME: &str = "Linux";

#[cfg(not(any(target_os = "macos", target_os = "windows", target_os = "linux")))]
pub const PLATFORM_NAME: &str = "Unknown";

pub fn get_platform() -> &'static str {
    PLATFORM_NAME
}

pub fn get_arch() -> &'static str {
    std::env::consts::ARCH
}
