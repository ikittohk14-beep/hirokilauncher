const fs = require('fs');
let code = fs.readFileSync('./src/renderer/src/pages/Catalog.tsx', 'utf8');

code = code.replace(/window\.electronAPI\.content\.onInstallProgress/g, 'window.electronAPI.onInstallProgress');

fs.writeFileSync('./src/renderer/src/pages/Catalog.tsx', code);
