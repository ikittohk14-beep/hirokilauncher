export interface WindowControlsAPI {
  minimize: () => Promise<void>;
  maximize: () => Promise<void>;
  close: () => Promise<void>;
  isMaximized: () => Promise<boolean>;
}

export interface AppSettings {
  gameDirectory: string;
  javaPath: string;
  minMemoryMb: number;
  maxMemoryMb: number;
  customJvmArgs: string;
  theme: 'dark' | 'midnight' | 'cyber';
  autoCloseOnLaunch: boolean;
  tileShape?: 'classic' | 'compact';
  layout?: any[];
  showSnapshots?: boolean;
}

export interface JavaInstallation {
  path: string;
  version: string;
  majorVersion: number;
  is64Bit: boolean;
  vendor: string;
}

export type AccountType = 'elyby' | 'offline';

export interface Account {
  id: string;
  username: string;
  uuid: string;
  type: AccountType;
  skinUrl?: string;
  capeUrl?: string;
  accessToken?: string;
  clientToken?: string;
  isActive: boolean;
}

export type ModLoaderType = 'vanilla' | 'fabric' | 'forge' | 'quilt' | 'neoforge';

export interface MinecraftVersionItem {
  id: string;
  type: 'release' | 'snapshot' | 'old_beta' | 'old_alpha';
  url: string;
  time: string;
  releaseTime: string;
}

export interface ModLoaderVersionItem {
  version: string;
  stable: boolean;
}

export interface InstanceMeta {
  id: string;
  name: string;
  gameVersion: string;
  loaderType: ModLoaderType;
  loaderVersion?: string;
  icon?: string;
  customJavaPath?: string;
  customMemoryMb?: number;
  createdAt: number;
  lastPlayedAt?: number;
  installedContent?: Record<string, {
    projectId: string;
    source: 'modrinth' | 'curseforge';
    versionId: string;
  }>;
}

export type ContentCategory = 'mod' | 'modpack' | 'resourcepack' | 'shader' | 'datapack' | 'map';

export interface ContentItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  author: string;
  iconUrl?: string;
  downloads: number;
  followers: number;
  categories: string[];
  source: 'modrinth' | 'curseforge';
  dateModified: string;
}

export interface ContentVersion {
  id: string;
  name: string;
  versionNumber: string;
  gameVersions: string[];
  loaders: string[];
  downloadUrl: string;
  filename: string;
  size: number;
  datePublished: string;
  dependencies?: { projectId: string; dependencyType: 'required' | 'optional' }[];
}

export interface InstalledModFile {
  filename: string;
  name: string;
  version: string;
  id?: string;
  description?: string;
  iconUrl?: string;
  isEnabled: boolean;
  type: ContentCategory;
  projectId?: string;
  source?: 'modrinth' | 'curseforge' | 'local';
  versionId?: string;
}

export interface LaunchProgress {
  step: string;
  percentage: number;
  totalFiles?: number;
  completedFiles?: number;
}

export interface GameLog {
  timestamp: number;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
}

export interface ElectronAPI {
  window: WindowControlsAPI;
  onMusicUpdate: (callback: (data: { status: string, artist: string, title: string, artUrl: string }) => void) => void;
    settings: {
    get: () => Promise<AppSettings>;
    update: (settings: Partial<AppSettings>) => Promise<AppSettings>;
    detectJava: () => Promise<JavaInstallation[]>;
    selectDirectory: () => Promise<string | null>;
    getSystemMemoryMb: () => Promise<number>;
  };
  accounts: {
    getAll: () => Promise<Account[]>;
    getActive: () => Promise<Account | null>;
    setActive: (id: string) => Promise<boolean>;
    addOffline: (username: string) => Promise<Account>;
    loginElyBy: (credentials: { login: string; password: string }) => Promise<Account>;
    loginBrowserElyBy: () => Promise<Account>;
    remove: (id: string) => Promise<boolean>;
  };
  dialog: {
    showOpenDialog: (options: any) => Promise<any>;
  };
  instances: {
    getAll: () => Promise<InstanceMeta[]>;
    getById: (id: string) => Promise<InstanceMeta | null>;
    create: (meta: Omit<InstanceMeta, 'id' | 'createdAt'>) => Promise<InstanceMeta>;
    delete: (id: string) => Promise<boolean>;
    getInstalledMods: (instanceId: string, deepScan?: boolean) => Promise<InstalledModFile[]>;
    toggleMod: (instanceId: string, filename: string, enabled: boolean) => Promise<boolean>;
    deleteMod: (instanceId: string, filename: string) => Promise<boolean>;
    addLocalMod: (instanceId: string, filePath: string, type?: string) => Promise<boolean>;
    openFolder: (instanceId: string) => Promise<void>;
    getServers: (instanceId: string) => Promise<{name: string, ip: string}[]>;
    pingServer: (ip: string) => Promise<{online: boolean, players?: number, maxPlayers?: number, motd?: string}>;
    importZip: (zipPath: string) => Promise<InstanceMeta>;
    onImportProgress?: (callback: (data: { percentage: number; text: string }) => void) => () => void;
  };
  versions: {
    getMinecraftVersions: () => Promise<MinecraftVersionItem[]>;
    getLoaderVersions: (gameVersion: string, loader: ModLoaderType) => Promise<ModLoaderVersionItem[]>;
  };
  content: {
    search: (query: string, category: ContentCategory, gameVersion?: string, loader?: ModLoaderType, source?: 'modrinth' | 'curseforge', page?: number, sortBy?: string, tags?: string[]) => Promise<{ items: ContentItem[]; totalHits: number }>;
    getProject: (id: string, source: string) => Promise<any>;
    getVersions: (projectId: string, source: 'modrinth' | 'curseforge', gameVersion?: string, loader?: ModLoaderType) => Promise<ContentVersion[]>;
    
  checkModUpdates: (instanceId: string) => Promise<{ filename: string; update: ContentVersion }[]>;
  updateMod: (instanceId: string, oldFilename: string, newVersion: ContentVersion) => Promise<boolean>;

    installContent: (instanceId: string, projectId: string, source: 'modrinth' | 'curseforge', version: ContentVersion, category: ContentCategory) => Promise<boolean>;
    installModpack: (version: ContentVersion, name: string) => Promise<InstanceMeta>;
  };
  launcher: {
    launch: (instanceId: string) => Promise<void>;
    kill: (instanceId: string) => Promise<boolean>;
    onInstallProgress: (callback: (percentage: number) => void) => () => void;
    onProgress: (callback: (progress: LaunchProgress) => void) => () => void;
    onLog: (callback: (log: GameLog) => void) => () => void;
    onStateChange: (callback: (state: { instanceId: string; isActive: boolean; playTime?: number; exitCode?: number }) => void) => () => void;
  };
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
