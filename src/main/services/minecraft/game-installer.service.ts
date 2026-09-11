import fs from 'node:fs';
import { spawn } from 'node:child_process';
import path from 'node:path';
import type { InstanceMeta, LaunchProgress } from '../../../preload/types';
import { SettingsService } from '../storage/settings.service';
import { DownloaderService, DownloadTask } from '../downloader/downloader.service';

interface VersionRule {
  action: 'allow' | 'disallow';
  os?: {
    name?: string;
    arch?: string;
  };
}

interface VersionLibrary {
  name: string;
  downloads?: {
    artifact?: {
      path: string;
      sha1: string;
      size: number;
      url: string;
    };
    classifiers?: Record<
      string,
      {
        path: string;
        sha1: string;
        size: number;
        url: string;
      }
    >;
  };
  natives?: Record<string, string>;
  rules?: VersionRule[];
  url?: string; // Maven url for Fabric/Forge
}

interface MojangVersionDetails {
  id: string;
  mainClass: string;
  assetIndex: {
    id: string;
    sha1: string;
    size: number;
    totalSize: number;
    url: string;
  };
  downloads: {
    client: {
      sha1: string;
      size: number;
      url: string;
    };
  };
  libraries: VersionLibrary[];
  minecraftArguments?: string;
  arguments?: {
    game?: (string | { rules?: VersionRule[]; value: string | string[] })[];
    jvm?: (string | { rules?: VersionRule[]; value: string | string[] })[];
  };
}

interface AssetIndexJson {
  objects: Record<string, { hash: string; size: number }>;
}

export class GameInstallerService {
  private static instance: GameInstallerService;

  public static getInstance(): GameInstallerService {
    if (!GameInstallerService.instance) {
      GameInstallerService.instance = new GameInstallerService();
    }
    return GameInstallerService.instance;
  }

  public getSharedGameDir(): string {
    const settings = SettingsService.getInstance().getSettings();
    return settings.gameDirectory;
  }

  private getMojangPlatform(): 'windows' | 'osx' | 'linux' {
    if (process.platform === 'win32') return 'windows';
    if (process.platform === 'darwin') return 'osx';
    return 'linux';
  }

  private isRuleAllowed(rules?: VersionRule[]): boolean {
    if (!rules || rules.length === 0) return true;

    let allowed = false;
    const currentPlatform = this.getMojangPlatform();

    for (const rule of rules) {
      let matches = true;
      if (rule.os) {
        if (rule.os.name && rule.os.name !== currentPlatform) {
          matches = false;
        }
      }

      if (matches) {
        allowed = rule.action === 'allow';
      }
    }

    return allowed;
  }

  /**
   * Fetches the detailed version manifest for a vanilla release
   */
  public async getVanillaVersionDetails(gameVersion: string): Promise<MojangVersionDetails> {
    const sharedDir = this.getSharedGameDir();
    const versionDir = path.join(sharedDir, 'versions', gameVersion);
    const jsonPath = path.join(versionDir, `${gameVersion}.json`);

    if (fs.existsSync(jsonPath)) {
      try {
        const content = fs.readFileSync(jsonPath, 'utf-8');
        return JSON.parse(content) as MojangVersionDetails;
      } catch (e) {
        console.error(`[GameInstaller] Failed reading cached version json for ${gameVersion}:`, e);
      }
    }

    // Download from Mojang
    const manifestResp = await fetch('https://piston-meta.mojang.com/mc/game/version_manifest_v2.json');
    if (!manifestResp.ok) {
      throw new Error(`Failed to fetch version manifest from Mojang: ${manifestResp.status}`);
    }

    const manifest = (await manifestResp.json()) as { versions: { id: string; url: string }[] };
    const versionEntry = manifest.versions.find((v) => v.id === gameVersion);
    if (!versionEntry) {
      throw new Error(`Version ${gameVersion} not found in Mojang manifest`);
    }

    const detailResp = await fetch(versionEntry.url);
    if (!detailResp.ok) {
      throw new Error(`Failed to fetch details for ${gameVersion}: ${detailResp.status}`);
    }

    const details = (await detailResp.json()) as MojangVersionDetails;
    if (!fs.existsSync(versionDir)) {
      fs.mkdirSync(versionDir, { recursive: true });
    }
    fs.writeFileSync(jsonPath, JSON.stringify(details, null, 2), 'utf-8');
    return details;
  }

