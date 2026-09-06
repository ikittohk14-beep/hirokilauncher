const { net, app } = require('electron');
app.commandLine.appendSwitch('no-proxy-server');
app.whenReady().then(async () => {
    try {
        const deviceCodeRes = await net.fetch('https://account.ely.by/api/oauth2/v1/devicecode', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: 'elyprism-launcher',
                scope: 'account_info offline_access minecraft_server_session'
            }).toString()
        });
        const d = await deviceCodeRes.json();
        console.log("Got code:", d.user_code);
        console.log("Visit:", d.verification_uri + "?user_code=" + d.user_code);
        
        let attempts = 0;
        while (attempts < 10) {
            attempts++;
            await new Promise(r => setTimeout(r, d.interval * 1000));
            console.log("Polling...");
            const tokenRes = await net.fetch('https://account.ely.by/api/oauth2/v1/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    client_id: 'elyprism-launcher',
                    grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
                    device_code: d.device_code
                }).toString()
            });
            const t = await tokenRes.json();
            if (t.access_token) {
                console.log("SUCCESS!", t.access_token.substring(0, 10));
                
                // Get profile
                const profRes = await net.fetch('https://account.ely.by/api/mojang/services/minecraft/profile', {
                   headers: { 'Authorization': 'Bearer ' + t.access_token }
                });
                console.log("Profile:", await profRes.json());
                break;
            } else {
                console.log("Result:", t.error);
            }
        }
    } catch(e) { console.error(e); }
    app.quit();
});
