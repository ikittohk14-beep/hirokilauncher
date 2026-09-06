import fs from 'node:fs';
import path from 'node:path';
import type { ContentCategory, ContentItem, ContentVersion, ModLoaderType } from '../../../preload/types';
import { DownloaderService } from '../downloader/downloader.service';

interface ModrinthSearchHit {
  project_id: string;
  slug: string;
  title: string;
  description: string;
  author: string;
  icon_url?: string;
  downloads: number;
  follows: number;
  categories: string[];
  date_modified: string;
}

interface ModrinthSearchResponse {
  hits: ModrinthSearchHit[];
  total_hits: number;
}

interface ModrinthVersionFile {
  url: string;
  filename: string;
  primary: boolean;
  size: number;
  hashes: {
    sha1?: string;
    sha512?: string;
  };
}

interface ModrinthVersionResponse {
  id: string;
  name: string;
  version_number: string;
  game_versions: string[];
  loaders: string[];
  files: ModrinthVersionFile[];
  date_published: string;
  dependencies: { project_id: string; dependency_type: 'required' | 'optional' }[];
}

interface CurseForgeModItem {
  id: number;
  name: string;
  summary: string;
  slug: string;
  downloadCount: number;
  thumbsUpCount: number;
  dateModified: string;
  logo?: {
    thumbnailUrl: string;
  };
  authors: { name: string }[];
  categories: { name: string }[];
}

interface CurseForgeSearchResponse {
  data: CurseForgeModItem[];
  pagination: {
    totalCount: number;
  };
}

interface CurseForgeFileItem {
  id: number;
  displayName: string;
  fileName: string;
  fileLength: number;
  fileDate: string;
  downloadUrl: string | null;
  gameVersions: string[];
  hashes: { value: string; algo: number }[];
  dependencies: { modId: number; relationType: number }[];
}

interface CurseForgeFilesResponse {
  data: CurseForgeFileItem[];
}

export class ContentService {
  private static instance: ContentService;
  private readonly modrinthBase = 'https://api.modrinth.com/v2';
  private readonly curseforgeBase = 'https://api.curseforge.com/v1';
  // Standard public Eternal API key
  private readonly curseforgeApiKey = '$2a$10$bL4bIL5pUWqfcO7KQTnMReakwtfHbNKh6v1uTpKlzhwoueEJQnPnm';

  public static getInstance(): ContentService {
    if (!ContentService.instance) {
      ContentService.instance = new ContentService();
    }
    return ContentService.instance;
  }

  /**
   * Search content across Modrinth or CurseForge
   */
  
  public async getProjectDetails(id: string, source: 'modrinth' | 'curseforge') {
    if (source === 'modrinth') {
      try {
        const [projRes, versions] = await Promise.all([
          fetch(`${this.modrinthBase}/project/${id}`, { headers: { 'User-Agent': 'HirokiLauncher/1.0' } }),
          this.getVersions(id, source)
        ]);
        const proj = await projRes.json();
        return {
          id: proj.id,
          title: proj.title,
          description: proj.description,
          body: proj.body,
          gallery: proj.gallery || [],
          versions: versions
        };
      } catch (e) {
        console.error(e);
        return null;
      }
    }
    return null; // CF fallback
  }

  public async search(
    query: string,
    category: ContentCategory,
    gameVersion?: string,
    loader?: ModLoaderType,
    source: 'modrinth' | 'curseforge' = 'modrinth',
    page = 0
  ): Promise<{ items: ContentItem[]; totalHits: number }> {
    if (source === 'curseforge') {
      return this.searchCurseForge(query, category, gameVersion, loader, page);
    }
    return this.searchModrinth(query, category, gameVersion, loader, page);
  }