  /**
   * Installs and prepares all assets, client jar, and libraries for an instance
   */
  public async prepareGameFiles(
    instance: InstanceMeta,
    onProgress?: (progress: LaunchProgress) => void
  ): Promise<{ classpath: string[]; mainClass: string; assetIndexId: string; gameArgs?: any[]; jvmArgs?: any[] }> {
    const sharedDir = this.getSharedGameDir();
    const librariesDir = path.join(sharedDir, 'libraries');
    const assetsDir = path.join(sharedDir, 'assets');
    const versionsDir = path.join(sharedDir, 'versions');

    // 1. Get Vanilla details
    if (onProgress) onProgress({ step: 'Получение манифеста версии...', percentage: 5 });
    const vanillaDetails = await this.getVanillaVersionDetails(instance.gameVersion);

    // 2. Download client.jar
    const clientJarPath = path.join(versionsDir, instance.gameVersion, `${instance.gameVersion}.jar`);
    if (onProgress) onProgress({ step: 'Загрузка игрового клиента...', percentage: 10 });
    await DownloaderService.getInstance().downloadFile({
      url: vanillaDetails.downloads.client.url,
      destPath: clientJarPath,
      sha1: vanillaDetails.downloads.client.sha1,
      size: vanillaDetails.downloads.client.size,
    });

    // 3. Process libraries
    if (onProgress) onProgress({ step: 'Проверка библиотек игры...', percentage: 20 });
    const libraryTasks: DownloadTask[] = [];
    const classpath: string[] = [];

    for (const lib of vanillaDetails.libraries) {
      if (!this.isRuleAllowed(lib.rules)) continue;

      if (lib.downloads?.artifact) {
        const dest = path.join(librariesDir, lib.downloads.artifact.path);
        classpath.push(dest);
        libraryTasks.push({
          url: lib.downloads.artifact.url,
          destPath: dest,
          sha1: lib.downloads.artifact.sha1,
          size: lib.downloads.artifact.size,
        });
      }

      // Check platform natives
      if (lib.natives && lib.downloads?.classifiers) {
        const platform = this.getMojangPlatform();
        let nativeKey = lib.natives[platform] || `natives-${platform}`;
        const arch = process.arch === 'x64' ? '64' : '32';
        nativeKey = nativeKey.replace('${arch}', arch);
        const classifier = lib.downloads.classifiers[nativeKey];
        if (classifier) {
          const dest = path.join(librariesDir, classifier.path);
          classpath.push(dest);
          libraryTasks.push({
            url: classifier.url,
            destPath: dest,
            sha1: classifier.sha1,
            size: classifier.size,
          });
        }
      }
    }

    // Handle Fabric loader libraries if selected
    let mainClass = vanillaDetails.mainClass;
    if (instance.loaderType === 'fabric') {
      if (onProgress) onProgress({ step: 'Загрузка манифеста Fabric...', percentage: 35 });
      const fabricLoaderVersion = instance.loaderVersion || '0.16.9';
      const fabricUrl = `https://meta.fabricmc.net/v2/versions/loader/${instance.gameVersion}/${fabricLoaderVersion}/profile/json`;

      const fabricResp = await fetch(fabricUrl);
      if (fabricResp.ok) {
        const fabricProfile = (await fabricResp.json()) as {
          mainClass: string;
          libraries: { name: string; url: string }[];
        };
        mainClass = fabricProfile.mainClass || 'net.fabricmc.loader.impl.launch.knot.KnotClient';

        for (const fLib of fabricProfile.libraries) {
          // Maven coordinates name: "group:artifact:version"
          const parts = fLib.name.split(':');
          if (parts.length >= 3) {
            const groupPath = parts[0]!.replace(/\./g, '/');
            const artifact = parts[1]!;
            const version = parts[2]!;
            const relPath = `${groupPath}/${artifact}/${version}/${artifact}-${version}.jar`;
            const dest = path.join(librariesDir, relPath);
            const downloadUrl = `${fLib.url.endsWith('/') ? fLib.url : fLib.url + '/'}${relPath}`;

            classpath.push(dest);
            libraryTasks.push({
              url: downloadUrl,
              destPath: dest,
            });
          }
        }
      }
    }

    // Provide Vanilla jar
    // We copy it to Maven format so modern Forge/NeoForge can locate it easily.
    const clientJarMavenDir = path.join(librariesDir, 'net', 'minecraft', 'client', instance.gameVersion);
    const clientJarMavenPath = path.join(clientJarMavenDir, `client-${instance.gameVersion}.jar`);
    
    if (!fs.existsSync(clientJarMavenDir)) {
      fs.mkdirSync(clientJarMavenDir, { recursive: true });
    }
    
    if (fs.existsSync(clientJarPath) && !fs.existsSync(clientJarMavenPath)) {
      fs.copyFileSync(clientJarPath, clientJarMavenPath);
    }
    
    classpath.push(clientJarPath);
    

    // Download batch of libraries
    await DownloaderService.getInstance().downloadBatch(
      libraryTasks,
      'Загрузка библиотек...',
      8,
      onProgress
    );

    // 4. Process assets
    if (onProgress) onProgress({ step: 'Загрузка индексов ассетов...', percentage: 60 });
    const indexesDir = path.join(assetsDir, 'indexes');
    const objectsDir = path.join(assetsDir, 'objects');
    const assetIndexFile = path.join(indexesDir, `${vanillaDetails.assetIndex.id}.json`);

    await DownloaderService.getInstance().downloadFile({
      url: vanillaDetails.assetIndex.url,
      destPath: assetIndexFile,
      sha1: vanillaDetails.assetIndex.sha1,
    });

    const indexContent = fs.readFileSync(assetIndexFile, 'utf-8');
    const assetIndex = JSON.parse(indexContent) as AssetIndexJson;
    const assetTasks: DownloadTask[] = [];

    for (const [, obj] of Object.entries(assetIndex.objects)) {
      const prefix = obj.hash.substring(0, 2);
      const dest = path.join(objectsDir, prefix, obj.hash);

      if (!fs.existsSync(dest)) {
        assetTasks.push({
          url: `https://resources.download.minecraft.net/${prefix}/${obj.hash}`,
          destPath: dest,
          sha1: obj.hash,
          size: obj.size,
        });
      }
    }

    if (assetTasks.length > 0) {
      await DownloaderService.getInstance().downloadBatch(
        assetTasks,
        'Загрузка ассетов и звуков...',
        12,
        onProgress
      );
    }


    let gameArgs: any[] | undefined = undefined;
    let jvmArgs: any[] | undefined = undefined;

    if (instance.loaderType === 'forge' || instance.loaderType === 'neoforge') {
      const isForge = instance.loaderType === 'forge';
      const loaderVer = instance.loaderVersion;
      if (!loaderVer) throw new Error('Loader version is required for Forge/NeoForge');
      
      const toolsDir = path.join(sharedDir, 'tools');
      if (!fs.existsSync(toolsDir)) fs.mkdirSync(toolsDir, { recursive: true });

      let installerUrl = '';
      let installerName = '';
      let profileName = '';

      if (isForge) {
        installerName = `forge-${instance.gameVersion}-${loaderVer}-installer.jar`;
        installerUrl = `https://maven.minecraftforge.net/net/minecraftforge/forge/${instance.gameVersion}-${loaderVer}/${installerName}`;
        profileName = `${instance.gameVersion}-forge-${loaderVer}`;
      } else {
        installerName = `neoforge-${loaderVer}-installer.jar`;
        installerUrl = `https://maven.neoforged.net/releases/net/neoforged/neoforge/${loaderVer}/${installerName}`;
        profileName = `neoforge-${loaderVer}`;
      }

      const installerPath = path.join(toolsDir, installerName);

      if (!fs.existsSync(installerPath)) {
        if (onProgress) onProgress({ step: 'Загрузка установщика ' + instance.loaderType + '...', percentage: 70 });
        try { 
          await DownloaderService.getInstance().downloadFile({ url: installerUrl, destPath: installerPath }); 
        } catch (dlErr: any) { 
          throw new Error(`Failed to download installer: ${dlErr.message}`); 
        }
      }

      const profileJsonPath = path.join(sharedDir, 'versions', profileName, `${profileName}.json`);

      const profilesPath = path.join(sharedDir, 'launcher_profiles.json');
      if (!fs.existsSync(profilesPath)) {
        fs.writeFileSync(profilesPath, '{"profiles":{}}');
      }

      
      // Verification for corrupted installations
      let isInstalled = fs.existsSync(profileJsonPath);
      if (isInstalled) {
        if (isForge) {
          const forgeClientJar = path.join(sharedDir, 'libraries', 'net', 'minecraftforge', 'forge', `${instance.gameVersion}-${loaderVer}`, `forge-${instance.gameVersion}-${loaderVer}-client.jar`);
          if (!fs.existsSync(forgeClientJar)) {
            isInstalled = false;
            fs.unlinkSync(profileJsonPath);
          }
        } else {
          const neoClientJar = path.join(sharedDir, 'libraries', 'net', 'neoforged', 'neoforge', loaderVer, `neoforge-${loaderVer}-client.jar`);
          if (!fs.existsSync(neoClientJar)) {
            isInstalled = false;
            fs.unlinkSync(profileJsonPath);
          }
        }
      }

      if (!isInstalled) {
        if (onProgress) onProgress({ step: 'Установка ' + instance.loaderType + ' (это может занять пару минут)...', percentage: 75 });
        await new Promise<void>((resolve, reject) => {
          const child = spawn('java', ['-Xmx4G', '-jar', installerPath, '--installClient', sharedDir]);
          child.on('error', reject);
          child.on('close', (code: number) => {
            if (code === 0) resolve();
            else reject(new Error(`Installer exited with code ${code}`));
          });
        });
      }

      if (fs.existsSync(profileJsonPath)) {
        const profile = JSON.parse(fs.readFileSync(profileJsonPath, 'utf8'));
        mainClass = profile.mainClass;
        
        if (profile.arguments) {
          gameArgs = profile.arguments.game;
          jvmArgs = profile.arguments.jvm;
        } else if (profile.minecraftArguments) {
          gameArgs = profile.minecraftArguments.split(' ');
        }

        if (profile.libraries) {
          for (const lib of profile.libraries) {
            if (lib.downloads?.artifact) {
              const dest = path.join(librariesDir, lib.downloads.artifact.path);
              classpath.push(dest);
              if (!fs.existsSync(dest)) {
                await DownloaderService.getInstance().downloadFile({
                  url: lib.downloads.artifact.url,
                  destPath: dest
                });
              }
            } else if (lib.name) {
              const parts = lib.name.split(':');
              if (parts.length >= 3) {
                const groupPath = parts[0].replace(/\./g, '/');
                const artifact = parts[1];
                const version = parts[2];
                const relPath = `${groupPath}/${artifact}/${version}/${artifact}-${version}.jar`;
                const dest = path.join(librariesDir, relPath);
                classpath.push(dest);
              }
            }
          }
        }
      } else {
        throw new Error('Установщик не создал profile JSON');
      }
    }

    if (onProgress) onProgress({ step: 'Готово к запуску', percentage: 100 });

    return {
      classpath: Array.from(new Set(classpath)),
      mainClass,
      assetIndexId: vanillaDetails.assetIndex.id,
      gameArgs,
      jvmArgs,
    };
  }
}
