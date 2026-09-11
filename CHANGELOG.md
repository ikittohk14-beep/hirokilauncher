# 📋 Журнал изменений / Changelog — HirokiLauncher

Все заметные изменения проекта **HirokiLauncher** документируются в этом файле.  
All notable changes to **HirokiLauncher** will be documented in this file.

---

## [2.0.0] - 2026-09-12 (Эволюция Bento / The Bento Evolution)

> 🤖 **ВЕСЬ КОД НАПИСАН ИИ / ALL CODE WRITTEN BY AI**  
> Вся кодовая база, архитектура, системные интеграции и логика компонентов HirokiLauncher были на 100% написаны, оптимизированы и отлажены искусственным интеллектом — автономным агентом **Antigravity** (Google DeepMind) в режиме парного программирования.  
> *The entire codebase, architecture, system integrations, and component logic of HirokiLauncher were 100% written, optimized, and debugged by artificial intelligence — the autonomous coding agent **Antigravity** (Google DeepMind).*

### 🇷🇺 Русский перевод (v2.0.0)

#### 🚀 Ключевые нововведения:
- **Интерактивный Bento Grid 2.0**:
  - Полностью адаптивный дашборд со свободным перетаскиванием (drag-and-drop) и изменением размера виджетов (`react-grid-layout`).
  - Персистентное сохранение: пользовательская разметка сетки автоматически сохраняется в `settings.json` и восстанавливается при перезапуске лаунчера.
  - Адаптивные брейкпоинты для идеального отображения на мониторах любого разрешения (от ультрашироких до компактных экранов ноутбуков).
- **Эргономичный трекер активности и времени игры (Playtime Heatmap)**:
  - Обновлённый виджет активности с эргономичными квадратными плитками дней месяца в стиле GitHub.
  - Адаптивное сжатие: в компактном режиме виджет отображает только сегодняшние игровые часы и календарь без перегрузки; при растягивании плавно разворачивает детальную статистику сессий по сборкам.
  - Исправлены проблемы наложения z-index слоёв и дергания тултипов.
- **Встроенный Linux MPRIS аудиоплеер и эквалайзер**:
  - Фоновый слушатель D-Bus через утилиту `playerctl`.
  - Автоматическое извлечение трека, исполнителя, обложки альбома и статуса воспроизведения из любого медиаплеера (Spotify, Chromium, Firefox, Amberol и др.).
  - Управление воспроизведением (пауза, следующий трек) прямо из окна лаунчера.
  - Живой анимированный эквалайзер с аудио-барами, реагирующими на воспроизведение.
- **Интеллектуальный Java Engine**:
  - Автопоиск всех установленных JVM в системе (`/usr/lib/jvm`, `JAVA_HOME`, `Program Files\Java`, `Eclipse Adoptium`, `Zulu`, переменная `PATH`).
  - Автоматический подбор версии Java под требования конкретной версии Minecraft:
    - Minecraft 1.0 – 1.16.5 ➔ **Java 8**
    - Minecraft 1.17 ➔ **Java 16**
    - Minecraft 1.18 – 1.20.4 ➔ **Java 17**
    - Minecraft 1.20.5 – Latest / Снапшоты ➔ **Java 21**
  - Умные подсказки: если в системе нет подходящей Java, лаунчер выведет точную команду установки пакета (например, `paru -S jre8-openjdk` на CachyOS/Arch или ссылку на Adoptium для Windows).
- **Каталог Modrinth и обновление в 1 клик**:
  - Встроенный браузер модов, шейдеров и текстур-паков с Modrinth.
  - Фильтрация по категориям, версиям игры и переключатель снапшотов.
  - Автоматическое разрешение и скачивание обязательных зависимостей модов.
  - Автопроверка обновлений модов с моментальной установкой свежих версий в 1 клик.
  - Исправлена ошибка инвалидации кэша списка модов при замене или удалении файлов.
