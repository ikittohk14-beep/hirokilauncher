const fs = require('fs');
const file = '/home/ikitto/.gemini/antigravity/scratch/hiroki-launcher/src/main/services/minecraft/game-installer.service.ts';
let content = fs.readFileSync(file, 'utf8');

const target = `const child = spawn('java', ['-jar', installerPath, '--installClient', sharedDir]);`;
const replacement = `const child = spawn('java', ['-Xmx4G', '-jar', installerPath, '--installClient', sharedDir]);`;

content = content.replace(target, replacement);

const target2 = `          child.stdout.pipe(logStream);
          child.stderr.pipe(logStream);`;
const replacement2 = `          child.stdout.pipe(logStream);
          child.stderr.pipe(logStream);
          child.stdout.on('data', d => console.log(d.toString()));
          child.stderr.on('data', d => console.error(d.toString()));`;

content = content.replace(target2, replacement2);
fs.writeFileSync(file, content);
