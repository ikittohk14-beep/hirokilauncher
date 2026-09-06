const fs = require('fs');
const file = '/home/ikitto/.gemini/antigravity/scratch/hiroki-launcher/src/main/services/minecraft/game-installer.service.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /      classpath,/,
  `      classpath: Array.from(new Set(classpath)),`
);

fs.writeFileSync(file, content);
