const { net } = require('electron');
const { app } = require('electron');

app.whenReady().then(async () => {
  try {
    const res = await net.fetch('https://api.modrinth.com/v2/project/AANobbMI');
    console.log(res.status);
    const data = await res.json();
    console.log(data.title);
  } catch (e) {
    console.error(e);
  }
  app.quit();
});
