import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import type { AppSettings } from '../../../preload/types';

export class SettingsService {
  private static instance: SettingsService;
  private settingsFilePath: string;
  private backupFilePath: string;
  private cachedSettings: AppSettings | null = null;

  private constructor() {
    let baseDir: string;
    if (process.platform === 'win32') {
      const appData = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
      baseDir = path.join(appData, 'hiroki-launcher');
    } else {
      const dataHome = process.env.XDG_DATA_HOME || path.join(os.homedir(), '.local', 'share');
      baseDir = path.join(dataHome, 'hiroki-launcher');
    }
    this.settingsFilePath = path.join(baseDir, 'settings.json');
    this.backupFilePath = path.join(baseDir, 'settings.json.bak');

    try {
      if (!fs.existsSync(baseDir)) {
        fs.mkdirSync(baseDir, { recursive: true });
      }
    } catch (error) {
      console.error('[SettingsService] Failed to create base directory:', error);
    }
  }

  public static getInstance(): SettingsService {
    if (!SettingsService.instance) {
      SettingsService.instance = new SettingsService();
    }
    return SettingsService.instance;
  }

  public getDefaultSettings(): AppSettings {
    const totalMemoryMb = Math.round(os.totalmem() / (1024 * 1024));
    // Default: use 4096MB or 50% of available RAM if less than 8GB
    const suggestedMaxRam = Math.min(4096, Math.max(2048, Math.floor(totalMemoryMb * 0.5)));

    let defaultGameDir: string;
    let defaultJavaPath: string;

    if (process.platform === 'win32') {
      const appData = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
      defaultGameDir = path.join(appData, 'hiroki-launcher', 'game_data');
      defaultJavaPath = 'javaw.exe';
    } else {
      const dataHome = process.env.XDG_DATA_HOME || path.join(os.homedir(), '.local', 'share');
      defaultGameDir = path.join(dataHome, 'hiroki-launcher', 'game_data');
      defaultJavaPath = '/usr/bin/java';
    }

    return {
      gameDirectory: defaultGameDir,
      javaPath: defaultJavaPath,
      minMemoryMb: 1024,
      maxMemoryMb: suggestedMaxRam,
      customJvmArgs: '-XX:+UseG1GC -XX:+ParallelRefProcEnabled -XX:MaxGCPauseMillis=200',
      theme: 'dark',
      autoCloseOnLaunch: false,
      tileShape: 'compact',
      layout: [
        { i: 'col1', x: 0, y: 0, w: 6, h: 3, minW: 4, minH: 2 },
        { i: 'music', x: 0, y: 3, w: 6, h: 1, minW: 4, minH: 1 },
        { i: 'shelf', x: 6, y: 0, w: 18, h: 2, minW: 8, minH: 2 },
        { i: 'art', x: 6, y: 2, w: 5, h: 2, minW: 4, minH: 2 },
        { i: 'mods', x: 11, y: 2, w: 6, h: 2, minW: 5, minH: 2 },
        { i: 'launch', x: 17, y: 2, w: 7, h: 2, minW: 6, minH: 2 }
      ],
      showSnapshots: true,
    };
  }

  private safeWriteJson(filePath: string, data: any, backupPath?: string): void {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const tmpPath = `${filePath}.tmp.${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const jsonStr = JSON.stringify(data, null, 2);
    fs.writeFileSync(tmpPath, jsonStr, 'utf-8');

    // Create / update backup of existing valid file before replacing
    if (backupPath && fs.existsSync(filePath)) {
      try {
        const existing = fs.readFileSync(filePath, 'utf-8');
        if (existing.trim()) {
          JSON.parse(existing); // Validate JSON before creating backup
          fs.copyFileSync(filePath, backupPath);
        }
      } catch (e) {
        // Current file might be invalid, do not overwrite a potentially good backup with corrupted data
      }
    }

    fs.renameSync(tmpPath, filePath);
  }

  public getSettings(): AppSettings {
    if (this.cachedSettings) {
      return this.cachedSettings;
    }

    // 1. Try reading primary settings.json
    try {
      if (fs.existsSync(this.settingsFilePath)) {
        const fileContent = fs.readFileSync(this.settingsFilePath, 'utf-8');
        if (fileContent.trim()) {
          const parsed = JSON.parse(fileContent);
          const settings: AppSettings = { ...this.getDefaultSettings(), ...parsed };
          this.cachedSettings = settings;

          // Ensure backup exists for future recovery
          if (!fs.existsSync(this.backupFilePath)) {
            try {
              fs.copyFileSync(this.settingsFilePath, this.backupFilePath);
            } catch {}
          }
          return settings;
        }
      }
    } catch (error) {
      console.error('[SettingsService] Error reading settings.json:', error);
    }

    // 2. If primary failed or empty (e.g. crash during write), try restoring from backup
    try {
      if (fs.existsSync(this.backupFilePath)) {
        const backupContent = fs.readFileSync(this.backupFilePath, 'utf-8');
        if (backupContent.trim()) {
          console.warn('[SettingsService] Crash detected: restoring settings from valid backup settings.json.bak...');
          const parsed = JSON.parse(backupContent);
          const settings: AppSettings = { ...this.getDefaultSettings(), ...parsed };
          this.cachedSettings = settings;
          this.safeWriteJson(this.settingsFilePath, settings);
          return settings;
        }
      }
    } catch (backupError) {
      console.error('[SettingsService] Error reading backup settings.json.bak:', backupError);
    }

    // 3. If primary was corrupt, quarantine it so user data is not completely lost
    if (fs.existsSync(this.settingsFilePath)) {
      try {
        const corruptPath = `${this.settingsFilePath}.corrupted_${Date.now()}`;
        fs.renameSync(this.settingsFilePath, corruptPath);
        console.warn(`[SettingsService] Preserved corrupted settings to ${corruptPath}`);
      } catch {}
    }

    // 4. Fallback to defaults
    const defaults = this.getDefaultSettings();
    this.cachedSettings = defaults;
    try {
      this.safeWriteJson(this.settingsFilePath, defaults, this.backupFilePath);
    } catch (writeErr) {
      console.error('[SettingsService] Failed to write default settings:', writeErr);
    }
    return defaults;
  }

  public saveSettings(newSettings: Partial<AppSettings>): AppSettings {
    try {
      const current = this.cachedSettings || this.getSettings();
      const updated: AppSettings = { ...current, ...newSettings };

      this.safeWriteJson(this.settingsFilePath, updated, this.backupFilePath);
      this.cachedSettings = updated;
      return updated;
    } catch (error) {
      console.error('[SettingsService] Failed to save settings:', error);
      return this.cachedSettings || this.getDefaultSettings();
    }
  }

  public getBaseDir(): string {
    return path.dirname(this.settingsFilePath);
  }
}
