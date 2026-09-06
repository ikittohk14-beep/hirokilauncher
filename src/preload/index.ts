import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import type {
  ElectronAPI,
  AppSettings,
  Account,
  InstanceMeta,
  InstalledModFile,
  ContentCategory,
  ContentVersion,
  ModLoaderType,
  LaunchProgress,
  GameLog,
} from './types';

const api: ElectronAPI = {
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close'),
    isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
  },
  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    update: (settings: Partial<AppSettings>) => ipcRenderer.invoke('settings:update', settings),
    detectJava: () => ipcRenderer.invoke('settings:detectJava'),
    selectDirectory: () => ipcRenderer.invoke('settings:selectDirectory'),
    getSystemMemoryMb: () => ipcRenderer.invoke('settings:getSystemMemoryMb'),
  },
  accounts: {
    getAll: () => ipcRenderer.invoke('accounts:getAll'),
    getActive: () => ipcRenderer.invoke('accounts:getActive'),
    setActive: (id: string) => ipcRenderer.invoke('accounts:setActive', id),
    addOffline: (username: string) => ipcRenderer.invoke('accounts:addOffline', username),
    loginElyBy: (credentials: { login: string; password: string }) => ipcRenderer.invoke('accounts:loginElyBy', credentials),
    loginBrowserElyBy: () => ipcRenderer.invoke('accounts:loginBrowserElyBy'),
    remove: (id: string) => ipcRenderer.invoke('accounts:remove', id),
  },
  instances: {
    getAll: () => ipcRenderer.invoke('instances:getAll'),
    getById: (id: string) => ipcRenderer.invoke('instances:getById', id),
    create: (meta: Omit<InstanceMeta, 'id' | 'createdAt'>) => ipcRenderer.invoke('instances:create', meta),
    delete: (id: string) => ipcRenderer.invoke('instances:delete', id),
    getInstalledMods: (instanceId: string) => ipcRenderer.invoke('instances:getInstalledMods', instanceId),
    toggleMod: (instanceId: string, filename: string, enabled: boolean) =>
      ipcRenderer.invoke('instances:toggleMod', instanceId, filename, enabled),
    deleteMod: (instanceId: string, filename: string) => ipcRenderer.invoke('instances:deleteMod', instanceId, filename),
    addLocalMod: (instanceId: string, filePath: string) => ipcRenderer.invoke('instances:addLocalMod', instanceId, filePath),
    openFolder: (instanceId: string) => ipcRenderer.invoke('instances:openFolder', instanceId),
    getServers: (instanceId: string) => ipcRenderer.invoke('instances:getServers', instanceId),
    pingServer: (ip: string) => ipcRenderer.invoke('instances:pingServer', ip),
    importZip: (zipPath: string) => ipcRenderer.invoke('instances:importZip', zipPath),
    onImportProgress: (callback: (data: { percentage: number; text: string }) => void) => {
      const handler = (_event: any, data: { percentage: number; text: string }) => callback(data);
      ipcRenderer.on('instances:importProgress', handler);
      return () => ipcRenderer.removeListener('instances:importProgress', handler);
    },
  },
  versions: {
    getMinecraftVersions: () => ipcRenderer.invoke('versions:getMinecraftVersions'),
    getLoaderVersions: (gameVersion: string, loader: ModLoaderType) =>
      ipcRenderer.invoke('versions:getLoaderVersions', gameVersion, loader),
  },
  content: {
    search: (query: string, category: ContentCategory, gameVersion?: string, loader?: ModLoaderType, source?: 'modrinth' | 'curseforge', page?: number) =>
      ipcRenderer.invoke('content:search', query, category, gameVersion, loader, source, page),
    getProject: (id: string, source: string) => ipcRenderer.invoke('content:getProject', id, source),
    getVersions: (projectId: string, source: 'modrinth' | 'curseforge', gameVersion?: string, loader?: ModLoaderType) =>
      ipcRenderer.invoke('content:getVersions', projectId, source, gameVersion, loader),
    installContent: (instanceId: string, projectId: string, source: 'modrinth' | 'curseforge', version: ContentVersion, category: ContentCategory) =>
      ipcRenderer.invoke('content:installContent', instanceId, projectId, source, version, category),
    installModpack: (version: ContentVersion, name: string) =>
      ipcRenderer.invoke('content:installModpack', version, name),
  },
  launcher: {
    launch: (instanceId: string) => ipcRenderer.invoke('launcher:launch', instanceId),
    kill: (instanceId: string) => ipcRenderer.invoke('launcher:kill', instanceId),
    onInstallProgress: (callback: (percentage: number) => void) => {
      const listener = (_event: any, p: number) => callback(p);
      ipcRenderer.on('install:progress', listener);
      return () => ipcRenderer.removeListener('install:progress', listener);
    },
    onProgress: (callback: (progress: LaunchProgress) => void) => {
      const listener = (_event: IpcRendererEvent, progress: LaunchProgress) => callback(progress);
      ipcRenderer.on('launcher:progress', listener);
      return () => {
        ipcRenderer.removeListener('launcher:progress', listener);
      };
    },
    onLog: (callback: (log: GameLog) => void) => {
      const listener = (_event: IpcRendererEvent, log: GameLog) => callback(log);
      ipcRenderer.on('launcher:log', listener);
      return () => {
        ipcRenderer.removeListener('launcher:log', listener);
      };
    },
    onStateChange: (callback: (state: { instanceId: string; isActive: boolean; exitCode?: number }) => void) => {
      const listener = (_event: IpcRendererEvent, state: { instanceId: string; isActive: boolean; exitCode?: number }) =>
        callback(state);
      ipcRenderer.on('launcher:stateChange', listener);
      return () => {
        ipcRenderer.removeListener('launcher:stateChange', listener);
      };
    },
  },
};

contextBridge.exposeInMainWorld('electronAPI', api);
