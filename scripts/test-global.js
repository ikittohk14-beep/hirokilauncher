const { app, net } = require('electron');

app.whenReady().then(async () => {
  global.fetch = (...args) => net.fetch(...args);
  
  try {
    const res = await fetch('https://api.curseforge.com/v1/mods/search?gameId=432&classId=6&pageSize=1&gameVersion=26.2&modLoaderType=4', {
      headers: {
        'x-api-key': '$2a$10$bL4bIL5pUWqfcO7KQTnMReakwtfHbNKh6v1uTpKlzhwoueEJQnPnm'
      }
    });
    const data = await res.json();
    console.log("SUCCESS:", data.pagination.totalCount);
  } catch (err) {
    console.error("FAIL:", err);
  }
  app.quit();
});
