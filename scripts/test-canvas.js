const { app, BrowserWindow } = require('electron');
app.whenReady().then(async () => {
  const win = new BrowserWindow({ show: false, webPreferences: { offscreen: true } });
  win.loadURL('about:blank');
  const res = await win.webContents.executeJavaScript(`
    new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 64;
          canvas.height = 64;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 8, 8, 8, 8, 0, 0, 64, 64);
          ctx.drawImage(img, 40, 8, 8, 8, 0, 0, 64, 64);
          resolve({ success: true, width: img.width, height: img.height });
        } catch(e) {
          resolve({ success: false, error: e.message });
        }
      };
      img.onerror = (e) => resolve({ success: false, error: 'img load error' });
      img.src = 'http://skinsystem.ely.by/skins/_Ikitto_.png';
    });
  `);
  console.log('RESULT WITHOUT CROSSORIGIN:', JSON.stringify(res));
  
  const resCross = await win.webContents.executeJavaScript(`
    new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve({ success: true });
      img.onerror = (e) => resolve({ success: false, error: 'img load error with crossOrigin' });
      img.src = 'http://skinsystem.ely.by/skins/_Ikitto_.png';
    });
  `);
  console.log('RESULT WITH CROSSORIGIN:', JSON.stringify(resCross));
  app.quit();
});
