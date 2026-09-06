const { app, nativeImage, net } = require('electron');
app.commandLine.appendSwitch('no-proxy-server');

app.whenReady().then(async () => {
  try {
    const res = await net.fetch('http://skinsystem.ely.by/skins/_Ikitto_.png');
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const skinImg = nativeImage.createFromBuffer(buffer);
    console.log('SKIN SIZE:', skinImg.getSize());
    
    // Crop face (8, 8, 8, 8)
    const face = skinImg.crop({ x: 8, y: 8, width: 8, height: 8 });
    console.log('FACE SIZE:', face.getSize());
    console.log('DATA URL (first 50 chars):', face.toDataURL().substring(0, 50));
  } catch(e) {
    console.error('ERROR:', e);
  }
  app.quit();
});
