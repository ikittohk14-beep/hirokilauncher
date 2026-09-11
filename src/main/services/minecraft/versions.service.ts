import fs from 'node:fs';
import path from 'node:path';
import type { MinecraftVersionItem, ModLoaderType, ModLoaderVersionItem } from '../../../preload/types';
import { SettingsService } from '../storage/settings.service';

interface MojangManifest {
  latest: {
    release: string;
    snapshot: string;
  };
  versions: MinecraftVersionItem[];
}

interface FabricLoaderItem {
  loader: {
    version: string;
    stable: boolean;
  };
}

interface ForgePromos {
  promos: Record<string, string>;
}

export class VersionsService {
  private static instance: VersionsService;
  private cacheDir: string;
  private cachedMojangVersions: MinecraftVersionItem[] | null = null;

  private constructor() {
    const baseDir = SettingsService.getInstance().getBaseDir();
    this.cacheDir = path.join(baseDir, 'cache', 'versions');
    try {
      if (!fs.existsSync(this.cacheDir)) {
        fs.mkdirSync(this.cacheDir, { recursive: true });
      }
    } catch (error) {
      console.error('[VersionsService] Error creating cache directory:', error);
    }
  }

  public static getInstance(): VersionsService {
    if (!VersionsService.instance) {
      VersionsService.instance = new VersionsService();
    }
    return VersionsService.instance;
  }

  public async getMinecraftVersions(): Promise<MinecraftVersionItem[]> {
    if (this.cachedMojangVersions && this.cachedMojangVersions.length > 0) {
      return this.cachedMojangVersions;
    }

    const localCachePath = path.join(this.cacheDir, 'mojang_manifest.json');

    try {
      let response: Response | null = null;
      try {
        response = await fetch('https://piston-meta.mojang.com/mc/game/version_manifest_v2.json', {
          headers: { 'User-Agent': 'HirokiLauncher/2.0.0 (MinecraftLauncher/1.0)' },
          signal: AbortSignal.timeout(8000),
        });
      } catch (err) {
        console.warn('[VersionsService] Mojang manifest fetch failed, trying BMCLAPI:', err);
      }

      if (!response || !response.ok) {
        response = await fetch('https://bmclapi2.bangbang93.com/mc/game/version_manifest_v2.json', {
          headers: { 'User-Agent': 'HirokiLauncher/2.0.0 (MinecraftLauncher/1.0)' },
          signal: AbortSignal.timeout(8000),
        });
      }

      if (response && response.ok) {
        const manifest = (await response.json()) as MojangManifest;
        this.cachedMojangVersions = manifest.versions;
        // Save to cache
        fs.writeFileSync(localCachePath, JSON.stringify(manifest.versions, null, 2), 'utf-8');
        return this.cachedMojangVersions;
      }
    } catch (networkError) {
      console.error('[VersionsService] Network fetch failed, checking local cache:', networkError);
    }

    // Fallback to local cache
    try {
      if (fs.existsSync(localCachePath)) {
        const cachedData = fs.readFileSync(localCachePath, 'utf-8');
        this.cachedMojangVersions = JSON.parse(cachedData);
        return this.cachedMojangVersions || [];
      }
    } catch (cacheError) {
      console.error('[VersionsService] Failed to read cached version manifest:', cacheError);
    }

    return [];
  }

  public async getLoaderVersions(gameVersion: string, loader: ModLoaderType): Promise<ModLoaderVersionItem[]> {
    if (loader === 'vanilla') {
      return [];
    }

    if (loader === 'fabric') {
      return this.getFabricVersions(gameVersion);
    }

    if (loader === 'forge') {
      return this.getForgeVersions(gameVersion);
    }

    if (loader === 'quilt') {
      return this.getQuiltVersions(gameVersion);
    }
    
    if (loader === 'neoforge') {
      return this.getNeoForgeVersions(gameVersion);
    }

    return [];
  }

  private async getFabricVersions(gameVersion: string): Promise<ModLoaderVersionItem[]> {
    const url = `https://meta.fabricmc.net/v2/versions/loader/${encodeURIComponent(gameVersion)}`;
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'HirokiLauncher/1.0' },
        signal: AbortSignal.timeout(6000),
      });

      if (!response.ok) {
        console.error(`[VersionsService] Fabric meta returned HTTP ${response.status} for ${gameVersion}`);
        return [];
      }

      const items = (await response.json()) as FabricLoaderItem[];
      return items.map((item) => ({
        version: item.loader.version,
        stable: item.loader.stable,
      }));
    } catch (error) {
      console.error(`[VersionsService] Failed to fetch Fabric versions for ${gameVersion}:`, error);
      return [];
    }
  }

  

  private async getQuiltVersions(gameVersion: string): Promise<ModLoaderVersionItem[]> {
    const url = `https://meta.quiltmc.org/v3/versions/loader/${encodeURIComponent(gameVersion)}`;
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(6000) });
      if (!response.ok) return [];
      const items = await response.json();
      return items.map((item: any) => ({
        version: item.loader.version,
        stable: true
      }));
    } catch (e) {
      console.error('[VersionsService] Quilt error:', e);
      return [];
    }
  }

  private async getNeoForgeVersions(gameVersion: string): Promise<ModLoaderVersionItem[]> {
    const url = 'https://maven.neoforged.net/api/maven/versions/releases/net/neoforged/neoforge';
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(6000) });
      if (!response.ok) return [];
      const data = await response.json();
      const versions = data.versions || data.neoforge || [];
      
      // Filter versions. 1.20.4 -> starts with 20.4
      let prefix = gameVersion.substring(2);
      if (prefix.indexOf('.') === -1) prefix += '.0';
      if (['1.20.2', '1.20.3', '1.20.4'].includes(gameVersion)) prefix = '20.4';
      else if (['1.20.5', '1.20.6'].includes(gameVersion)) prefix = '20.6';
      
      if (!prefix) return [];
      
      const filtered = versions.filter((v: string) => v.startsWith(prefix + '.'));
      return filtered.reverse().map((v: string) => ({ version: v, stable: true }));
    } catch (e) {
      console.error('[VersionsService] NeoForge error:', e);
      return [];
    }
  }

  private async getForgeVersions(gameVersion: string): Promise<ModLoaderVersionItem[]> {
    const url = 'https://files.minecraftforge.net/net/minecraftforge/forge/promotions_slim.json';
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'HirokiLauncher/1.0' },
        signal: AbortSignal.timeout(6000),
      });

      if (!response.ok) {
        console.error(`[VersionsService] Forge promos returned HTTP ${response.status}`);
        return [];
      }

      const data = (await response.json()) as ForgePromos;
      const results: ModLoaderVersionItem[] = [];

      // E.g. "1.20.1-recommended", "1.20.1-latest"
      const recommendedKey = `${gameVersion}-recommended`;
      const latestKey = `${gameVersion}-latest`;

      if (data.promos[recommendedKey]) {
        results.push({
          version: data.promos[recommendedKey],
          stable: true,
        });
      }

      if (data.promos[latestKey] && data.promos[latestKey] !== data.promos[recommendedKey]) {
        results.push({
          version: data.promos[latestKey],
          stable: false,
        });
      }

      return results;
    } catch (error) {
      console.error(`[VersionsService] Failed to fetch Forge versions for ${gameVersion}:`, error);
      return [];
    }
  }
}
