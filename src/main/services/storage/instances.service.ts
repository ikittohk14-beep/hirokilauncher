import crypto from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs';
import { spawn } from 'node:child_process';
import { BrowserWindow, shell } from 'electron';
import AdmZip from 'adm-zip';
import { exec } from 'node:child_process';
import type { InstanceMeta, InstalledModFile } from '../../../preload/types';
import { SettingsService } from './settings.service';

export class InstancesService {
  private static instance: InstancesService;
  private modsCache = new Map<string, any>();

  public static getInstance(): InstancesService {
    if (!InstancesService.instance) {
      InstancesService.instance = new InstancesService();
    }
    return InstancesService.instance;
  }

  public getInstancesBaseDir(): string {
    const settings = SettingsService.getInstance().getSettings();
    const instancesDir = path.join(settings.gameDirectory, 'instances');
    if (!fs.existsSync(instancesDir)) {
      try {
        fs.mkdirSync(instancesDir, { recursive: true });
      } catch (error) {
        console.error('[InstancesService] Failed to create instances directory:', error);
      }
    }
    return instancesDir;
  }

  public getInstanceDir(instanceId: string): string {
    return path.join(this.getInstancesBaseDir(), instanceId);
  }

  public getAll(): InstanceMeta[] {
    const baseDir = this.getInstancesBaseDir();
    const list: InstanceMeta[] = [];

    try {
      if (!fs.existsSync(baseDir)) return [];

      console.log("[InstancesService] Scanning dir:", baseDir); const entries = fs.readdirSync(baseDir, { withFileTypes: true }); console.log("[InstancesService] Found entries:", entries.length);
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const instanceDir = path.join(baseDir, entry.name);
          const configPath = path.join(instanceDir, 'instance.json');
          if (fs.existsSync(configPath)) {
            try {
              const content = fs.readFileSync(configPath, 'utf-8');
              const meta = JSON.parse(content) as InstanceMeta;
              list.push(meta);
            } catch (readError) {
              console.error(`[InstancesService] Error reading ${configPath}:`, readError);
            }
          }
        }
      }
    } catch (error) {
      console.error('[InstancesService] Failed to scan instances:', error);
    }

    return list.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  }

  private syncInstalledContent(meta: InstanceMeta, instanceDir: string): boolean {
    if (!meta.installedContent) return false;
    let changed = false;
    const folders = ['mods', 'resourcepacks', 'shaderpacks', 'datapacks', 'saves'];
    for (const filename of Object.keys(meta.installedContent)) {
      const cleanFilename = filename.replace(/\.disabled$/, '');
      let exists = false;
      for (const folder of folders) {
        if (
          fs.existsSync(path.join(instanceDir, folder, filename)) ||
          fs.existsSync(path.join(instanceDir, folder, cleanFilename)) ||
          fs.existsSync(path.join(instanceDir, folder, `${cleanFilename}.disabled`))
        ) {
          exists = true;
          break;
        }
      }
      if (!exists) {
        delete meta.installedContent[filename];
        changed = true;
      }
    }
    if (changed) {
      const configPath = path.join(instanceDir, 'instance.json');
      try {
        fs.writeFileSync(configPath, JSON.stringify(meta, null, 2));
      } catch (err) {
        console.error(`[InstancesService] Failed to save synced instance.json for ${meta.id}:`, err);
      }
    }
    return changed;
  }

  public getById(id: string): InstanceMeta | null {
    const instanceDir = this.getInstanceDir(id);
    const configPath = path.join(instanceDir, 'instance.json');
    try {
      if (fs.existsSync(configPath)) {
        const content = fs.readFileSync(configPath, 'utf-8');
        const meta = JSON.parse(content) as InstanceMeta;
        return meta;
      }
    } catch (error) {
      console.error(`[InstancesService] Failed to get instance ${id}:`, error);
    }
    return null;
  }

  public create(meta: Omit<InstanceMeta, 'id' | 'createdAt'>): InstanceMeta {
    const id = `inst_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const instanceDir = this.getInstanceDir(id);

    try {
      fs.mkdirSync(instanceDir, { recursive: true });
      fs.mkdirSync(path.join(instanceDir, 'mods'), { recursive: true });
      fs.mkdirSync(path.join(instanceDir, 'resourcepacks'), { recursive: true });
      fs.mkdirSync(path.join(instanceDir, 'shaderpacks'), { recursive: true });
      fs.mkdirSync(path.join(instanceDir, 'saves'), { recursive: true });

      const newInstance: InstanceMeta = {
        ...meta,
        id,
        createdAt: Date.now(),
      };

      fs.writeFileSync(
        path.join(instanceDir, 'instance.json'),
        JSON.stringify(newInstance, null, 2),
        'utf-8'
      );

      return newInstance;
    } catch (error) {
      console.error('[InstancesService] Failed to create instance:', error);
      throw error;
    }
  }

  public importZip(zipPath: string, webContents?: any): Promise<InstanceMeta> {
    return new Promise(async (resolve, reject) => {
      
      
      
      

      console.log('[InstancesService] Starting importZip for:', zipPath);

      const sendProgress = (percentage: number, text: string) => {
        if (webContents) {
          webContents.send('instances:importProgress', { percentage, text });
        } else {
          
          const windows = BrowserWindow.getAllWindows();
          if (windows.length > 0) {
            windows[0].webContents.send('instances:importProgress', { percentage, text });
          }
        }
      };

      try {
        const id = `inst_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
        const instanceDir = this.getInstanceDir(id);
        fs.mkdirSync(instanceDir, { recursive: true });

        console.log('[InstancesService] Created dir:', instanceDir);
        sendProgress(0, 'Подготовка к распаковке...');

        let totalFiles = 100;
        let extracted = 0;

        console.log('[InstancesService] Spawning unzip...');
        const unzip = spawn('unzip', ['-o', zipPath, '-d', instanceDir]);

        unzip.stdout.on('data', (data: Buffer) => {
          const chunk = data.toString();
          const lines = (chunk.match(/\n/g) || []).length;
          extracted += lines;
          let percentage = Math.round((extracted / totalFiles) * 100);
          if (percentage > 99) percentage = 99;
          sendProgress(percentage, `Распаковка архива...`);
        });

        unzip.stderr.on('data', (data: Buffer) => {
          console.warn('[unzip warn]', data.toString());
        });

        unzip.on('error', (err: any) => {
          console.error('[unzip error event]', err);
          reject(err);
        });

        unzip.on('close', (code: number) => {
          console.log('[InstancesService] unzip closed with code:', code);
          if (code !== 0 && code !== 1) { 
             reject(new Error(`unzip failed with code ${code}`));
             return;
          }

          sendProgress(100, 'Завершение...');

          try {
            const entries = fs.readdirSync(instanceDir);
            if (entries.length === 1) {
              const singleEntryPath = path.join(instanceDir, entries[0]);
              if (fs.statSync(singleEntryPath).isDirectory()) {
                console.log('[InstancesService] Flattening single folder:', singleEntryPath);
                const subEntries = fs.readdirSync(singleEntryPath);
                for (const se of subEntries) {
                  fs.renameSync(path.join(singleEntryPath, se), path.join(instanceDir, se));
                }
                fs.rmdirSync(singleEntryPath);
              }
            }

            const instanceJsonPath = path.join(instanceDir, 'instance.json');
            let meta: any;

            if (fs.existsSync(instanceJsonPath)) {
              console.log('[InstancesService] Found instance.json');
              meta = JSON.parse(fs.readFileSync(instanceJsonPath, 'utf8'));
              meta.id = id;
              meta.createdAt = Date.now();
            } else {
              console.log('[InstancesService] Generating new instance.json');
              meta = {
                id,
                name: path.basename(zipPath, '.zip') || 'Imported Instance',
                gameVersion: '1.20.1',
                loaderType: 'fabric',
                createdAt: Date.now()
              };
            }

            fs.writeFileSync(instanceJsonPath, JSON.stringify(meta, null, 2), 'utf-8');
            console.log('[InstancesService] Import complete:', meta.id);
            resolve(meta);
          } catch (postErr) {
            console.error('[InstancesService] Post-unzip error:', postErr);
            reject(postErr);
          }
        });

      } catch (err) {
        console.error('[InstancesService] Import Zip Error:', err);
        reject(err);
      }
    });
  }

  public update(id: string, updates: Partial<InstanceMeta>): InstanceMeta | null {
    const current = this.getById(id);
    if (!current) return null;

    const updated: InstanceMeta = { ...current, ...updates };
    try {
      const configPath = path.join(this.getInstanceDir(id), 'instance.json');
      fs.writeFileSync(configPath, JSON.stringify(updated, null, 2), 'utf-8');
      return updated;
    } catch (error) {
      console.error(`[InstancesService] Failed to update instance ${id}:`, error);
      return null;
    }
  }

  public delete(id: string): boolean {
    const instanceDir = this.getInstanceDir(id);
    try {
      if (fs.existsSync(instanceDir)) {
        fs.rmSync(instanceDir, { recursive: true, force: true });
        return true;
      }
    } catch (error) {
      console.error(`[InstancesService] Failed to delete instance ${id}:`, error);
    }
    return false;
  }

  private modsCacheLoaded = false;
  private getCacheFilePath(): string {
    return path.join(this.getInstancesBaseDir(), '.mods_meta_cache.json');
  }

  private loadModsCache(): void {
    if (this.modsCacheLoaded) return;
    this.modsCacheLoaded = true;
    try {
      const cachePath = this.getCacheFilePath();
      if (fs.existsSync(cachePath)) {
        const raw = JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
        for (const [k, v] of Object.entries(raw)) {
          this.modsCache.set(k, v);
        }
      }
    } catch (e) {
      console.warn('[InstancesService] Could not load mods cache:', e);
    }
  }

  private saveModsCache(): void {
    try {
      const cachePath = this.getCacheFilePath();
      const obj: Record<string, any> = {};
      for (const [k, v] of this.modsCache.entries()) {
        obj[k] = v;
      }
      fs.writeFileSync(cachePath, JSON.stringify(obj), 'utf-8');
    } catch (e) {
      console.warn('[InstancesService] Could not save mods cache:', e);
    }
  }

  public async getInstalledMods(instanceId: string, deepScan = false): Promise<InstalledModFile[]> {
    const instanceDir = this.getInstanceDir(instanceId);
    const result: InstalledModFile[] = [];
    
    const folderToType: Record<string, any> = {
      'mods': 'mod',
      'resourcepacks': 'resourcepack',
      'shaderpacks': 'shader',
      'datapacks': 'datapack',
      'saves': 'map'
    };

    try {
      this.loadModsCache();
      const meta = this.getById(instanceId);
      let cacheDirty = false;

      for (const [folder, type] of Object.entries(folderToType)) {
        const dirPath = path.join(instanceDir, folder);
        if (!fs.existsSync(dirPath)) {
          continue;
        }

        const files = fs.readdirSync(dirPath, { withFileTypes: true });
        for (const dirent of files) {
          const file = dirent.name;
          const lowerFile = file.toLowerCase();
          const isModFile = (type === 'map' && isDir) || 
                            lowerFile.endsWith('.jar') || 
                            lowerFile.endsWith('.jar.disabled') || 
                            lowerFile.endsWith('.zip') || 
                            lowerFile.endsWith('.zip.disabled') ||
                            lowerFile.endsWith('.mrpack');
          
          if (isModFile) {
            const filePath = path.join(dirPath, file);
            const isEnabled = !lowerFile.endsWith('.disabled');
            let cleanName = file.replace(/\.disabled$/i, '').replace(/\.jar$/i, '').replace(/\.zip$/i, '').replace(/\.mrpack$/i, '');
            let version = 'unknown';
            let description: string | undefined = undefined;
            let iconUrl: string | undefined = undefined;
            
            const cleanFilename = file.replace(/\.disabled$/i, '');
            const installData = meta?.installedContent?.[cleanFilename] || meta?.installedContent?.[file];

            // Only try to parse mod metadata if deepScan is requested (e.g. detailed InstanceView)
            if (deepScan && folder === 'mods' && (lowerFile.endsWith('.jar') || lowerFile.endsWith('.jar.disabled'))) {
              try {
                const stat = fs.statSync(filePath);
                const cacheKey = filePath;
                const cached = this.modsCache.get(cacheKey);
                
                if (cached && cached.mtime === stat.mtimeMs) {
                  cleanName = cached.data.cleanName;
                  version = cached.data.version;
                  description = cached.data.description;
                  iconUrl = cached.data.iconUrl;
                } else {
                  const zip = new AdmZip(filePath);
                  const fabricEntry = zip.getEntry('fabric.mod.json');
                  if (fabricEntry) {
                    const data = JSON.parse(fabricEntry.getData().toString('utf-8'));
                    cleanName = data.name || data.id || cleanName;
                    version = data.version || version;
                    description = data.description;
                    if (data.icon) {
                      let iconPath = typeof data.icon === 'string' ? data.icon : data.icon['128x128'] || data.icon['64x64'] || data.icon['32x32'];
                      if (iconPath) {
                        if (iconPath.startsWith('/')) iconPath = iconPath.slice(1);
                        const iconEntry = zip.getEntry(iconPath);
                        if (iconEntry) {
                          iconUrl = 'data:image/png;base64,' + iconEntry.getData().toString('base64');
                        }
                      }
                    }
                  } else {
                    const forgeEntry = zip.getEntry('META-INF/mods.toml');
                    if (forgeEntry) {
                      const text = forgeEntry.getData().toString('utf-8');
                      const nameMatch = text.match(/displayName\s*=\s*"([^"]+)"/);
                      const descMatch = text.match(/description\s*=\s*'([^']+)'|description\s*=\s*"([^"]+)"|description\s*=\s*'''([\s\S]*?)'''/);
                      cleanName = nameMatch ? nameMatch[1] : cleanName;
                      if (descMatch) description = descMatch[1] || descMatch[2] || descMatch[3];
                      const versionMatch = text.match(/version\s*=\s*"([^"]+)"/);
                      if (versionMatch && versionMatch[1] !== '${file.jarVersion}') version = versionMatch[1];
                    }
                  }
                  
                  // Save to cache
                  this.modsCache.set(cacheKey, {
                    mtime: stat.mtimeMs,
                    data: { cleanName, version, description, iconUrl }
                  });
                  cacheDirty = true;
                }
              } catch(e) {}
              // Yield to event loop to keep Wayland heartbeats pumping
              await new Promise(r => setImmediate(r));
            }
            
            result.push({
              filename: file,
              name: cleanName,
              version: version,
              description: description,
              iconUrl: iconUrl,
              isEnabled: isEnabled,
              type: type,
              projectId: installData?.projectId,
              source: installData?.source || 'local',
              versionId: installData?.versionId
            } as any);
          }
        }
      }

      if (cacheDirty) {
        this.saveModsCache();
      }
    } catch (error) {
      console.error(`[InstancesService] Failed to read content for ${instanceId}:`, error);
    }

    return result;
  }

  public toggleMod(instanceId: string, filename: string, enabled: boolean): boolean {
    const folders = ['mods', 'resourcepacks', 'shaderpacks', 'datapacks', 'saves'];
    let modsDir = '';
    let currentPath = '';
    for (const folder of folders) {
      const p = path.join(this.getInstanceDir(instanceId), folder, filename);
      if (fs.existsSync(p)) {
        modsDir = path.join(this.getInstanceDir(instanceId), folder);
        currentPath = p;
        break;
      }
    }

    try {
      if (!currentPath || !fs.existsSync(currentPath)) return false;

      let targetFilename = filename;
      if (enabled && filename.endsWith('.disabled')) {
        targetFilename = filename.replace(/\.disabled$/, '');
      } else if (!enabled && !filename.endsWith('.disabled')) {
        targetFilename = `${filename}.disabled`;
      }

      if (targetFilename !== filename) {
        const targetPath = path.join(modsDir, targetFilename);
        fs.renameSync(currentPath, targetPath);
        return true;
      }

      return true;
    } catch (error) {
      console.error(`[InstancesService] Failed to toggle mod ${filename}:`, error);
      return false;
    }
  }

  public deleteMod(instanceId: string, filename: string): boolean {
    const instanceDir = this.getInstanceDir(instanceId);
    const folders = ['mods', 'resourcepacks', 'shaderpacks', 'datapacks', 'saves'];
    let deleted = false;
    
    try {
      for (const folder of folders) {
        const filePath = path.join(instanceDir, folder, filename);
        const disabledPath = path.join(instanceDir, folder, `${filename}.disabled`);
        
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          deleted = true;
          break;
        } else if (fs.existsSync(disabledPath)) {
          fs.unlinkSync(disabledPath);
          deleted = true;
          break;
        }
      }

      // Also clean up installedContent in instance.json
      const configPath = path.join(instanceDir, 'instance.json');
      if (fs.existsSync(configPath)) {
        const meta = JSON.parse(fs.readFileSync(configPath, 'utf-8')) as InstanceMeta;
        if (meta.installedContent) {
          const cleanFilename = filename.replace(/\.disabled$/, '');
          delete meta.installedContent[filename];
          delete meta.installedContent[cleanFilename];
          delete meta.installedContent[`${cleanFilename}.disabled`];
          fs.writeFileSync(configPath, JSON.stringify(meta, null, 2));
        }
      }
      return deleted;
    } catch (error) {
      console.error(`[InstancesService] Failed to delete mod ${filename}:`, error);
    }
    return false;
  }

  public addLocalMod(instanceId: string, sourceFilePath: string, type?: string): boolean {
    try {
      if (!fs.existsSync(sourceFilePath)) return false;

      const modsDir = path.join(this.getInstanceDir(instanceId), 'mods');
      if (!fs.existsSync(modsDir)) {
        fs.mkdirSync(modsDir, { recursive: true });
      }

      const filename = path.basename(sourceFilePath);
      const destPath = path.join(modsDir, filename);

      fs.copyFileSync(sourceFilePath, destPath);
      return true;
    } catch (error) {
      console.error(`[InstancesService] Failed to add local mod ${sourceFilePath}:`, error);
      return false;
    }
  }

  public openFolder(instanceId: string): void {
    const dir = this.getInstanceDir(instanceId);
    try {
      if (process.platform === 'win32') {
        exec('explorer.exe "' + dir + '"');
      } else {
        shell.openPath(dir);
      }
    } catch (error) {
      console.error('[InstancesService] openFolder error:', error);
    }
  }
}
