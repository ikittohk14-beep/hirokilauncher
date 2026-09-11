import { LocalProxy } from "./proxy.js";
import fs from 'node:fs';
import path from 'node:path';
import { spawn, ChildProcess } from 'node:child_process';
import type { InstanceMeta, LaunchProgress, GameLog } from '../../../preload/types';
import { SettingsService } from '../storage/settings.service';
import { AccountsService } from '../accounts/accounts.service';
import { InstancesService } from '../storage/instances.service';
import { GameInstallerService } from '../minecraft/game-installer.service';
import { DownloaderService } from '../downloader/downloader.service';
import { JavaService } from '../system/java.service';
import AdmZip from 'adm-zip';

export class LaunchService {
  private static instance: LaunchService;
  private runningProcesses: Map<string, ChildProcess> = new Map();

  private progressListeners: Set<(progress: LaunchProgress) => void> = new Set();
  private logListeners: Set<(log: GameLog) => void> = new Set();
  private stateListeners: Set<(state: { instanceId: string; isActive: boolean; exitCode?: number }) => void> = new Set();

  public static getInstance(): LaunchService {
    if (!LaunchService.instance) {
      LaunchService.instance = new LaunchService();
    }
    return LaunchService.instance;
  }

  public onProgress(cb: (progress: LaunchProgress) => void): () => void {
    this.progressListeners.add(cb);
    return () => this.progressListeners.delete(cb);
  }

  public onLog(cb: (log: GameLog) => void): () => void {
    this.logListeners.add(cb);
    return () => this.logListeners.delete(cb);
  }

  public onStateChange(cb: (state: { instanceId: string; isActive: boolean; exitCode?: number }) => void): () => void {
    this.stateListeners.add(cb);
    return () => this.stateListeners.delete(cb);
  }

  private emitProgress(progress: LaunchProgress): void {
    for (const listener of this.progressListeners) {
      try {
        listener(progress);
      } catch (err) {
        console.error('[LaunchService] Error in progress listener:', err);
      }
    }
  }

  private emitLog(level: 'info' | 'warn' | 'error' | 'debug', message: string): void {
    const log: GameLog = {
      timestamp: Date.now(),
      level,
      message,
    };
    for (const listener of this.logListeners) {
      try {
        listener(log);
      } catch (err) {
        console.error('[LaunchService] Error in log listener:', err);
      }
    }
  }

  private emitStateChange(instanceId: string, isActive: boolean, exitCode?: number): void {
    for (const listener of this.stateListeners) {
      try {
        listener({ instanceId, isActive, exitCode });
      } catch (err) {
        console.error('[LaunchService] Error in state listener:', err);
      }
    }
  }

