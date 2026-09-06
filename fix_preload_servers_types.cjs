const fs = require('fs');

let types = fs.readFileSync('./src/preload/types.ts', 'utf8');
const newTypes = `openFolder: (instanceId: string) => Promise<void>;
    getServers: (instanceId: string) => Promise<{name: string, ip: string}[]>;
    pingServer: (ip: string) => Promise<{online: boolean, players?: number, maxPlayers?: number, motd?: string}>;`;
types = types.replace(/openFolder: \(instanceId: string\) => Promise<void>;/, newTypes);
fs.writeFileSync('./src/preload/types.ts', types);

let preload = fs.readFileSync('./src/preload/index.ts', 'utf8');
const newPreload = `openFolder: (instanceId: string) => ipcRenderer.invoke('instances:openFolder', instanceId),
    getServers: (instanceId: string) => ipcRenderer.invoke('instances:getServers', instanceId),
    pingServer: (ip: string) => ipcRenderer.invoke('instances:pingServer', ip),`;
preload = preload.replace(/openFolder: \(instanceId: string\) => ipcRenderer\.invoke\('instances:openFolder', instanceId\),/, newPreload);
fs.writeFileSync('./src/preload/index.ts', preload);

let bentogrid = fs.readFileSync('./src/renderer/src/components/BentoGrid.tsx', 'utf8');
bentogrid = bentogrid.replace(/currentAccount,\n\s*/, '');
fs.writeFileSync('./src/renderer/src/components/BentoGrid.tsx', bentogrid);

let servercard = fs.readFileSync('./src/renderer/src/components/ServerCard.tsx', 'utf8');
servercard = servercard.replace(/window\.electronAPI\.instances\.pingServer\(server\.ip\)\.then\(p => \{/, "window.electronAPI.instances.pingServer(server.ip).then((p: any) => {");
fs.writeFileSync('./src/renderer/src/components/ServerCard.tsx', servercard);
