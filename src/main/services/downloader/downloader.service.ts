import { net, BrowserWindow } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
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
   * Downloads a single file with integrity check and atomic write
   */
  public async downloadFile(task: DownloadTask): Promise<void> {
    const dir = path.dirname(task.destPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Check if already downloaded and valid
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

    const tempPath = `${task.destPath}.part-${Date.now()}`;

    try {
      const response = await fetch(task.url, {
        headers: { 'User-Agent': 'HirokiLauncher/1.0' },
      });

      if (!response.ok || !response.body) {
        throw new Error(`Failed to download ${task.url}: HTTP ${response.status}`);
      }

      const fileStream = fs.createWriteStream(tempPath);
      // @ts-expect-error Node.js Readable from web stream
      const readable = Readable.fromWeb(response.body);

      let downloaded = 0;
      let lastEmit = Date.now();
      readable.on('data', (chunk) => {
        downloaded += chunk.length;
        if (task.size && Date.now() - lastEmit > 100) { // throttle to 100ms
          const percentage = Math.min(99, Math.round((downloaded / task.size) * 100));
          BrowserWindow.getAllWindows().forEach(w => w.webContents.send('install:progress', percentage));
          lastEmit = Date.now();
        }
      });

      await pipeline(readable, fileStream);

      // Verify checksum on the temp file
      if (task.sha1 && !this.verifyFileChecksum(tempPath, task.sha1, 'sha1')) {
        throw new Error(`SHA1 mismatch for ${task.url}`);
      }
      if (task.sha512 && !this.verifyFileChecksum(tempPath, task.sha512, 'sha512')) {
        throw new Error(`SHA512 mismatch for ${task.url}`);
      }

      // Atomic rename
      if (fs.existsSync(task.destPath)) {
        fs.unlinkSync(task.destPath);
      }
      fs.renameSync(tempPath, task.destPath);
    } catch (error) {
      console.error(`[DownloaderService] Error downloading ${task.url}:`, error);
      if (fs.existsSync(tempPath)) {
        try {
          fs.unlinkSync(tempPath);
        } catch {}
      }
      throw error;
    }
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
