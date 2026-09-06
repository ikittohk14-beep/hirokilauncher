const fs = require('fs');
const file = '/home/ikitto/.gemini/antigravity/scratch/hiroki-launcher/src/main/services/minecraft/game-installer.service.ts';
let content = fs.readFileSync(file, 'utf8');

const target = `    classpath.push(clientJarPath); // Default
    classpath.push(clientJarMavenPath); // Fallback for GameLocator`;
const replacement = `    classpath.push(clientJarPath);`;

content = content.replace(target, replacement);
fs.writeFileSync(file, content);
