<div align="center">
  <img src="build/rofi-icon.svg" width="128" height="128" alt="HirokiLauncher Logo">
  <h1>HirokiLauncher 2.0</h1>
  <p><b>Сверхбыстрый, адаптивный и эстетичный лаунчер Minecraft нового поколения.</b></p>
  <p>Оптимизирован для <b>Linux (CachyOS / Wayland / driftwm)</b> и <b>Windows</b>.</p>

  <div>
    <img src="https://img.shields.io/badge/version-2.0.0-blue.svg?style=for-the-badge" alt="Version 2.0.0" />
    <img src="https://img.shields.io/badge/Wayland-Native-green.svg?style=for-the-badge" alt="Wayland Native" />
    <img src="https://img.shields.io/badge/Windows-Compatible-0078D6.svg?style=for-the-badge" alt="Windows Compatible" />
    <img src="https://img.shields.io/badge/React_18-Tailwind_CSS-38B2AC.svg?style=for-the-badge" alt="React & Tailwind" />
    <img src="https://img.shields.io/badge/TypeScript-5.6-blue.svg?style=for-the-badge" alt="TypeScript" />
  </div>
</div>

---

## 🇷🇺 Описание (Russian)

**HirokiLauncher 2.0** — это полнофункциональный лаунчер для Minecraft, спроектированный с нуля на стеке **Electron + Vite + React + TypeScript + Tailwind CSS**. 

Главный акцент проекта — максимальная скорость работы, абсолютная чёткость интерфейса без размытия в Wayland-композиторах (включая динамические тайлинг-менеджеры, такие как **driftwm** и **Hyprland**), интерактивный Bento-дашборд и интеллектуальное управление зависимостями игры.

---

### ✨ Ключевые возможности

#### 🍱 1. Интерактивный Bento Grid 2.0
- **Свободная кастомизация**: Перемещайте, масштабируйте и переставляйте виджеты на главном экране так, как удобно вам (`react-grid-layout`).
- **Автосохранение**: Состояние сетки автоматически сохраняется в конфигурации лаунчера и восстанавливается при перезапуске.
- **Адаптивность под тайлинг**: При смене пропорций или разметки тайлинг-менеджером интерфейс плавно перестраивается без глитчей.

#### 📊 2. Эргономичный трекер активности (Playtime Heatmap)
- **GitHub-style матрица**: Наглядные эргономичные кубики активности по дням месяца.
- **Умное сжатие**: В компактном размере виджет аккуратно оставляет только сегодняшние игровые часы и календарь; при растягивании раскрывает детальный список сборок и сессий.

#### 🎵 3. Встроенный Linux MPRIS Музыкальный Виджет
- **Интеграция с D-Bus / playerctl**: Лаунчер автоматически подхватывает трек, исполнителя, статус воспроизведения и обложку из любого медиаплеера (Spotify, Chromium, Firefox, Amberol и др.).
- **Управление медиа**: Переключение треков и пауза прямо из окна лаунчера.
- **Анимированный визуализатор**: Интерактивные эквалайзер-бары, реагирующие на статус воспроизведения.

#### ☕ 4. Интеллектуальный Java Engine
- **Автопоиск всех JVM в системе**: Сканирует `/usr/lib/jvm`, `JAVA_HOME`, переменные `PATH`, директории Adoptium/Zulu/Oracle.
- **Автоматический выбор версии под Minecraft**:
  - Minecraft 1.0 — 1.16.5 ➔ **Java 8**
  - Minecraft 1.17 ➔ **Java 16**
  - Minecraft 1.18 — 1.20.4 ➔ **Java 17**
  - Minecraft 1.20.5 — 1.21+ / Снапшоты ➔ **Java 21**
- **Понятные предупреждения**: Если версия Java несовместима со сборкой, лаунчер сразу подскажет точную команду для установки пакета (например, `paru -S jre8-openjdk`).

#### 🧩 5. Каталог Modrinth и обновление в 1 клик
- **Встроенный браузер контента**: Поиск и установка модов, шейдеров и текстур-паков напрямую из Modrinth.
- **Фильтрация версий и снапшотов**: Удобные фильтры с возможностью включения/отключения снапшотов в настройках.
- **Авторазрешение зависимостей**: Лаунчер сам находит и докачивает обязательные библиотеки для каждого мода.
- **Автопроверка обновлений**: Кнопка проверки свежих релизов установленных модов с моментальным обновлением в 1 клик.

#### 🪟 6. Полная кроссплатформенность (Linux & Windows)
- Поддержка нативных форматов путей (`%APPDATA%` на Windows, `XDG_DATA_HOME` на Linux).
- Корректная сборка classpath с учетом системного разделителя путей (`path.delimiter`).
- Автоматическая распаковка нативных библиотек (`.dll` для Windows, `.so` для Linux, `.dylib` для macOS).

#### 🛡️ 7. Аккаунты Ely.by и Оффлайн-режим
- Поддержка входа через **Ely.by** с прозрачной интеграцией `authlib-injector` для отображения скинов.
- Мгновенное переключение между несколькими профилями.

---

## ⚙️ Установка и запуск

### Готовые сборки (Releases)
Скачайте готовый архив или инсталлятор со страницы [Releases](https://github.com/ikittohk14-beep/hirokilauncher/releases):
- **Windows**: `HirokiLauncher-Setup-2.0.0.exe` или `.zip`
- **Linux**: `hiroki-launcher-2.0.0.tar.gz` или `.zip`

### Сборка из исходников

Требования: `Node.js >= 20`, `pnpm`.

```bash
# Клонирование репозитория
git clone https://github.com/ikittohk14-beep/hirokilauncher.git
cd hirokilauncher

# Установка зависимостей
pnpm install

# Запуск в режиме разработки (Wayland Native)
pnpm run start
```

### Сборка пакетов
```bash
# Сборка под Linux (tar.gz, zip)
pnpm run dist:linux

# Сборка под Windows (NSIS .exe, zip)
pnpm run dist:win

# Сборка под обе платформы
pnpm run dist:all
```

---

## 🛠️ Стек технологий

- **Фреймворк**: [Electron](https://www.electronjs.org/) + [Vite](https://vitejs.dev/)
- **Язык**: [TypeScript](https://www.typescriptlang.org/)
- **Интерфейс**: [React 18](https://react.dev/), [Tailwind CSS](https://tailwindcss.com/)
- **Сетка Bento**: [react-grid-layout](https://github.com/react-grid-layout/react-grid-layout)
- **Иконки**: [Lucide React](https://lucide.dev/)
- **Сборщик дистрибутивов**: [electron-builder](https://www.electron.build/)

---

> 🤖 **Интересный факт:** Кодовая база лаунчера создана и сопровождается в тесном сотрудничестве с автономным ИИ-агентом **Antigravity** (Google DeepMind).
