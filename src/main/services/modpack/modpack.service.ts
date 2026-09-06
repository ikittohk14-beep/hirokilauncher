import fs from 'node:fs';
import path from 'node:path';
import AdmZip from 'adm-zip';
import type { ContentVersion, InstanceMeta, ModLoaderType } from '../../../preload/types';
import { InstancesService } from '../storage/instances.service';
import { DownloaderService, DownloadTask } from '../downloader/downloader.service';
import { SettingsService } from '../storage/settings.service';

interface ModrinthIndexFile {
  path: string;
  hashes: {
    sha1?: string;
    sha512?: string;
  };
  env?: {
    client?: 'required' | 'optional' | 'unsupported';
  };
  downloads: string[];
  fileSize?: number;
}

interface ModrinthIndex {
  formatVersion: number;
  game: string;
  versionId: string;
  name: string;
  summary?: string;
  files: ModrinthIndexFile[];
  dependencies: Record<string, string>;
}

interface CurseForgeManifest {
  minecraft: {
    version: string;
    modLoaders: { id: string; primary: boolean }[];
  };
  manifestType: string;
  manifestVersion: number;
  name: string;
  version: string;
  author: string;
  files: { projectID: number; fileID: number; required: boolean }[];
  overrides: string;
}

export class ModpackService {
  private static instance: ModpackService;

  public static getInstance(): ModpackService {
    if (!ModpackService.instance) {
      ModpackService.instance = new ModpackService();
    }
    return ModpackService.instance;
  }

