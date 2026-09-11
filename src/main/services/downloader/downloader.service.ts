import { BrowserWindow } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { pipeline } from 'node:stream/promises';
import { Readable, Transform } from 'node:stream';
import type { LaunchProgress } from '../../../preload/types';

export interface DownloadTask {
  url: string;
  destPath: string;
  sha1?: string;
  sha512?: string;
  size?: number;
}

export class DownloaderService {
  private static instance: DownloaderService;

  public static getInstance(): DownloaderService {
    if (!DownloaderService.instance) {
      DownloaderService.instance = new DownloaderService();
    }
    return DownloaderService.instance;
  }

  /**
   * Verifies file integrity with SHA-1 or SHA-512
   */
  public verifyFileChecksum(filePath: string, expectedHash?: string, algorithm: 'sha1' | 'sha512' = 'sha1'): boolean {
    if (!expectedHash) return true;
    if (!fs.existsSync(filePath)) return false;

    try {
      const fileBuffer = fs.readFileSync(filePath);
      const hash = crypto.createHash(algorithm).update(fileBuffer).digest('hex');
      return hash.toLowerCase() === expectedHash.toLowerCase();
    } catch (error) {
      console.error(`[DownloaderService] Checksum check error for ${filePath}:`, error);
      return false;
    }
  }

  /**
   * Resolves fallback mirror URLs for Minecraft assets, Mojang CDN, and Fabric
   */
  public getCandidateUrls(url: string): string[] {
    const urls: string[] = [url];
    try {
      if (url.includes('piston-data.mojang.com')) {
        urls.push(url.replace('https://piston-data.mojang.com', 'https://bmclapi2.bangbang93.com'));
      } else if (url.includes('piston-meta.mojang.com')) {
        urls.push(url.replace('https://piston-meta.mojang.com', 'https://bmclapi2.bangbang93.com'));
      } else if (url.includes('launcher.mojang.com')) {
        urls.push(url.replace('https://launcher.mojang.com', 'https://bmclapi2.bangbang93.com'));
      } else if (url.includes('libraries.minecraft.net')) {
        urls.push(url.replace('https://libraries.minecraft.net', 'https://bmclapi2.bangbang93.com/maven'));
      } else if (url.includes('resources.download.minecraft.net')) {
        urls.push(url.replace('https://resources.download.minecraft.net', 'https://bmclapi2.bangbang93.com/assets'));
      } else if (url.includes('meta.fabricmc.net')) {
        urls.push(url.replace('https://meta.fabricmc.net', 'https://bmclapi2.bangbang93.com/fabric-meta'));
      } else if (url.includes('maven.fabricmc.net')) {
        urls.push(url.replace('https://maven.fabricmc.net', 'https://bmclapi2.bangbang93.com/maven'));
      }
    } catch (error) {
      console.error('[DownloaderService] Error generating candidate URLs:', error);
    }
    return urls;
  }

