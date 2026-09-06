import { Client } from 'minecraft-launcher-core';
const launcher = new Client();
const opts = {
    clientPackage: null,
    authorization: {
        access_token: '0',
        client_token: '0',
        uuid: '00000000000000000000000000000000',
        name: 'IKITTO',
        user_properties: '{}',
        meta: { type: 'mojang', demo: false }
    },
    root: '/home/ikitto/.local/share/hiroki-launcher/game_data',
    version: {
        number: '1.20.1',
        type: 'release'
    },
    memory: {
        max: '2048',
        min: '1024'
    }
};

async function test() {
    try {
        launcher.on('debug', (e) => console.log(e));
        launcher.on('data', (e) => console.log(e));
        console.log('Starting...');
        await launcher.launch(opts);
        console.log('Launched successfully?');
    } catch(err) {
        console.error(err);
    }
}
test();
