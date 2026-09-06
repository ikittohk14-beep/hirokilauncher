const fs = require('fs');
let code = fs.readFileSync('./src/main/ipc/register.ts', 'utf8');

// Remove prismarine-nbt and duplicate imports
code = code.replace(/import nbt from 'prismarine-nbt';/, "import * as nbt from 'nbt';");
code = code.replace(/import path from 'path';\n/, "");
code = code.replace(/import fsRaw from 'fs';\n/, "");
code = code.replace(/fsRaw/g, "fs");

// Update getServers to use callback nbt
const oldGetServers = /const buffer = fs\.readFileSync\(serversFile\);\n\s*const \{ parsed \} = await nbt\.parse\(buffer\);\n\s*const servers = parsed\.value\.servers\?\.value\?\.value \|\| \[\];\n\s*return servers\.map\(\(s: any\) => \(\{\n\s*name: s\.name\?\.value,\n\s*ip: s\.ip\?\.value\n\s*\}\)\);/s;

const newGetServers = `const buffer = fs.readFileSync(serversFile);
      const servers = await new Promise<any[]>((resolve, reject) => {
        nbt.parse(buffer, (error: any, data: any) => {
          if (error) {
            reject(error);
          } else {
            const s = data.value.servers?.value?.value || [];
            resolve(s.map((item: any) => ({
              name: item.name?.value,
              ip: item.ip?.value
            })));
          }
        });
      });
      return servers;`;

code = code.replace(oldGetServers, newGetServers);

fs.writeFileSync('./src/main/ipc/register.ts', code);
