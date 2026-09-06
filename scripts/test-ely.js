const { net } = require('electron');
const { app } = require('electron');
app.whenReady().then(async () => {
    try {
        const res = await net.fetch('https://account.ely.by/api/oauth2/v1');
        console.log(await res.text());
    } catch(e) { console.error(e); }
    app.quit();
});
