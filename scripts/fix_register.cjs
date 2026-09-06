const fs = require('fs');
const path = './src/main/ipc/register.ts';
let code = fs.readFileSync(path, 'utf8');

if (!code.includes('content:getProject')) {
  const handler = `
  ipcMain.handle(
    'content:getProject',
    async (_event, id: string, source: 'modrinth' | 'curseforge') => {
      try {
        return await ContentService.getInstance().getProjectDetails(id, source);
      } catch (err) {
        console.error('[IPC content:getProject] Error:', err);
        return null;
      }
    }
  );
`;
  code = code.replace(/ipcMain\.handle\(\n\s*'content:search'/, handler + "\n  ipcMain.handle(\n    'content:search'");
  fs.writeFileSync(path, code);
}
