const fs = require('fs');
let code = fs.readFileSync('./src/main/services/storage/instances.service.ts', 'utf8');

const oldLoop = `        const files = fs.readdirSync(dirPath);
        for (const file of files) {
          if (file.endsWith('.jar') || file.endsWith('.jar.disabled') || file.endsWith('.zip') || file.endsWith('.zip.disabled')) {`;

const newLoop = `        const files = fs.readdirSync(dirPath, { withFileTypes: true });
        for (const dirent of files) {
          const file = dirent.name;
          const isDir = dirent.isDirectory();
          
          if ((type === 'map' && isDir) || file.endsWith('.jar') || file.endsWith('.jar.disabled') || file.endsWith('.zip') || file.endsWith('.zip.disabled')) {`;

code = code.replace(oldLoop, newLoop);

fs.writeFileSync('./src/main/services/storage/instances.service.ts', code);
