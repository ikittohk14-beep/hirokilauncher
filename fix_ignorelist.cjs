const fs = require('fs');
const file = '/home/ikitto/.gemini/antigravity/scratch/hiroki-launcher/src/main/services/launcher/launch.service.ts';
let content = fs.readFileSync(file, 'utf8');

const target = `.replace(/\\$\\{version_name\\}/g, instance.gameVersion)`;
const replacement = `.replace(/\\$\\{version_name\\}/g, instance.gameVersion)
          .replace(/-DignoreList=([^\\s]+)/g, '-DignoreList=$1,client-' + instance.gameVersion + '.jar')`;

content = content.replace(target, replacement);
fs.writeFileSync(file, content);
