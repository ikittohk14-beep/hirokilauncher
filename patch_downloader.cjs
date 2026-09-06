const fs = require('fs');
let code = fs.readFileSync('./src/main/services/downloader/downloader.service.ts', 'utf8');

// Add BrowserWindow import if not present
if (!code.includes('BrowserWindow')) {
  code = code.replace(/import \{ net \} from 'electron';/, "import { net, BrowserWindow } from 'electron';");
}

// Add stream chunk tracking to downloadFile
const oldStream = `      const fileStream = fs.createWriteStream(tempPath);
      // @ts-expect-error Node.js Readable from web stream
      const readable = Readable.fromWeb(response.body);

      await pipeline(readable, fileStream);`;

const newStream = `      const fileStream = fs.createWriteStream(tempPath);
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

      await pipeline(readable, fileStream);`;

code = code.replace(oldStream, newStream);

// Add progress tracking to batchDownload
const oldBatch = `        } finally {
          completed++;
          if (onProgress) {
            onProgress({
              step: stepTitle,
              percentage: Math.round((completed / total) * 100),
              completedFiles: completed,
              totalFiles: total,
            });
          }
        }`;

const newBatch = `        } finally {
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
        }`;

code = code.replace(oldBatch, newBatch);

fs.writeFileSync('./src/main/services/downloader/downloader.service.ts', code);
