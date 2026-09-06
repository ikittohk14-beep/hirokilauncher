const fs = require('fs');
const path = './src/preload/index.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(/search: \(.*?=>\n.*?ipcRenderer\.invoke\('content:search',\n\s*getProject:.*?page\),/s, 
  `search: (query: string, category: ContentCategory, gameVersion?: string, loader?: ModLoaderType, source?: 'modrinth' | 'curseforge', page?: number) =>
      ipcRenderer.invoke('content:search', query, category, gameVersion, loader, source, page),
    getProject: (id: string, source: string) => ipcRenderer.invoke('content:getProject', id, source),`);

fs.writeFileSync(path, code);
