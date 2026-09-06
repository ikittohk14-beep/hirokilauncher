import { ipcMain, BrowserWindow, dialog } from 'electron';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { SettingsService } from '../services/storage/settings.service';
import { JavaService } from '../services/system/java.service';
import { AccountsService } from '../services/accounts/accounts.service';
import { InstancesService } from '../services/storage/instances.service';
import * as nbt from 'nbt';
import util from 'minecraft-server-util';
import { VersionsService } from '../services/minecraft/versions.service';
import { ContentService } from '../services/content/content.service';
import { ModpackService } from '../services/modpack/modpack.service';
import { LaunchService } from '../services/launcher/launch.service';
import type { AppSettings, ContentCategory, ContentVersion, InstanceMeta, ModLoaderType } from '../../preload/types';

export function registerIpcHandlers(mainWindow: BrowserWindow): void {
  ipcMain.handle('instances:getServers', async (_event, instanceId: string) => {
    try {
      const dir = InstancesService.getInstance().getInstanceDir(instanceId);
      const serversFile = path.join(dir, 'servers.dat');
      if (!fs.existsSync(serversFile)) return [];

      const buffer = fs.readFileSync(serversFile);
      const servers = await new Promise<any[]>((resolve, reject) => {
        nbt.parse(buffer, (error: any, data: any) => {
          if (error) {
            reject(error);
          } else {
            const s = data.value.servers?.value?.value || [];
            resolve(s.map((item: any) => ({
              name: item.name?.value,
              ip: item.ip?.value
            })));
          }
        });
      });
      return servers;
    } catch (err) {
      console.error('[IPC] Error reading servers.dat:', err);
      return [];
    }
  });

  ipcMain.handle('instances:pingServer', async (_event, ip: string) => {
    try {
      const [host, port] = ip.split(':');
      const response = await util.status(host, port ? parseInt(port) : 25565, { timeout: 2000 });
      return {
        online: true,
        players: response.players.online,
        maxPlayers: response.players.max,
        motd: response.motd.clean
      };
    } catch (err) {
      return { online: false };
    }
  });

  // --- Window Controls (driftwm / Wayland friendly) ---
  ipcMain.handle('window:minimize', () => {
    try {
      mainWindow.minimize();
    } catch (err) {
      console.error('[IPC window:minimize] Error:', err);
    }
  });

  ipcMain.handle('window:maximize', () => {
    try {
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
      } else {
        mainWindow.maximize();
      }
    } catch (err) {
      console.error('[IPC window:maximize] Error:', err);
    }
  });

  ipcMain.handle('window:close', () => {
    try {
      mainWindow.close();
    } catch (err) {
      console.error('[IPC window:close] Error:', err);
    }
  });

  ipcMain.handle('window:isMaximized', () => {
    try {
      return mainWindow.isMaximized();
    } catch (err) {
      console.error('[IPC window:isMaximized] Error:', err);
      return false;
    }
  });

  // --- Settings ---
  ipcMain.handle('settings:get', () => {
    try {
      return SettingsService.getInstance().getSettings();
    } catch (err) {
      console.error('[IPC settings:get] Error:', err);
      return SettingsService.getInstance().getDefaultSettings();
    }
  });

  ipcMain.handle('settings:update', (_event, settings: Partial<AppSettings>) => {
    try {
      return SettingsService.getInstance().saveSettings(settings);
    } catch (err) {
      console.error('[IPC settings:update] Error:', err);
      throw err;
    }
  });

  ipcMain.handle('settings:detectJava', async () => {
    try {
      return await JavaService.getInstance().detectJavaInstallations();
    } catch (err) {
      console.error('[IPC settings:detectJava] Error:', err);
      return [];
    }
  });

  ipcMain.handle('settings:selectDirectory', async () => {
    try {
      const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory', 'createDirectory'],
        title: 'Выберите папку для данных лаунчера',
      });
      if (!result.canceled && result.filePaths.length > 0) {
        return result.filePaths[0];
      }
      return null;
    } catch (err) {
      console.error('[IPC settings:selectDirectory] Error:', err);
      return null;
    }
  });

  // --- Accounts ---
  ipcMain.handle('settings:getSystemMemoryMb', () => {
    return Math.floor(os.totalmem() / 1024 / 1024);
  });
  ipcMain.handle('accounts:loginBrowserElyBy', async () => {
    return await AccountsService.getInstance().loginBrowserElyBy();
  });

  ipcMain.handle('accounts:getAll', () => {
    try {
      return AccountsService.getInstance().getAll();
    } catch (err) {
      console.error('[IPC accounts:getAll] Error:', err);
      return [];
    }
  });

  ipcMain.handle('accounts:getActive', () => {
    try {
      return AccountsService.getInstance().getActive();
    } catch (err) {
      console.error('[IPC accounts:getActive] Error:', err);
      return null;
    }
  });

  ipcMain.handle('accounts:setActive', (_event, id: string) => {
    try {
      return AccountsService.getInstance().setActive(id);
    } catch (err) {
      console.error('[IPC accounts:setActive] Error:', err);
      return false;
    }
  });

  ipcMain.handle('accounts:addOffline', (_event, username: string) => {
    try {
      return AccountsService.getInstance().addOffline(username);
    } catch (err) {
      console.error('[IPC accounts:addOffline] Error:', err);
      throw err;
    }
  });

  ipcMain.handle('accounts:loginElyBy', async (_event, credentials: { login: string; password: string }) => {
    try {
      return await AccountsService.getInstance().loginElyBy(credentials);
    } catch (err) {
      console.error('[IPC accounts:loginElyBy] Error:', err);
      throw err;
    }
  });

  ipcMain.handle('accounts:remove', (_event, id: string) => {
    try {
      return AccountsService.getInstance().remove(id);
    } catch (err) {
      console.error('[IPC accounts:remove] Error:', err);
      return false;
    }
  });

  // --- Instances ---
  ipcMain.handle('instances:getAll', () => {
    try {
      return InstancesService.getInstance().getAll();
    } catch (err) {
      console.error('[IPC instances:getAll] Error:', err);
      return [];
    }
  });

  ipcMain.handle('instances:getById', (_event, id: string) => {
    try {
      return InstancesService.getInstance().getById(id);
    } catch (err) {
      console.error('[IPC instances:getById] Error:', err);
      return null;
    }
  });

  ipcMain.handle('instances:create', (_event, meta: Omit<InstanceMeta, 'id' | 'createdAt'>) => {
    try {
      return InstancesService.getInstance().create(meta);
    } catch (err) {
      console.error('[IPC instances:create] Error:', err);
      throw err;
    }
  });

  ipcMain.handle('instances:delete', (_event, id: string) => {
    try {
      return InstancesService.getInstance().delete(id);
    } catch (err) {
      console.error('[IPC instances:delete] Error:', err);
      return false;
    }
  });

  ipcMain.handle('instances:getInstalledMods', (_event, instanceId: string) => {
    try {
      return InstancesService.getInstance().getInstalledMods(instanceId);
    } catch (err) {
      console.error('[IPC instances:getInstalledMods] Error:', err);
      return [];
    }
  });

  ipcMain.handle('instances:toggleMod', (_event, instanceId: string, filename: string, enabled: boolean) => {
    try {
      return InstancesService.getInstance().toggleMod(instanceId, filename, enabled);
    } catch (err) {
      console.error('[IPC instances:toggleMod] Error:', err);
      return false;
    }
  });

  ipcMain.handle('instances:deleteMod', (_event, instanceId: string, filename: string) => {
    try {
      return InstancesService.getInstance().deleteMod(instanceId, filename);
    } catch (err) {
      console.error('[IPC instances:deleteMod] Error:', err);
      return false;
    }
  });

  ipcMain.handle('instances:addLocalMod', async (_event, instanceId: string, customFilePath?: string, type?: string) => {
    try {
      let srcPath = customFilePath;
      if (!srcPath) {
        const dialogResult = await dialog.showOpenDialog(mainWindow, {
          title: 'Выберите файл мода (.jar)',
          filters: type === 'resourcepack' || type === 'shader' ? [{ name: 'Archive', extensions: ['zip'] }] : [{ name: 'Minecraft Mod', extensions: ['jar'] }],
          properties: ['openFile'],
        });
        if (dialogResult.canceled || dialogResult.filePaths.length === 0) {
          return false;
        }
        srcPath = dialogResult.filePaths[0];
      }

      if (!srcPath) return false;
      return InstancesService.getInstance().addLocalMod(instanceId, srcPath, type);
    } catch (err) {
      console.error('[IPC instances:addLocalMod] Error:', err);
      return false;
    }
  });

  ipcMain.handle('instances:importZip', async (event, zipPath: string) => {
    try {
      return await instancesService.importZip(zipPath, event.sender);
    } catch (err) {
      console.error('[IPC instances:importZip] Error:', err);
      throw err;
    }
  });

  ipcMain.handle('instances:openFolder', (_event, instanceId: string) => {
    try {
      InstancesService.getInstance().openFolder(instanceId);
    } catch (err) {
      console.error('[IPC instances:openFolder] Error:', err);
    }
  });

  // --- Versions ---
  ipcMain.handle('versions:getMinecraftVersions', async () => {
    try {
      return await VersionsService.getInstance().getMinecraftVersions();
    } catch (err) {
      console.error('[IPC versions:getMinecraftVersions] Error:', err);
      return [];
    }
  });

  ipcMain.handle('versions:getLoaderVersions', async (_event, gameVersion: string, loader: ModLoaderType) => {
    try {
      return await VersionsService.getInstance().getLoaderVersions(gameVersion, loader);
    } catch (err) {
      console.error('[IPC versions:getLoaderVersions] Error:', err);
      return [];
    }
  });

  // --- Content ---
  
  ipcMain.handle(
    'content:getProject',
    async (_event, id: string, source: 'modrinth' | 'curseforge') => {
      try {
        return await ContentService.getInstance().getProjectDetails(id, source);
      } catch (err) {
        console.error('[IPC content:getProject] Error:', err);
        return null;
      }
    }
  );

  ipcMain.handle(
    'content:search',
    async (
      _event,
      query: string,
      category: ContentCategory,
      gameVersion?: string,
      loader?: ModLoaderType,
      source?: 'modrinth' | 'curseforge',
      page?: number
    ) => {
      try {
        return await ContentService.getInstance().search(query, category, gameVersion, loader, source, page);
      } catch (err) {
        console.error('[IPC content:search] Error:', err);
        await import("node:fs").appendFileSync('/tmp/hiroki.log', 'Search Error: ' + (err.stack || err) + '\n');
        return { items: [], totalHits: 0 };
      }
    }
  );

  ipcMain.handle(
    'content:getVersions',
    async (_event, projectId: string, source: 'modrinth' | 'curseforge', gameVersion?: string, loader?: ModLoaderType) => {
      try {
        return await ContentService.getInstance().getVersions(projectId, source, gameVersion, loader);
      } catch (err) {
        console.error('[IPC content:getVersions] Error:', err);
        return [];
      }
    }
  );

  ipcMain.handle(
    'content:installContent',
    async (_event, instanceId: string, projectId: string, source: 'modrinth' | 'curseforge', version: import('../../../preload/types').ContentVersion, category: import('../../../preload/types').ContentCategory) => {
      try {
        const instanceDir = InstancesService.getInstance().getInstanceDir(instanceId);
        const ok = await ContentService.getInstance().installContentIntoInstance(instanceDir, version, category);
        if (ok) {
          const meta = InstancesService.getInstance().getById(instanceId);
          if (meta) {
            meta.installedContent = meta.installedContent || {};
            meta.installedContent[version.filename] = {
              projectId,
              source,
              versionId: version.id
            };
            const configPath = path.join(instanceDir, 'instance.json');
            fs.writeFileSync(configPath, JSON.stringify(meta, null, 2));
          }
        }
        return ok;
      } catch (err) {
        console.error('[IPC content:installContent] Error:', err);
        return false;
      }
    }
  );

  ipcMain.handle('content:installModpack', async (_event, version: ContentVersion, name: string) => {
    try {
      return await ModpackService.getInstance().installModpack(version, name);
    } catch (err) {
      console.error('[IPC content:installModpack] Error:', err);
      throw err;
    }
  });

  // --- Launcher Process & Event Forwarding ---
  ipcMain.handle('launcher:launch', async (_event, instanceId: string) => {
    try {
      await LaunchService.getInstance().launch(instanceId);
    } catch (err) {
      console.error('[IPC launcher:launch] Error:', err);
      throw err;
    }
  });

  ipcMain.handle('launcher:kill', (_event, instanceId: string) => {
    try {
      return LaunchService.getInstance().kill(instanceId);
    } catch (err) {
      console.error('[IPC launcher:kill] Error:', err);
      return false;
    }
  });

  // Wire up launch event listeners to webContents
  LaunchService.getInstance().onProgress((progress) => {
    if (!mainWindow.isDestroyed()) {
      mainWindow.webContents.send('launcher:progress', progress);
    }
  });

  LaunchService.getInstance().onLog((log) => {
    if (!mainWindow.isDestroyed()) {
      mainWindow.webContents.send('launcher:log', log);
    }
  });

  LaunchService.getInstance().onStateChange((state) => {
    if (!mainWindow.isDestroyed()) {
      mainWindow.webContents.send('launcher:stateChange', state);
    }
  });
}
