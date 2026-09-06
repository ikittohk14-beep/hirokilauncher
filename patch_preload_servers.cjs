const fs = require('fs');
let types = fs.readFileSync('./src/preload/types.ts', 'utf8');

const newTypes = `  openFolder: (instanceId: string) => Promise<boolean>;
  getServers: (instanceId: string) => Promise<{name: string, ip: string}[]>;
  pingServer: (ip: string) => Promise<{online: boolean, players?: number, maxPlayers?: number, motd?: string}>;`;
types = types.replace(/openFolder: \(instanceId: string\) => Promise<boolean>;/, newTypes);
fs.writeFileSync('./src/preload/types.ts', types);

let preload = fs.readFileSync('./src/preload/index.ts', 'utf8');
const newPreload = `    openFolder: (id) => ipcRenderer.invoke('instances:openFolder', id),
    getServers: (id) => ipcRenderer.invoke('instances:getServers', id),
    pingServer: (ip) => ipcRenderer.invoke('instances:pingServer', ip),`;
preload = preload.replace(/openFolder: \(id\) => ipcRenderer\.invoke\('instances:openFolder', id\),/, newPreload);
fs.writeFileSync('./src/preload/index.ts', preload);
