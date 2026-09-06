const fs = require('fs');

const mainPath = './src/main/index.ts';
let mainCode = fs.readFileSync(mainPath, 'utf8');
if (!mainCode.includes('content:getProject')) {
  mainCode = mainCode.replace(/ipcMain\.handle\('content:search', async.*?\}\);/s, 
    match => match + "\n  ipcMain.handle('content:getProject', async (_, id, source) => ContentService.getInstance().getProjectDetails(id, source));");
  fs.writeFileSync(mainPath, mainCode);
}

const preloadPath = './src/preload/index.ts';
let preloadCode = fs.readFileSync(preloadPath, 'utf8');
if (!preloadCode.includes('getProject:')) {
  preloadCode = preloadCode.replace(/search: \(.*?\).*?,/s, 
    match => match + "\n    getProject: (id: string, source: string) => ipcRenderer.invoke('content:getProject', id, source),");
  fs.writeFileSync(preloadPath, preloadCode);
}
