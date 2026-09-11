# 📋 Changelog — HirokiLauncher

All notable changes to **HirokiLauncher** will be documented in this file.

---

## [2.0.0] - 2026-09-12

### 🚀 Major Highlights

- **Dynamic Bento Grid 2.0**:
  - Fully customizable, interactive dashboard with drag-and-drop and resize capabilities powered by `react-grid-layout`.
  - Persistent layout storage in `settings.json` — your customized layout is automatically saved and restored on startup.
  - Multi-breakpoint responsive grid ensuring flawless layout scaling on both ultrawide monitors and compact laptop displays.

- **Ergonomic Activity & Playtime Heatmap**:
  - Redesigned activity widget with sleek monthly GitHub-style activity dots and statistics.
  - Adaptive compression: when the widget is resized to compact mode, it cleanly displays today's hours and the activity calendar without clutter, expanding to reveal per-instance session breakdowns when enlarged.
  - Fixes for z-index layering and smooth hover tooltips.

- **Built-in Linux MPRIS Music Player & Visualizer**:
  - Live background listener using `playerctl` communicating over D-Bus.
  - Automatically fetches track title, artist name, album cover art, and playback status from Spotify, Chromium, Firefox, Amberol, and any MPRIS2-compliant player.
  - Interactive play/pause and track skipping controls right from the dashboard.
  - Dynamic responsive animated audio equalizer bars.

- **Intelligent Java Environment Resolver**:
  - Automated JVM detection engine scanning `/usr/lib/jvm`, `JAVA_HOME`, `Program Files\Java`, `Eclipse Adoptium`, and system `PATH`.
  - Automatic Mojang version requirement mapping:
    - Minecraft 1.0 – 1.16.5: **Java 8**
    - Minecraft 1.17: **Java 16**
    - Minecraft 1.18 – 1.20.4: **Java 17**
    - Minecraft 1.20.5 – Latest / Modern Snapshots: **Java 21**
  - Smart fallback warnings with actionable installation hints (`paru -S jre8-openjdk` on CachyOS/Arch, Eclipse Temurin on Windows).

- **Modrinth Catalog & One-Click Mod Updater**:
  - Built-in Modrinth explorer for discovering mods, shaderpacks, and resource packs.
  - Multi-category filters, Minecraft version filtering, and snapshots toggle support.
  - Automatic dependency resolution and download.
  - **One-Click Mod Updates**: Automatic detection of newer mod releases on Modrinth with an instant update button and status indicators.
  - Fixed mod cache invalidation issue where mod lists could fail to refresh after deleting or updating jars.

- **Cross-Platform Engine (Linux & Windows)**:
  - Fixed classpath joining using native `path.delimiter` (`;` on Windows, `:` on Linux), completely resolving Windows drive letter classloading crashes.
  - Platform-aware Mojang rule validation (`isRuleAllowed`) supporting Windows, macOS, and Linux rules.
  - Automatic extraction of platform-specific native libraries (`.dll` on Windows, `.so` on Linux, `.dylib` on macOS).
  - Platform-specific data paths (`APPDATA\hiroki-launcher` on Windows, `XDG_DATA_HOME/hiroki-launcher` on Linux).

- **Wayland & driftwm Compositor Optimizations**:
  - Native Ozone Wayland flags (`--ozone-platform-hint=auto --enable-features=WaylandWindowDecorations`).
  - Fluid resize responsiveness preventing window snapping visual artifacts in tiling window managers.
  - Custom drag-region titlebar with minimize, maximize, and close controls.

- **Account & Skin System**:
  - Integrated Ely.by authorization with `authlib-injector` for licensed skins on non-Mojang servers.
  - Seamless offline mode support.
  - Multi-account switcher with active profile badge.

---

## [1.0.0] - Earlier Release

- Initial foundation of HirokiLauncher with Electron, TypeScript, and React.
- Basic instance creation and launch pipeline.
- Dark theme aesthetics and elementary settings.