  /**
   * Downloads a single file with integrity check and atomic write
   */
  private async safeMoveFile(src: string, dest: string, maxRetries = 5): Promise<void> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        if (fs.existsSync(dest)) {
          fs.unlinkSync(dest);
        }
        fs.renameSync(src, dest);
        return;
      } catch (err: any) {
        if ((err.code === 'EPERM' || err.code === 'EBUSY' || err.code === 'EACCES') && i < maxRetries - 1) {
          await new Promise((r) => setTimeout(r, 100 * (i + 1)));
          continue;
        }
        try {
          fs.copyFileSync(src, dest);
          if (fs.existsSync(src)) {
            try { fs.unlinkSync(src); } catch {}
          }
          return;
        } catch {
          throw err;
        }
      }
    }
  }

  public async downloadFile(
    task: DownloadTask,
    onProgress?: (downloaded: number, total?: number) => void
  ): Promise<void> {
    const dir = path.dirname(task.destPath);
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
      } catch (mkdirErr) {
        console.error(`[DownloaderService] Failed to create directory ${dir}:`, mkdirErr);
        throw mkdirErr;
      }
    }

    // Check if already downloaded and valid
    try {
      if (fs.existsSync(task.destPath)) {
        if (task.sha1 && this.verifyFileChecksum(task.destPath, task.sha1, 'sha1')) {
          return;
        }
        if (task.sha512 && this.verifyFileChecksum(task.destPath, task.sha512, 'sha512')) {
          return;
        }
        if (!task.sha1 && !task.sha512 && task.size) {
          const stats = fs.statSync(task.destPath);
          if (stats.size === task.size) {
            return;
          }
        }
      }
    } catch (checkErr) {
      console.error(`[DownloaderService] Checksum check error for existing ${task.destPath}:`, checkErr);
    }

    const candidateUrls = this.getCandidateUrls(task.url);
    const maxAttempts = candidateUrls.length > 1 ? candidateUrls.length * 2 : 3;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const currentUrl = candidateUrls[attempt % candidateUrls.length];
      const tempPath = `${task.destPath}.part-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

      const controller = new AbortController();
      const timeoutMs = task.size && task.size > 10 * 1024 * 1024 ? 90000 : 30000;
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetch(currentUrl, {
          headers: {
            'User-Agent': 'HirokiLauncher/2.0.0 (Windows NT 10.0; Win64; x64) MinecraftLauncher/1.0',
            Accept: '*/*',
          },
          redirect: 'follow',
          signal: controller.signal,
        });

        if (!response.ok || !response.body) {
          throw new Error(`Failed to download ${currentUrl}: HTTP ${response.status} ${response.statusText}`);
        }

        const fileStream = fs.createWriteStream(tempPath);
        // @ts-expect-error Node.js Readable from web stream
        const readable = Readable.fromWeb(response.body);

        const hashSha1 = task.sha1 ? crypto.createHash('sha1') : null;
        const hashSha512 = task.sha512 ? crypto.createHash('sha512') : null;
        let downloaded = 0;
        let lastEmit = Date.now();

        const monitorStream = new Transform({
          transform(chunk, _encoding, callback) {
            downloaded += chunk.length;
            if (hashSha1) hashSha1.update(chunk);
            if (hashSha512) hashSha512.update(chunk);

            if (onProgress) {
              onProgress(downloaded, task.size);
            } else if (task.size && Date.now() - lastEmit > 100) {
              const percentage = Math.min(99, Math.round((downloaded / task.size) * 100));
              BrowserWindow.getAllWindows().forEach((w) => {
                if (!w.isDestroyed()) {
                  w.webContents.send('install:progress', percentage);
                }
              });
              lastEmit = Date.now();
            }

            callback(null, chunk);
          },
        });

        await pipeline(readable, monitorStream, fileStream);

        if (!fs.existsSync(tempPath)) {
          throw new Error(`Temp file does not exist after stream pipeline: ${tempPath}`);
        }

        const stats = fs.statSync(tempPath);
        if (task.size && stats.size !== task.size) {
          throw new Error(`Incomplete download for ${currentUrl}: received ${stats.size} bytes, expected ${task.size}`);
        }

        if (hashSha1) {
          const actualSha1 = hashSha1.digest('hex');
          if (actualSha1.toLowerCase() !== task.sha1!.toLowerCase()) {
            throw new Error(`SHA1 mismatch for ${currentUrl}: expected ${task.sha1}, got ${actualSha1}`);
          }
        }

        if (hashSha512) {
          const actualSha512 = hashSha512.digest('hex');
          if (actualSha512.toLowerCase() !== task.sha512!.toLowerCase()) {
            throw new Error(`SHA512 mismatch for ${currentUrl}: expected ${task.sha512}, got ${actualSha512}`);
          }
        }

        // Atomic move with locks handling
        await this.safeMoveFile(tempPath, task.destPath);
        return;
      } catch (err: any) {
        lastError = err;
        console.error(`[DownloaderService] Attempt ${attempt + 1}/${maxAttempts} failed for ${currentUrl}:`, err?.message || err);
        if (fs.existsSync(tempPath)) {
          try {
            fs.unlinkSync(tempPath);
          } catch (unlinkErr) {
            console.error(`[DownloaderService] Failed to cleanup temp file ${tempPath}:`, unlinkErr);
          }
        }
        if (attempt < maxAttempts - 1) {
          await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
        }
      } finally {
        clearTimeout(timeoutId);
      }
    }

    throw new Error(`Download failed for ${task.url} after ${maxAttempts} attempts: ${lastError?.message || 'unknown error'}`);
  }

  /**
   * Downloads a pool of tasks concurrently with progress tracking
   */
  public async downloadBatch(
    tasks: DownloadTask[],
    stepTitle: string,
    concurrency = 8,
    onProgress?: (progress: LaunchProgress) => void
  ): Promise<void> {
    const total = tasks.length;
    if (total === 0) return;

    let completed = 0;
    let taskIndex = 0;

    const worker = async (): Promise<void> => {
      while (taskIndex < tasks.length) {
        const currentTask = tasks[taskIndex++];
        if (!currentTask) break;

        try {
          await this.downloadFile(currentTask);
        } catch (error) {
          console.error(`[DownloaderService] Batch task failed for ${currentTask.url}:`, error);
        } finally {
          completed++;
          const percentage = Math.min(99, Math.round((completed / total) * 100));
          BrowserWindow.getAllWindows().forEach(w => w.webContents.send('install:progress', percentage));
          
          if (onProgress) {
            onProgress({
              step: stepTitle,
              percentage: percentage,
              completedFiles: completed,
              totalFiles: total,
            });
          }
        }
      }
    };

    const workers: Promise<void>[] = [];
    const activeWorkers = Math.min(concurrency, total);
    for (let i = 0; i < activeWorkers; i++) {
      workers.push(worker());
    }

    await Promise.all(workers);
  }
}
