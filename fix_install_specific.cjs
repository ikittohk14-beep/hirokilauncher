const fs = require('fs');
let code = fs.readFileSync('./src/renderer/src/pages/Catalog.tsx', 'utf8');

code = code.replace(/const meta = await window\.electronAPI\.instances\.getModsMetadata\(targetInstanceId\);\n\s*setInstalledMap\(meta \|\| \{\}\);\n\s*const mods = await window\.electronAPI\.instances\.getMods\(targetInstanceId\);\n\s*setLocalMods\(mods \|\| \[\]\);/g, 
  "setInstalledMap((prev) => ({ ...prev, [item.id]: { filename: versionToInstall.filename } }));");

fs.writeFileSync('./src/renderer/src/pages/Catalog.tsx', code);
