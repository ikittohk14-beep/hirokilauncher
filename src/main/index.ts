import { app, BrowserWindow, shell } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dns from 'node:dns';
import { registerIpcHandlers } from './ipc/register';
import { net } from 'electron';


// Workaround for Node.js fetch() failing on some Linux systems with IPv6 issues
dns.setDefaultResultOrder('ipv4first');

// Properly configure proxy instead of disabling it, since direct DNS might be blocked
const proxyUrlStr = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
if (proxyUrlStr) {
  try {
    const proxyUrl = new URL(proxyUrlStr);
    app.commandLine.appendSwitch('proxy-server', `${proxyUrl.protocol}//${proxyUrl.hostname}:${proxyUrl.port}`);
    if (proxyUrl.username && proxyUrl.password) {
      app.on('login', (event, webContents, request, authInfo, callback) => {
        if (authInfo.isProxy) {
          event.preventDefault();
          callback(proxyUrl.username, proxyUrl.password);
        }
      });
    }
  } catch(e) {
    console.error('Failed to parse proxy URL', e);
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 1050,
    minHeight: 720,
    frame: false,
    backgroundColor: '#0f111a',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.cjs'),
      contextIsolation: true,
      webSecurity: false,
      nodeIntegration: false,
    },
  });

  win.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(__dirname, '../../dist/index.html'));
  }

  return win;
}

if (process.platform === 'linux') {
  app.disableHardwareAcceleration();
}
app.whenReady().then(() => {
  mainWindow = createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createWindow();
    }
  });

  registerIpcHandlers(mainWindow);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
