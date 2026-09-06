const fs = require('fs');
const file = '/home/ikitto/.gemini/antigravity/scratch/hiroki-launcher/src/main/services/minecraft/game-installer.service.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /\/\/ Always append client\.jar to classpath\n    classpath\.push\(clientJarPath\);/,
  `// Append client.jar ONLY for Vanilla, Fabric, and Quilt. Forge/NeoForge load their mapped jars dynamically.
    if (instance.loaderType !== 'forge' && instance.loaderType !== 'neoforge') {
      classpath.push(clientJarPath);
    }`
);

fs.writeFileSync(file, content);
