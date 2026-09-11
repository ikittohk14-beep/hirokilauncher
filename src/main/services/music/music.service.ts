import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import { BrowserWindow } from 'electron';

export class MusicService {
  private static instance: MusicService;
  private currentWindow: BrowserWindow | null = null;
  private playerctlProcess: ChildProcessWithoutNullStreams | null = null;
  private debounceTimeout: NodeJS.Timeout | null = null;
  private latestData: any = null;

  public static getInstance(): MusicService {
    if (!MusicService.instance) {
      MusicService.instance = new MusicService();
    }
    return MusicService.instance;
  }

  public setWindow(win: BrowserWindow) {
    this.currentWindow = win;
  }

  public startListening() {
    this.stopListening();
    if (process.platform !== 'linux') {
      return;
    }
    
    this.playerctlProcess = spawn('playerctl', [
      '-F', 
      'metadata', 
      '--format', 
      '{{ status }}|||{{ artist }}|||{{ title }}|||{{ mpris:artUrl }}'
    ]);

    this.playerctlProcess.on('error', (err) => {
      console.warn('[MusicService] playerctl error:', err);
    });

    this.playerctlProcess.on('exit', (code, signal) => {
      console.log('[MusicService] playerctl exited with code:', code, signal);
      this.playerctlProcess = null;
    });

    this.playerctlProcess.stdout.on('data', (data) => {
      if (!this.currentWindow || this.currentWindow.isDestroyed()) return;
      
      const lines = data.toString().split('\n');
      for (const line of lines) {
        const output = line.trim();
        if (!output) continue;
        
        const [status, artist, title, artUrl] = output.split('|||');
        
        this.latestData = { 
          status: status || 'Stopped',
          artist: artist || '',
          title: title || '',
          artUrl: artUrl || ''
         };
        if (this.debounceTimeout) clearTimeout(this.debounceTimeout);
        this.debounceTimeout = setTimeout(() => {
          if (!this.currentWindow || this.currentWindow.isDestroyed()) return;
          this.currentWindow.webContents.send('music-update', this.latestData);
        }, 100);
  
      }
    });

    this.playerctlProcess.stderr.on('data', (data) => {
      if (!this.currentWindow || this.currentWindow.isDestroyed()) return;
      const errStr = data.toString();
      if (errStr.includes('No players found')) {
        
        this.latestData = { 
          status: 'Stopped', artist: '', title: '', artUrl: ''
         };
        if (this.debounceTimeout) clearTimeout(this.debounceTimeout);
        this.debounceTimeout = setTimeout(() => {
          if (!this.currentWindow || this.currentWindow.isDestroyed()) return;
          this.currentWindow.webContents.send('music-update', this.latestData);
        }, 100);
  
      }
    });
  }

  public stopListening() {
    if (this.playerctlProcess) {
      this.playerctlProcess.kill();
      this.playerctlProcess = null;
    }
  }
}
