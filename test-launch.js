import { app } from 'electron';
import { GameInstallerService } from './dist-electron/main/services/minecraft/game-installer.service.js';
app.whenReady().then(async () => {
  try {
    console.log('Testing...');
    await GameInstallerService.getInstance().getVanillaVersionDetails('26.2');
    console.log('Done!');
  } catch(e) {
    console.error('Error:', e.message);
  }
  app.quit();
});
