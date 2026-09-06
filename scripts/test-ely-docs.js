const { net, app } = require('electron');
app.commandLine.appendSwitch('no-proxy-server');
app.whenReady().then(async () => {
    try {
        const res = await net.fetch('https://docs.ely.by/ru/oauth.html');
        const text = await res.text();
        console.log(text.substring(0, 5000));
        require('fs').writeFileSync('/tmp/oauth.html', text);
    } catch(e) { console.error(e); }
    app.quit();
});
