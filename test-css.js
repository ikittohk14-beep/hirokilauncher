const { app, BrowserWindow } = require('electron');
app.commandLine.appendSwitch('no-proxy-server');
app.whenReady().then(async () => {
  const win = new BrowserWindow({ width: 200, height: 200, show: false });
  const html = `
    <!DOCTYPE html>
    <html>
      <body style="margin:0; background: #222;">
        <div style="position: relative; width: 64px; height: 64px; overflow: hidden; image-rendering: pixelated;">
          <div style="position: absolute; width: 100%; height: 100%; background-image: url('http://skinsystem.ely.by/skins/_Ikitto_.png'); background-size: 800% 800%; background-position: 14.2857% 14.2857%; image-rendering: pixelated;"></div>
          <div style="position: absolute; width: 100%; height: 100%; background-image: url('http://skinsystem.ely.by/skins/_Ikitto_.png'); background-size: 800% 800%; background-position: 71.4285% 14.2857%; image-rendering: pixelated;"></div>
        </div>
      </body>
    </html>
  `;
  await win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
  await new Promise(r => setTimeout(r, 1500));
  const image = await win.capturePage({ x: 0, y: 0, width: 64, height: 64 });
  require('fs').writeFileSync('/tmp/test-css-face.png', image.toPNG());
  console.log('SAVED /tmp/test-css-face.png! Size:', image.toPNG().length);
  app.quit();
});
