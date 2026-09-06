const { app } = require('electron');
const { ContentService } = require('./dist-electron/main/index.js');

app.whenReady().then(async () => {
  try {
    const service = ContentService.getInstance();
    const result = await service.search('', 'mod', '26.2', 'fabric', 'curseforge', 0);
    console.log("HITS:", result.totalHits);
  } catch(err) {
    console.error("ERR:", err);
  }
  app.quit();
});
