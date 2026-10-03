# Better YT

A high-performance, polished, cross-platform YouTube client built with **Tauri v2**, **Rust**, and **TypeScript** for Desktop and Mobile.

---

## 📥 Downloads (Release v1.0.0)

Direct install binaries are available on the [**Latest Release (v1.0.0)**](https://github.com/pigglegiggle/better-yt/releases/tag/v1.0.0):

| Platform | Format | Direct Download |
| :--- | :--- | :--- |
| **Android** | `.apk` (ARM64) | [**Better-YT_1.0.0_arm64.apk**](https://github.com/pigglegiggle/better-yt/releases/download/v1.0.0/Better-YT_1.0.0_arm64.apk) |
| **iOS / iPadOS** | `.ipa` (Sideload) | [**Better-YT_1.0.0.ipa**](https://github.com/pigglegiggle/better-yt/releases/download/v1.0.0/Better-YT_1.0.0.ipa) |
| **Windows** | `.exe` (Installer) | [**Better.YT_1.0.0_x64-setup.exe**](https://github.com/pigglegiggle/better-yt/releases/download/v1.0.0/Better.YT_1.0.0_x64-setup.exe) |
| **Windows** | `.msi` (Package) | [**Better.YT_1.0.0_x64_en-US.msi**](https://github.com/pigglegiggle/better-yt/releases/download/v1.0.0/Better.YT_1.0.0_x64_en-US.msi) |
| **macOS** | `.dmg` (Apple Silicon) | [**Better.YT_1.0.0_aarch64.dmg**](https://github.com/pigglegiggle/better-yt/releases/download/v1.0.0/Better.YT_1.0.0_aarch64.dmg) |
| **macOS** | `.zip` (Portable) | [**Better-YT-1.0.0-macOS-arm64.zip**](https://github.com/pigglegiggle/better-yt/releases/download/v1.0.0/Better-YT-1.0.0-macOS-arm64.zip) |
| **Linux** | `.AppImage` (Universal) | [**Better.YT_1.0.0_amd64.AppImage**](https://github.com/pigglegiggle/better-yt/releases/download/v1.0.0/Better.YT_1.0.0_amd64.AppImage) |
| **Linux** | `.deb` (Debian/Ubuntu) | [**Better.YT_1.0.0_amd64.deb**](https://github.com/pigglegiggle/better-yt/releases/download/v1.0.0/Better.YT_1.0.0_amd64.deb) |

> 💡 **iOS / iPadOS Sideloading Note**: The `.ipa` can be installed on non-jailbroken iPhones and iPads using popular sideloading utilities such as [AltStore](https://altstore.io/), [SideStore](https://sidestore.io/), [Sideloadly](https://sideloadly.io/), [TrollStore](https://trollstore.app/), or Xcode / iOS App Signer.

---

## Features

- 📺 **Official Web Experience**: Loads `https://www.youtube.com/` directly in a native WebView with persistent cookies, Google account sign-in, and full hardware-accelerated playback.
- 🚫 **Modular Content Filtering**:
  - **Hide Shorts**: Removes Shorts shelves, navigation buttons, carousels, and `/shorts/` video recommendations.
  - **Hide Comments**: Eliminates comment sections on watch pages to keep focus on video content.
  - **Hide Recommendations Sidebar**: Hides the suggested videos column on video watch pages.
  - **Hide Homepage Recommendation Grid**: Creates a distraction-free homepage without endless recommendation feeds.
  - **Hide Merch & Promotional UI**: Cleans up promotional cards, shopping banners, and merchandise shelves.
- ⚡ **SponsorBlock Integration**:
  - Connects to the public SponsorBlock API to automatically skip sponsor segments, self-promotions, interaction reminders, intros, outros, and previews.
  - Granular category toggles with in-memory caching and non-intrusive skip notifications with an "Unskip" option.
  - Automatically fails safely without breaking playback on livestreams or when offline.
- 🔍 **Native App Search Overlay**:
  - Quick launcher shortcut (`Cmd+L` on macOS, `Ctrl+L` on Windows/Linux).
  - Clean dark UI, autofocus input, keyboard accessible, `Esc` to close, `Enter` to navigate.
- ⚙️ **Discord / VS Code-Inspired Settings**:
  - Compact dark-themed preferences dialog (`Cmd+,` / `Ctrl+,`).
  - Configure window behaviors, content filters, playback speed, video resolution, appearance, and cache.
  - Destructive operations (cache clear, session reset) protected with confirmation dialogs.
- ⌨️ **Comprehensive Keyboard & Media Shortcuts**:
  - Standard navigation: `Cmd/Alt+[` (Back), `Cmd/Alt+]` (Forward), `Cmd/Ctrl+R` (Reload).
  - Media controls: `Space` / `K` (Play/Pause), `J` / `L` (-/+ 10s), `Left` / `Right` (-/+ 5s), `M` (Mute), `F` (Fullscreen), `C` (Captions), `Shift+>` / `Shift+<` (Speed).
  - Smart typing guard: Media shortcuts automatically yield when typing in search bars, comment fields, or text inputs.
- 🖥️ **Desktop-Native Window Management**:
  - Remembers window dimensions, position, and maximized state across launches.
  - Multi-monitor intelligence: Automatically recenters window if display topology changed or window would open off-screen.
  - Single-instance locking: Re-opening the app focuses and unminimizes the existing window.
  - Optional minimize-to-tray and close-to-tray.
- 🌐 **External Link Isolation**:
  - Safe URL verification: YouTube and Google authentication pages stay inside the app; external links open cleanly in your default system browser.
- 📴 **Graceful Offline Handling**:
  - Automatic network state detection displaying a friendly offline screen with a one-click connection retry.

---

## Screenshots

> *(Placeholder: Add application screenshots here)*
> 
> | Main Watch View | Search Overlay (`Cmd+L`) | Settings (`Cmd+,`) |
> | :---: | :---: | :---: |
> | `[Screenshot: Player]` | `[Screenshot: Search]` | `[Screenshot: Settings]` |

---

## System Requirements

- **Node.js**: v18.0.0 or higher (v20+ or v22+ recommended)
- **Rust**: Stable toolchain (1.78.0+)
- **OS Support**:
  - **macOS**: 10.13+ (Apple Silicon & Intel)
  - **Windows**: Windows 10/11 (with Microsoft Edge WebView2)
  - **Linux**: Modern desktop environments (Ubuntu 20.04+, Debian 11+, Fedora 36+, Arch Linux)

---

## Setup & Development

### 1. Platform Prerequisites

#### macOS
Ensure Xcode Command Line Tools are installed:
```bash
xcode-select --install
```

#### Windows
Ensure you have the Microsoft C++ Build Tools and the WebView2 runtime installed (pre-installed on Windows 10/11).

#### Linux (Debian / Ubuntu)
Install the required WebKitGTK and development libraries:
```bash
sudo apt-get update
sudo apt-get install -y \
  libwebkit2gtk-4.1-dev \
  build-essential \
  curl \
  wget \
  file \
  libxdo-dev \
  libssl-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev
```

---

### 2. Installation

Clone the repository and install frontend dependencies:
```bash
npm install
```

---

### 3. Development Workflow

Start the Vite development server and launch the desktop application:
```bash
# Run desktop client in development mode
npm run tauri dev

# Run Vite dev server for browser preview
npm run dev

# Run TypeScript typechecker
npm run typecheck

# Run ESLint
npm run lint

# Run automated unit tests
npm test

# Run Rust checks and tests
cargo check --manifest-path src-tauri/Cargo.toml
cargo test --manifest-path src-tauri/Cargo.toml
```

---

## Production Build

To compile a production release for your current platform:

```bash
npm run tauri build
```

The generated application bundles will be located in:

- **macOS**: `src-tauri/target/release/bundle/dmg/*.dmg` and `bundle/macos/*.app`
- **Windows**: `src-tauri/target/release/bundle/nsis/*.exe` and `bundle/msi/*.msi`
- **Linux**: `src-tauri/target/release/bundle/appimage/*.AppImage` and `bundle/deb/*.deb`

### Cross-Compilation Targets (macOS)

#### Apple Silicon (M1/M2/M3/M4)
```bash
npm run tauri build -- --target aarch64-apple-darwin
```

#### Intel x86_64
```bash
npm run tauri build -- --target x86_64-apple-darwin
```

#### Universal Binary (Apple Silicon + Intel)
```bash
npm run tauri build -- --target universal-apple-darwin
```

---

## Architecture & Security

```
better-yt/
├── src/                      # Frontend TypeScript application
│   ├── main.ts               # Orchestrator & DOM injection bootstrapper
│   ├── styles.css            # Dark theme, overlays, titlebar, & modals
│   ├── settings.ts           # Typed settings store & boundary validation
│   ├── shortcuts.ts          # Global keyboard & media shortcut dispatcher
│   ├── youtube.ts            # SPA navigation tracker & resilient DOM filters
│   ├── sponsorblock.ts       # Public SponsorBlock API client & skipper
│   ├── ui/                   # Modular UI components
│   │   ├── titlebar.ts       # Desktop navigation & quick jump bar
│   │   ├── search-overlay.ts # Native search launcher modal
│   │   ├── settings-modal.ts # Discord-density settings interface
│   │   ├── offline.ts        # Friendly connection fallback UI
│   │   └── toast.ts          # Non-intrusive action notifications
│   └── utils/                # Sanitized DOM and URL classification utilities
├── src-tauri/                # Native Rust Tauri layer
│   ├── Cargo.toml            # Rust dependencies & metadata
│   ├── tauri.conf.json       # Tauri v2 application configuration
│   ├── capabilities/         # Strict permission capabilities allowlist
│   └── src/
│       ├── main.rs           # Process entry point
│       ├── lib.rs            # App lifecycle, tray, menu, single-instance
│       ├── window.rs         # Geometry, off-screen prevention, persistence
│       ├── commands.rs       # Tauri IPC command handlers
│       └── platform.rs       # Cross-platform conditional compilation
├── tests/                    # Vitest automated unit test suites
└── .github/workflows/        # Matrix CI/CD building across macOS, Windows, Linux
```

### Privacy & Security Principles
- **Zero Telemetry**: No trackers, analytics, or private backends.
- **Credential Safety**: Authentication is handled directly by YouTube / Google inside the WebView sandbox. The app never intercepts, stores, or logs passwords, session tokens, or authorization headers.
- **Strict URL Allowlist**: Links to external domains are verified against a strict hostname parser and redirected to your system browser to prevent in-app phishing or WebView hijacking.
- **Minimal Permissions**: Tauri v2 capability configuration restricts IPC commands to an explicit allowlist.

---

## Disclaimer

**YT Desktop** is an unofficial, independent open-source desktop client. This project is not affiliated with, endorsed by, or sponsored by YouTube, Google LLC, or Alphabet Inc. YouTube is a registered trademark of Google LLC.

---

## License

This project is licensed under the [MIT License](LICENSE).
