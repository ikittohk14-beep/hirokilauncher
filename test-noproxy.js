const { app, net } = require('electron');
app.commandLine.appendSwitch('no-proxy-server');
app.whenReady().then(async () => {
  try {
    const url = "https://api.curseforge.com/v1/mods/search?gameId=432&classId=6&pageSize=1&index=0";
    const response = await net.fetch(url, {
      headers: {
        'x-api-key': '$2a$10$bL4bIL5pUWqfcO7KQTnMReakwtfHbNKh6v1uTpKlzhwoueEJQnPnm',
      },
      signal: AbortSignal.timeout(7000)
    });
    console.log("STATUS:", response.status);
    const data = await response.json();
    console.log("HITS:", data.pagination.totalCount);
  } catch (err) {
    console.error("ERROR:", err.message);
  }
  app.quit();
});