  private async searchModrinth(
    query: string,
    category: ContentCategory,
    gameVersion?: string,
    loader?: ModLoaderType,
    page = 0
  ): Promise<{ items: ContentItem[]; totalHits: number }> {
    try {
      const limit = 20;
      const offset = page * limit;

      const facets: string[][] = [];

      // Map category to Modrinth project_type
      const typeMap: Record<ContentCategory, string> = {
        mod: 'mod',
        modpack: 'modpack',
        resourcepack: 'resourcepack',
        shader: 'shader',
        datapack: 'datapack',
        map: 'project_type:mod', // Modrinth hosts mostly datapacks/mods, fallback
      };

      if (category !== 'map') {
        facets.push([`project_type:${typeMap[category]}`]);
      }

      if (gameVersion) {
        facets.push([`versions:${gameVersion}`]);
      }

      if (loader && loader !== 'vanilla' && (category === 'mod' || category === 'modpack')) {
        facets.push([`categories:${loader}`]);
      }

      
      const params = new URLSearchParams({
        query: query.trim(),
        limit: limit.toString(),
        offset: offset.toString(),
        facets: JSON.stringify(facets),
      });

      const response = await fetch(`${this.modrinthBase}/search?${params.toString()}`, {
        headers: { 'User-Agent': 'HirokiLauncher/1.0' },
        signal: AbortSignal.timeout(7000),
      });

      if (!response.ok) {
        throw new Error(`Modrinth API error: ${response.status}`);
      }

      const data = (await response.json()) as ModrinthSearchResponse;
      const items: ContentItem[] = data.hits.map((hit) => ({
        id: hit.project_id,
        slug: hit.slug,
        title: hit.title,
        description: hit.description,
        author: hit.author,
        iconUrl: hit.icon_url,
        downloads: hit.downloads,
        followers: hit.follows,
        categories: hit.categories,
        source: 'modrinth',
        dateModified: hit.date_modified,
      }));

      return { items, totalHits: data.total_hits };
    } catch (error) {
      console.error('[ContentService] Modrinth search failed:', error);
      return { items: [], totalHits: 0 };
    }
  }

  private async searchCurseForge(
    query: string,
    category: ContentCategory,
    gameVersion?: string,
    loader?: ModLoaderType,
    page = 0
  ): Promise<{ items: ContentItem[]; totalHits: number }> {
    try {
      const pageSize = 20;
      const index = page * pageSize;

      // Class IDs for Minecraft (gameId=432)
      const classIdMap: Record<ContentCategory, number> = {
        mod: 6,
        modpack: 4471,
        resourcepack: 12,
        shader: 6552,
        datapack: 6945,
        map: 17,
      };

      
      const params = new URLSearchParams({
        gameId: '432',
        classId: classIdMap[category].toString(),
        pageSize: pageSize.toString(),
        index: index.toString(),
      });

      if (query.trim()) {
        params.append('searchFilter', query.trim());
      }
      if (gameVersion) {
        params.append('gameVersion', gameVersion);
      }
      if (loader && loader !== 'vanilla' && (category === 'mod' || category === 'modpack')) {
        // Forge = 1, Fabric = 4
        const loaderNum = loader === 'forge' ? '1' : '4';
        params.append('modLoaderType', loaderNum);
      }

      const response = await fetch(`${this.curseforgeBase}/mods/search?${params.toString()}`, {
        headers: {
          'x-api-key': this.curseforgeApiKey,
          'User-Agent': 'HirokiLauncher/1.0',
        },
        signal: AbortSignal.timeout(7000),
      });

      if (!response.ok) {
        throw new Error(`CurseForge API error: ${response.status}`);
      }

      const data = (await response.json()) as CurseForgeSearchResponse;
      const items: ContentItem[] = data.data.map((mod) => ({
        id: mod.id.toString(),
        slug: mod.slug,
        title: mod.name,
        description: mod.summary,
        author: mod.authors.map((a) => a.name).join(', '),
        iconUrl: mod.logo?.thumbnailUrl,
        downloads: mod.downloadCount,
        followers: mod.thumbsUpCount,
        categories: mod.categories.map((c) => c.name),
        source: 'curseforge',
        dateModified: mod.dateModified,
      }));

      return { items, totalHits: data.pagination.totalCount };
    } catch (error) {
      console.error('[ContentService] CurseForge search failed:', error);
      return { items: [], totalHits: 0 };
    }
  }

  /**
   * Get available versions for a project
   */
  public async getVersions(
    projectId: string,
    source: 'modrinth' | 'curseforge',
    gameVersion?: string,
    loader?: ModLoaderType
  ): Promise<ContentVersion[]> {
    if (source === 'curseforge') {
      return this.getCurseForgeVersions(projectId, gameVersion, loader);
    }
    return this.getModrinthVersions(projectId, gameVersion, loader);
  }

