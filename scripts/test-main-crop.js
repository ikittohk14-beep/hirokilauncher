const { app, nativeImage, net } = require('electron');
app.commandLine.appendSwitch('no-proxy-server');

app.whenReady().then(async () => {
  try {
    const res = await net.fetch('https://ely.by/storage/skins/ae635180244ed8959b3670c2e9afd6b5.png');
    const buf = Buffer.from(await res.arrayBuffer());
    const full = nativeImage.createFromBuffer(buf);
    console.log('FULL SIZE:', full.getSize());
    
    // In nativeImage, we can crop:
    const face = full.crop({ x: 8, y: 8, width: 8, height: 8 });
    console.log('FACE SIZE:', face.getSize());
    
    const hat = full.crop({ x: 40, y: 8, width: 8, height: 8 });
    console.log('HAT SIZE:', hat.getSize());
    console.log('SUCCESSFUL CROP!');
  } catch(e) {
    console.error('FAIL:', e);
  }
  app.quit();
});
