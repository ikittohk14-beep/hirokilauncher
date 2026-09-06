const { app, net } = require('electron');

app.whenReady().then(async () => {
  try {
    const url = "https://api.curseforge.com/v1/mods/search?gameId=432&classId=6&pageSize=20&index=0&gameVersion=26.2&modLoaderType=4";
    const response = await net.fetch(url, {
      headers: {
        'x-api-key': '$2a$10$bL4bIL5pUWqfcO7KQTnMReakwtfHbNKh6v1uTpKlzhwoueEJQnPnm',
        'User-Agent': 'HirokiLauncher/1.0',
      }
    });
    console.log("STATUS:", response.status);
    const data = await response.json();
    console.log("HITS:", data.pagination.totalCount);
  } catch (err) {
    console.error("ERROR:", err);
  }
  app.quit();
});
