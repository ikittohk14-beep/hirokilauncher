const fs = require('fs');
const file = '/home/ikitto/.gemini/antigravity/scratch/hiroki-launcher/src/main/services/minecraft/game-installer.service.ts';
let content = fs.readFileSync(file, 'utf8');

const target = `          child.stdout.on('data', (d) => fs.appendFileSync(installerLog, d));
          child.stderr.on('data', (d) => fs.appendFileSync(installerLog, d));`;

const replacement = `          const logStream = fs.createWriteStream(installerLog, { flags: 'a' });
          child.stdout.pipe(logStream);
          child.stderr.pipe(logStream);`;

content = content.replace(target, replacement);
fs.writeFileSync(file, content);
