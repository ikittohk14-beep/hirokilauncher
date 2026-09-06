const fs = require('fs');
const file = '/home/ikitto/.gemini/antigravity/scratch/hiroki-launcher/src/main/services/launcher/launch.service.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/await import\("node:fs"\)\.appendFileSync/g, 'fs.appendFileSync');

fs.writeFileSync(file, content);