  /**
   * Ensures authlib-injector is available locally for Ely.by skin and auth support
   */
  private async ensureAuthlibInjector(): Promise<string> {
    const sharedDir = SettingsService.getInstance().getSettings().gameDirectory;
    const dest = path.join(sharedDir, 'tools', 'authlib-injector.jar');

    if (!fs.existsSync(dest)) {
      this.emitLog('info', '[Launcher] Загрузка authlib-injector для поддержки скинов Ely.by...');
      try {
        const response = await fetch('https://api.github.com/repos/yushijinhun/authlib-injector/releases/latest');
        const data = await response.json();
        const asset = data.assets?.find((a: any) => a.name.endsWith('.jar'));
        if (!asset) {
          throw new Error('Не найден .jar файл в последнем релизе authlib-injector на GitHub');
        }
        
        await DownloaderService.getInstance().downloadFile({
          url: asset.browser_download_url,
          destPath: dest,
        });
      } catch (err) {
        throw new Error(`Ошибка загрузки authlib-injector: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    return dest;
  }

  private ensureNatives(sharedDir: string, gameVersion: string, versionJson: any, nativesDir: string): void {
    try {
      if (!fs.existsSync(nativesDir)) {
        fs.mkdirSync(nativesDir, { recursive: true });
      }
      const existing = fs.readdirSync(nativesDir).filter(f => f.endsWith('.so'));
      if (existing.length > 0) {
        return;
      }

      const librariesDir = path.join(sharedDir, 'libraries');
      const nativeJars: string[] = [];

      const platform = process.platform === 'win32' ? 'windows' : process.platform === 'darwin' ? 'osx' : 'linux';
      const arch = process.arch === 'x64' ? '64' : '32';

      if (versionJson?.libraries) {
        for (const lib of versionJson.libraries) {
          if (lib.natives && lib.downloads?.classifiers) {
            let nativeKey = lib.natives[platform] || `natives-${platform}`;
            nativeKey = nativeKey.replace('${arch}', arch);
            const classifier = lib.downloads.classifiers[nativeKey];
            if (classifier?.path) {
              nativeJars.push(path.join(librariesDir, classifier.path));
            }
          }
        }
      }

      // Fallback: scan librariesDir for any natives-<platform> jar
      if (nativeJars.length === 0 && fs.existsSync(librariesDir)) {
        const scanDir = (dir: string) => {
          const entries = fs.readdirSync(dir, { withFileTypes: true });
          for (const e of entries) {
            const full = path.join(dir, e.name);
            if (e.isDirectory()) {
              scanDir(full);
            } else if (e.name.includes('natives') && e.name.includes(platform) && e.name.endsWith('.jar')) {
              nativeJars.push(full);
            }
          }
        };
        scanDir(librariesDir);
      }

      const nativeExt = process.platform === 'win32' ? '.dll' : process.platform === 'darwin' ? '.dylib' : '.so';

      for (const jarPath of nativeJars) {
        if (fs.existsSync(jarPath)) {
          try {
            const zip = new AdmZip(jarPath);
            for (const entry of zip.getEntries()) {
              if (!entry.isDirectory && !entry.entryName.startsWith('META-INF') && entry.entryName.toLowerCase().endsWith(nativeExt)) {
                const filename = path.basename(entry.entryName);
                const destPath = path.join(nativesDir, filename);
                if (!fs.existsSync(destPath)) {
                  fs.writeFileSync(destPath, entry.getData());
                }
              }
            }
          } catch (err) {
            console.error('[LaunchService] Error extracting natives from:', jarPath, err);
          }
        }
      }
    } catch (err) {
      console.error('[LaunchService] Error ensuring natives:', err);
    }
  }

  public async launch(instanceId: string): Promise<void> {
    if (this.runningProcesses.has(instanceId)) {
      throw new Error('Данный инстанс уже запущен');
    }

    const instance = InstancesService.getInstance().getById(instanceId);
    if (!instance) {
      throw new Error(`Инстанс ${instanceId} не найден`);
    }

    const account = AccountsService.getInstance().getActive();
    if (!account) {
      throw new Error('Не выбран активный аккаунт. Добавьте или выберите аккаунт в меню.');
    }

    const settings = SettingsService.getInstance().getSettings();
    const instanceDir = InstancesService.getInstance().getInstanceDir(instanceId);
    const sharedDir = settings.gameDirectory;

    this.emitLog('info', `[Launcher] Подготовка к запуску сборки "${instance.name}" (${instance.gameVersion})...`);
    this.emitStateChange(instanceId, true);

    try {
      // 1. Prepare files

      const { classpath, mainClass, assetIndexId, gameArgs: customGame, jvmArgs: customJvm } = await GameInstallerService.getInstance().prepareGameFiles(
        instance,
        (p) => this.emitProgress(p)
      );

      const minRam = settings.minMemoryMb || 1024;
      const maxRam = instance.customMemoryMb || settings.maxMemoryMb || 4096;
      const librariesDir = path.join(sharedDir, 'libraries');
      const nativesDir = path.join(sharedDir, 'versions', instance.gameVersion, 'natives');
      const classpathStr = classpath.join(path.delimiter);

      if (!fs.existsSync(nativesDir)) {
        fs.mkdirSync(nativesDir, { recursive: true });
      }

      // Load version JSON for Java requirements and library classifiers
      const versionJsonPath = path.join(sharedDir, 'versions', instance.gameVersion, `${instance.gameVersion}.json`);
      let versionJson: any = null;
      if (fs.existsSync(versionJsonPath)) {
        try {
          versionJson = JSON.parse(fs.readFileSync(versionJsonPath, 'utf8'));
        } catch (err) {
          console.error('[LaunchService] Failed to parse version.json:', err);
        }
      }

      // Unpack native libraries for LWJGL/JInput
      this.ensureNatives(sharedDir, instance.gameVersion, versionJson, nativesDir);

      // Token substitution logic
      const replaceTokens = (arg: string | any) => {
        if (typeof arg !== 'string') return '';
        return arg
          .replace(/\$\{auth_player_name\}/g, account.username)
          .replace(/\$\{version_name\}/g, instance.gameVersion)
          .replace(/-DignoreList=([^\s]+)/g, '-DignoreList=$1,client-' + instance.gameVersion + '.jar')
          .replace(/\$\{game_directory\}/g, instanceDir)
          .replace(/\$\{assets_root\}/g, path.join(sharedDir, 'assets'))
          .replace(/\$\{assets_index_name\}/g, assetIndexId)
          .replace(/\$\{auth_uuid\}/g, account.uuid.replace(/-/g, ''))
          .replace(/\$\{auth_access_token\}/g, account.accessToken || '0')
          .replace(/\$\{user_type\}/g, account.type === 'elyby' ? 'mojang' : 'legacy')
          .replace(/\$\{version_type\}/g, 'HirokiLauncher')
          .replace(/\$\{resolution_width\}/g, '854')
          .replace(/\$\{resolution_height\}/g, '480')
          .replace(/\$\{user_properties\}/g, '{}')
          .replace(/\$\{auth_session\}/g, account.accessToken || '0')
          .replace(/\$\{library_directory\}/g, librariesDir)
          .replace(/\$\{classpath_separator\}/g, path.delimiter)
          .replace(/\$\{natives_directory\}/g, nativesDir)
          .replace(/\$\{launcher_name\}/g, 'HirokiLauncher')
          .replace(/\$\{launcher_version\}/g, '2.0.0');
      };

      // 2. Build JVM Args
      const jvmArgs: string[] = [];
      jvmArgs.push(`-Xms${minRam}M`);
      jvmArgs.push(`-Xmx${maxRam}M`);

      if (settings.customJvmArgs) {
        jvmArgs.push(...settings.customJvmArgs.split(' ').filter(Boolean));
      }

      // Start local proxy if upstream requires auth
      let activeLocalProxy: LocalProxy | null = null;
      const proxyUrlStr = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
      if (proxyUrlStr) {
        try {
          const proxyUrl = new URL(proxyUrlStr);
          if (proxyUrl.username && proxyUrl.password) {
            activeLocalProxy = new LocalProxy();
            const localPort = await activeLocalProxy.start(proxyUrlStr);
            jvmArgs.push(`-Dhttp.proxyHost=127.0.0.1`, `-Dhttp.proxyPort=${localPort}`);
            jvmArgs.push(`-Dhttps.proxyHost=127.0.0.1`, `-Dhttps.proxyPort=${localPort}`);
            this.emitLog('info', `[Launcher] Запущен локальный прокси на порту ${localPort} для игры`);
          } else {
            jvmArgs.push(`-Dhttp.proxyHost=${proxyUrl.hostname}`, `-Dhttp.proxyPort=${proxyUrl.port}`);
            jvmArgs.push(`-Dhttps.proxyHost=${proxyUrl.hostname}`, `-Dhttps.proxyPort=${proxyUrl.port}`);
          }
        } catch (e) {
          console.error('[Launcher] Failed to parse proxy for JVM:', e);
        }
      }

      // Ely.by authlib-injector
      if (account.type === 'elyby') {
        const authlibPath = await this.ensureAuthlibInjector();
        jvmArgs.push(`-javaagent:${authlibPath}=https://authserver.ely.by/api/authlib-injector`);
      }


      const standardGameArgs = [
          '--username', account.username,
          '--version', instance.gameVersion,
          '--gameDir', instanceDir,
          '--assetsDir', path.join(sharedDir, 'assets'),
          '--assetIndex', assetIndexId,
          '--uuid', account.uuid.replace(/-/g, ''),
          '--accessToken', account.accessToken || '0',
          '--userType', account.type === 'elyby' ? 'mojang' : 'legacy',
          '--versionType', 'HirokiLauncher',
      ];

      let gameArgs: string[] = [];

      if (customJvm || customGame) {
        // MODERN FORGE / NEOFORGE

        jvmArgs.push(`-Djava.library.path=${nativesDir}`);
        jvmArgs.push('-cp', classpathStr);

        if (customJvm) {
          for (const arg of customJvm) {
            if (typeof arg === 'string') {
              jvmArgs.push(replaceTokens(arg));
            }
          }
        }

        jvmArgs.push(mainClass);

        const hasLegacyMinecraftArgs = customGame && customGame.some(a => typeof a === 'string' && a.includes('${auth_player_name}'));
        
        if (!hasLegacyMinecraftArgs) {
          gameArgs = [...standardGameArgs];
        } else {
          gameArgs = []; // Legacy arguments already contain all standard tokens
        }

        if (customGame) {
          for (const arg of customGame) {
            if (typeof arg === 'string') {
              gameArgs.push(replaceTokens(arg));
            }
          }
        }
      } else {
        // VANILLA / FABRIC / QUILT
        jvmArgs.push(`-Djava.library.path=${nativesDir}`);
        jvmArgs.push('-cp', classpathStr);
        jvmArgs.push(mainClass);

        gameArgs = [...standardGameArgs];
      }

      // Fix for driftwm/Wayland: AWT early display in NeoForge freezes in non-reparenting WMs
      jvmArgs.push('-Dfml.earlyprogresswindow=false');

      // Auto-detect and resolve matching Java runtime for Minecraft version
      const resolvedJava = await JavaService.getInstance().resolveJavaExecutable(
        instance.customJavaPath,
        instance.gameVersion,
        versionJson,
        settings.javaPath
      );

      if (resolvedJava.warning) {
        this.emitLog('warn', `[Launcher] ${resolvedJava.warning}`);
      }

      const javaExecutable = resolvedJava.path;
      const fullArgs = [...jvmArgs, ...gameArgs];

      this.emitLog('info', `[Launcher] Запуск JVM (Java ${resolvedJava.majorVersion || 'Auto'}): ${javaExecutable}`);
      this.emitLog('debug', `[Launcher] Аргументы: ${fullArgs.join(' ')}`);

      // 4. Spawn game process
      fs.appendFileSync('/tmp/hiroki-game.log', '[SPAWN ARGS]\n' + fullArgs.join('\n') + '\n');
      const child = spawn(javaExecutable, fullArgs, {
        cwd: instanceDir,
        env: {
          ...process.env,
          _JAVA_AWT_WM_NONREPARENTING: '1',
          WLR_NO_HARDWARE_CURSORS: '1'
        },
      });

      this.runningProcesses.set(instanceId, child);

      // Update last played timestamp
      InstancesService.getInstance().update(instanceId, { lastPlayedAt: Date.now() });

      child.stdout.on('data', (data: Buffer) => {
        const text = data.toString('utf-8');
        fs.appendFileSync('/tmp/hiroki-game.log', `[STDOUT] ${text}`);
        this.emitLog('info', text.trimEnd());
      });

      child.stderr.on('data', (data: Buffer) => {
        const text = data.toString('utf-8');
        fs.appendFileSync('/tmp/hiroki-game.log', `[STDERR] ${text}`);
        this.emitLog('warn', text.trimEnd());
      });

      child.on('error', (err) => {
        if (activeLocalProxy) activeLocalProxy.stop();
        fs.appendFileSync('/tmp/hiroki-game.log', `[Error] ${err.message}\n`);
        console.error(`[Launcher] Process error for ${instance.name}:`, err);
        this.emitLog('error', `[Launcher Error] ${err.message}`);
        this.runningProcesses.delete(instanceId);
        this.emitStateChange(instanceId, false, -1);
      });

      child.on('close', (code) => {
        if (activeLocalProxy) activeLocalProxy.stop();
        fs.appendFileSync('/tmp/hiroki-game.log', `[Close] Exit code: ${code}\n`);
        this.emitLog('info', `[Launcher] Игра завершена с кодом: ${code}`);
        this.runningProcesses.delete(instanceId);
        this.emitStateChange(instanceId, false, code ?? 0);
      });
    } catch (error) {
      console.error(`[Launcher] Launch failed for ${instanceId}:`, error);
      this.emitLog('error', `[Launch Failed] ${error instanceof Error ? error.stack : String(error)}`);
      fs.appendFileSync('/tmp/hiroki-game.log', '\nLAUNCH CRASH:\n' + (error instanceof Error ? error.stack : String(error)) + '\n');
      this.emitStateChange(instanceId, false, -1);
      throw error;
    }
  }

  public kill(instanceId: string): boolean {
    const child = this.runningProcesses.get(instanceId);
    if (child) {
      this.emitLog('warn', `[Launcher] Принудительная остановка процесса ${instanceId}...`);
      child.kill('SIGTERM');
      this.runningProcesses.delete(instanceId);
      this.emitStateChange(instanceId, false, 0);
      return true;
    }
    return false;
  }
}