  private async getModrinthVersions(
    projectId: string,
    gameVersion?: string,
    loader?: ModLoaderType
  ): Promise<ContentVersion[]> {
    try {
      const params = new URLSearchParams();
      if (gameVersion) {
        params.append('game_versions', JSON.stringify([gameVersion]));
      }
      if (loader && loader !== 'vanilla') {
        params.append('loaders', JSON.stringify([loader]));
      }

      const url = `${this.modrinthBase}/project/${encodeURIComponent(projectId)}/version?${params.toString()}`;
      const response = await fetch(url, {
        headers: { 'User-Agent': 'HirokiLauncher/1.0' },
        signal: AbortSignal.timeout(6000),
      });

      if (!response.ok) {
        throw new Error(`Modrinth versions failed: ${response.status}`);
      }

      const list = (await response.json()) as ModrinthVersionResponse[];
      const results: ContentVersion[] = [];

      for (const item of list) {
        const primaryFile = item.files.find((f) => f.primary) || item.files[0];
        if (primaryFile) {
          results.push({
            id: item.id,
            name: item.name,
            versionNumber: item.version_number,
            gameVersions: item.game_versions,
            loaders: item.loaders,
            downloadUrl: primaryFile.url,
            filename: primaryFile.filename,
            size: primaryFile.size,
            datePublished: item.date_published,
            dependencies: item.dependencies?.map((d) => ({
              projectId: d.project_id,
              dependencyType: d.dependency_type,
            })),
          });
        }
      }

      return results;
    } catch (error) {
      console.error(`[ContentService] Failed to get Modrinth versions for ${projectId}:`, error);
      return [];
    }
  }

  private async getCurseForgeVersions(
    modId: string,
    gameVersion?: string,
    loader?: ModLoaderType
  ): Promise<ContentVersion[]> {
    try {
      
      const params = new URLSearchParams({
        pageSize: '50',
      });
      if (gameVersion) {
        params.append('gameVersion', gameVersion);
      }
      if (loader && loader !== 'vanilla') {
        const loaderNum = loader === 'forge' ? '1' : '4';
        params.append('modLoaderType', loaderNum);
      }

      const url = `${this.curseforgeBase}/mods/${encodeURIComponent(modId)}/files?${params.toString()}`;
      const response = await fetch(url, {
        headers: {
          'x-api-key': this.curseforgeApiKey,
          'User-Agent': 'HirokiLauncher/1.0',
        },
        signal: AbortSignal.timeout(6000),
      });

      if (!response.ok) {
        throw new Error(`CurseForge files failed: ${response.status}`);
      }

      const data = (await response.json()) as CurseForgeFilesResponse;
      const results: ContentVersion[] = [];

      for (const file of data.data) {
        // Fallback for downloadUrl if null (Curseforge edge CDN pattern)
        const downloadUrl =
          file.downloadUrl ||
          `https://mediafilez.forgecdn.net/files/${Math.floor(file.id / 1000)}/${file.id % 1000}/${file.fileName}`;

        results.push({
          id: file.id.toString(),
          name: file.displayName,
          versionNumber: file.displayName,
          gameVersions: file.gameVersions,
          loaders: loader ? [loader] : [],
          downloadUrl,
          filename: file.fileName,
          size: file.fileLength,
          datePublished: file.fileDate,
        });
      }

      return results;
    } catch (error) {
      console.error(`[ContentService] Failed to get CurseForge versions for ${modId}:`, error);
      return [];
    }
  }

  /**
   * Installs downloaded file into instance subdirectory:
   * mods -> instanceDir/mods
   * resourcepack -> instanceDir/resourcepacks
   * shader -> instanceDir/shaderpacks
   * datapack -> instanceDir/datapacks
   * map -> instanceDir/saves
   */
  public async installContentIntoInstance(
    instanceDir: string,
    version: ContentVersion,
    category: ContentCategory
  ): Promise<boolean> {
    try {
      const folderMap: Record<ContentCategory, string> = {
        mod: 'mods',
        resourcepack: 'resourcepacks',
        shader: 'shaderpacks',
        datapack: 'datapacks',
        map: 'saves',
        modpack: '',
      };

      const targetSubdir = folderMap[category];
      if (!targetSubdir) {
        throw new Error(`Cannot install category '${category}' directly into subfolder`);
      }

      const destFolder = path.join(instanceDir, targetSubdir);
      if (!fs.existsSync(destFolder)) {
        fs.mkdirSync(destFolder, { recursive: true });
      }

      const destPath = path.join(destFolder, version.filename);
      await DownloaderService.getInstance().downloadFile({
        url: version.downloadUrl,
        destPath,
        size: version.size,
      });

      return true;
    } catch (error) {
      console.error('[ContentService] installContentIntoInstance failed:', error);
      return false;
    }
  }
}
