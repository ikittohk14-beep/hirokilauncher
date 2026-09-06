const fs = require('fs');
const file = '/home/ikitto/.gemini/antigravity/scratch/hiroki-launcher/src/main/services/minecraft/game-installer.service.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /\/\/ Append client\.jar to classpath ONLY if not modern forge\/neoforge.*?classpath\.push\(clientJarPath\);\n    \}/s,
  `// Always append client.jar to classpath
    classpath.push(clientJarPath);`
);

fs.writeFileSync(file, content);
