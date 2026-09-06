const fs = require('fs');
let code = fs.readFileSync('./src/main/ipc/register.ts', 'utf8');

const handlers = `
  ipcMain.handle('instances:getServers', async (_event, instanceId: string) => {
    try {
      const dir = InstancesService.getInstance().getInstanceDir(instanceId);
      const serversFile = path.join(dir, 'servers.dat');
      if (!fsRaw.existsSync(serversFile)) return [];

      const buffer = fsRaw.readFileSync(serversFile);
      const { parsed } = await nbt.parse(buffer);
      
      const servers = parsed.value.servers?.value?.value || [];
      return servers.map((s: any) => ({
        name: s.name?.value,
        ip: s.ip?.value
      }));
    } catch (err) {
      console.error('[IPC] Error reading servers.dat:', err);
      return [];
    }
  });

  ipcMain.handle('instances:pingServer', async (_event, ip: string) => {
    try {
      const [host, port] = ip.split(':');
      const response = await util.status(host, port ? parseInt(port) : 25565, { timeout: 2000 });
      return {
        online: true,
        players: response.players.online,
        maxPlayers: response.players.max,
        motd: response.motd.clean
      };
    } catch (err) {
      return { online: false };
    }
  });
`;

if (!code.includes('instances:getServers')) {
  code = code.replace(/export function registerIpcHandlers\(mainWindow: BrowserWindow\): void \{/, 
    `export function registerIpcHandlers(mainWindow: BrowserWindow): void {${handlers}`);
  fs.writeFileSync('./src/main/ipc/register.ts', code);
}
