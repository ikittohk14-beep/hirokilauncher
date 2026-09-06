const fs = require('fs');
const file = '/home/ikitto/.gemini/antigravity/scratch/hiroki-launcher/src/main/services/minecraft/game-installer.service.ts';
let content = fs.readFileSync(file, 'utf8');

const target = `    // Always append client.jar to classpath
    classpath.push(clientJarPath);`;

const replacement = `    // Provide Vanilla jar
    // We copy it to Maven format so modern Forge/NeoForge can locate it easily.
    const clientJarMavenDir = path.join(librariesDir, 'net', 'minecraft', 'client', instance.gameVersion);
    const clientJarMavenPath = path.join(clientJarMavenDir, \`client-\${instance.gameVersion}.jar\`);
    
    if (!fs.existsSync(clientJarMavenDir)) {
      fs.mkdirSync(clientJarMavenDir, { recursive: true });
    }
    
    if (fs.existsSync(clientJarPath) && !fs.existsSync(clientJarMavenPath)) {
      fs.copyFileSync(clientJarPath, clientJarMavenPath);
    }
    
    classpath.push(clientJarPath); // Default
    classpath.push(clientJarMavenPath); // Fallback for GameLocator
    `;

content = content.replace(target, replacement);
fs.writeFileSync(file, content);