- **Полная кроссплатформенность (Linux & Windows)**:
  - Сборка classpath переведена на нативный `path.delimiter` (`;` в Windows, `:` в Linux), что полностью устранило фатальную ошибку загрузки классов JVM из-за букв дисков (`C:\`).
  - Валидация правил Mojang (`isRuleAllowed`) теперь полностью поддерживает Windows, macOS и Linux.
  - Автоматическое извлечение нативных библиотек (`.dll` на Windows, `.so` на Linux, `.dylib` на macOS) с поддержкой `${arch}`.
  - Корректная локализация путей данных (`%APPDATA%\hiroki-launcher` на Windows, `$XDG_DATA_HOME/hiroki-launcher` на Linux).
- **Оптимизации под Wayland и driftwm**:
  - Нативные флаги запуска Ozone Wayland (`--ozone-platform-hint=auto --enable-features=WaylandWindowDecorations`).
  - Абсолютно четкий рендеринг шрифтов без замыливания XWayland.
  - Адаптивная сетка при динамическом изменении размеров окон тайлинг-композитором `driftwm`.
  - Кастомный draggable тайтлбар (`-webkit-app-region: drag`) с кнопками управления окном.
- **Аккаунты и скины**:
  - Поддержка авторизации через Ely.by с прозрачной интеграцией `authlib-injector` для отображения официальных скинов на сторонних серверах.
  - Полноценная поддержка оффлайн-режима.
  - Быстрое переключение между сохраненными профилями.

---

### 🇬🇧 English Version (v2.0.0)

#### 🚀 Major Highlights:
- **Dynamic Bento Grid 2.0**:
  - Fully customizable, interactive dashboard with drag-and-drop and resize capabilities powered by `react-grid-layout`.
  - Persistent layout storage in `settings.json` — your customized layout is automatically saved and restored on startup.
  - Multi-breakpoint responsive grid ensuring flawless layout scaling on both ultrawide monitors and compact laptop displays.
- **Ergonomic Activity & Playtime Heatmap**:
  - Redesigned activity widget with sleek monthly GitHub-style activity dots and statistics.
  - Adaptive compression: cleanly displays today's hours and calendar when compact, expands into instance session breakdowns when enlarged.
  - Fixed z-index layering and smooth hover tooltips.
- **Built-in Linux MPRIS Music Player & Visualizer**:
  - Live background listener using `playerctl` communicating over D-Bus.
  - Automatically fetches track title, artist name, album cover art, and playback status from Spotify, Chromium, Firefox, Amberol, and any MPRIS2 player.
  - Interactive play/pause and track controls directly on the dashboard.
  - Dynamic responsive animated audio equalizer bars.
- **Intelligent Java Environment Resolver**:
  - Automated JVM detection engine scanning `/usr/lib/jvm`, `JAVA_HOME`, `Program Files\Java`, `Eclipse Adoptium`, and system `PATH`.
  - Automatic Mojang version requirement mapping:
    - Minecraft 1.0 – 1.16.5 ➔ **Java 8**
    - Minecraft 1.17 ➔ **Java 16**
    - Minecraft 1.18 – 1.20.4 ➔ **Java 17**
    - Minecraft 1.20.5 – Latest / Modern Snapshots ➔ **Java 21**
  - Smart fallback warnings with actionable installation commands (`paru -S jre8-openjdk` on CachyOS/Arch, Eclipse Temurin on Windows).
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

## [1.0.0] - 2026-09-06 (Первый релиз / Initial Release)

> 🤖 **ВЕСЬ КОД НАПИСАН ИИ / ALL CODE WRITTEN BY AI**  
> Вся кодовая база HirokiLauncher написана и отлажена искусственным интеллектом — автономным агентом Antigravity от Google DeepMind.  
> *The entire codebase of HirokiLauncher was written and debugged by AI — the autonomous coding agent Antigravity by Google DeepMind.*

### 🇷🇺 Русский перевод (v1.0.0)
- Базовый каркас приложения на Electron + TypeScript + React.
- Базовая система создания сборок и скачивания ресурсов игры.
- Тёмная тема интерфейса и базовые настройки.

### 🇬🇧 English Version (v1.0.0)
- Initial foundation of HirokiLauncher with Electron, TypeScript, and React.
- Basic instance creation and launch pipeline.
- Dark theme aesthetics and elementary settings.