  /**
   * Installs a modpack from either Modrinth (.mrpack) or CurseForge (.zip)
   */
  public async installModpack(version: ContentVersion, customName?: string): Promise<InstanceMeta> {
    const tempDir = path.join(SettingsService.getInstance().getBaseDir(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const archivePath = path.join(tempDir, `modpack-${Date.now()}-${version.filename}`);

    try {
      // 1. Download modpack archive
      await DownloaderService.getInstance().downloadFile({
        url: version.downloadUrl,
        destPath: archivePath,
        size: version.size,
      });

      const zip = new AdmZip(archivePath);
      const zipEntries = zip.getEntries();

      // Check if Modrinth (.mrpack)
      const mrIndexEntry = zipEntries.find((e) => e.entryName === 'modrinth.index.json');
      if (mrIndexEntry) {
        return await this.installModrinthModpack(zip, mrIndexEntry, customName || version.name);
      }

      // Check if CurseForge (.zip)
      const cfManifestEntry = zipEntries.find((e) => e.entryName === 'manifest.json');
      if (cfManifestEntry) {
        return await this.installCurseForgeModpack(zip, cfManifestEntry, customName || version.name);
      }

      throw new Error('Архив не является поддерживаемым модпаком Modrinth или CurseForge');
    } catch (error) {
      console.error('[ModpackService] Modpack installation failed:', error);
      throw error;
    } finally {
      if (fs.existsSync(archivePath)) {
        try {
          fs.unlinkSync(archivePath);
        } catch {}
      }
    }
  }

  private async installModrinthModpack(
    zip: AdmZip,
    indexEntry: AdmZip.IZipEntry,
    packName: string
  ): Promise<InstanceMeta> {
    const indexData = JSON.parse(indexEntry.getData().toString('utf-8')) as ModrinthIndex;

    const gameVersion = indexData.dependencies['minecraft'] || '1.20.1';
    let loaderType: ModLoaderType = 'vanilla';
    let loaderVersion: string | undefined;

    if (indexData.dependencies['fabric-loader']) {
      loaderType = 'fabric';
      loaderVersion = indexData.dependencies['fabric-loader'];
    } else if (indexData.dependencies['forge']) {
      loaderType = 'forge';
      loaderVersion = indexData.dependencies['forge'];
    }

    // 1. Create instance
    const instance = InstancesService.getInstance().create({
      name: packName || indexData.name,
      gameVersion,
      loaderType,
      loaderVersion,
    });

    const instanceDir = InstancesService.getInstance().getInstanceDir(instance.id);

    // 2. Download files declared in index
    const tasks: DownloadTask[] = [];
    for (const file of indexData.files) {
      if (file.env?.client === 'unsupported') continue;
      if (file.downloads.length > 0) {
        const destPath = path.join(instanceDir, file.path);
        tasks.push({
          url: file.downloads[0]!,
          destPath,
          sha1: file.hashes.sha1,
          sha512: file.hashes.sha512,
          size: file.fileSize,
        });
      }
    }

    if (tasks.length > 0) {
      await DownloaderService.getInstance().downloadBatch(tasks, 'Загрузка модов из сборки...', 10);
    }

    // 3. Extract overrides
    const overridesPrefix = 'overrides/';
    const clientOverridesPrefix = 'client-overrides/';

    for (const entry of zip.getEntries()) {
      if (entry.entryName.startsWith(overridesPrefix) && !entry.isDirectory) {
        const relative = entry.entryName.substring(overridesPrefix.length);
        const targetPath = path.join(instanceDir, relative);
        const dir = path.dirname(targetPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(targetPath, entry.getData());
      } else if (entry.entryName.startsWith(clientOverridesPrefix) && !entry.isDirectory) {
        const relative = entry.entryName.substring(clientOverridesPrefix.length);
        const targetPath = path.join(instanceDir, relative);
        const dir = path.dirname(targetPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(targetPath, entry.getData());
      }
    }

    return instance;
  }

  private async installCurseForgeModpack(
    zip: AdmZip,
    manifestEntry: AdmZip.IZipEntry,
    packName: string
  ): Promise<InstanceMeta> {
    const manifest = JSON.parse(manifestEntry.getData().toString('utf-8')) as CurseForgeManifest;
    const gameVersion = manifest.minecraft.version || '1.20.1';

    let loaderType: ModLoaderType = 'vanilla';
    let loaderVersion: string | undefined;

    const primaryLoader = manifest.minecraft.modLoaders.find((l) => l.primary) || manifest.minecraft.modLoaders[0];
    if (primaryLoader) {
      if (primaryLoader.id.startsWith('fabric-')) {
        loaderType = 'fabric';
        loaderVersion = primaryLoader.id.replace('fabric-', '');
      } else if (primaryLoader.id.startsWith('forge-')) {
        loaderType = 'forge';
        loaderVersion = primaryLoader.id.replace('forge-', '');
      }
    }

    // 1. Create instance
    const instance = InstancesService.getInstance().create({
      name: packName || manifest.name,
      gameVersion,
      loaderType,
      loaderVersion,
    });

    const instanceDir = InstancesService.getInstance().getInstanceDir(instance.id);
    const modsDir = path.join(instanceDir, 'mods');
    if (!fs.existsSync(modsDir)) {
      fs.mkdirSync(modsDir, { recursive: true });
    }

    // 2. Fetch file info for CurseForge mods
    const apiKey = '$2a$10$bL4bIL5pUWqfcO7KQTnMReakwtfHbNKh6v1uTpKlzhwoueEJQnPnm';
    const tasks: DownloadTask[] = [];

    // Process in batches of 10 to fetch URLs
    for (const mod of manifest.files) {
      try {
        const fileUrl = `https://api.curseforge.com/v1/mods/${mod.projectID}/files/${mod.fileID}`;
        const resp = await fetch(fileUrl, {
          headers: {
            'x-api-key': apiKey,
            'User-Agent': 'HirokiLauncher/1.0',
          },
        });

        if (resp.ok) {
          const fileData = (await resp.json()) as {
            data: {
              id: number;
              fileName: string;
              downloadUrl: string | null;
              fileLength: number;
            };
          };

          const downloadUrl =
            fileData.data.downloadUrl ||
            `https://mediafilez.forgecdn.net/files/${Math.floor(fileData.data.id / 1000)}/${fileData.data.id % 1000}/${fileData.data.fileName}`;

          tasks.push({
            url: downloadUrl,
            destPath: path.join(modsDir, fileData.data.fileName),
            size: fileData.data.fileLength,
          });
        }
      } catch (err) {
        console.error(`[ModpackService] Failed to resolve CurseForge file ${mod.projectID}:${mod.fileID}:`, err);
      }
    }

    if (tasks.length > 0) {
      await DownloaderService.getInstance().downloadBatch(tasks, 'Загрузка модов CurseForge...', 8);
    }

    // 3. Extract overrides
    const overridesName = manifest.overrides || 'overrides';
    const prefix = `${overridesName}/`;

    for (const entry of zip.getEntries()) {
      if (entry.entryName.startsWith(prefix) && !entry.isDirectory) {
        const relative = entry.entryName.substring(prefix.length);
        const targetPath = path.join(instanceDir, relative);
        const dir = path.dirname(targetPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(targetPath, entry.getData());
      }
    }

    return instance;
  }
}
