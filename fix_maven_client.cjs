const fs = require('fs');
const path = require('path');
const file = '/home/ikitto/.gemini/antigravity/scratch/hiroki-launcher/src/main/services/launcher/launch.service.ts';
let content = fs.readFileSync(file, 'utf8');

// Replace the standard clientJarPath logic
const target = /      const clientJarPath = path\.join\(versionsDir, instance\.gameVersion, \`\$\{instance\.gameVersion\}\.jar\`\);\n      classpath\.push\(clientJarPath\);/;

const replacement = `      // Use Maven path for Vanilla Jar so NeoForge GameLocator can find it!
      const clientJarMavenDir = path.join(librariesDir, 'net', 'minecraft', 'client', instance.gameVersion);
      const clientJarMavenPath = path.join(clientJarMavenDir, \`client-\${instance.gameVersion}.jar\`);
      
      const originalClientJarPath = path.join(versionsDir, instance.gameVersion, \`\${instance.gameVersion}.jar\`);
      
      if (!fs.existsSync(clientJarMavenDir)) {
        fs.mkdirSync(clientJarMavenDir, { recursive: true });
      }
      
      if (!fs.existsSync(clientJarMavenPath) && fs.existsSync(originalClientJarPath)) {
        fs.copyFileSync(originalClientJarPath, clientJarMavenPath);
      }
      
      if (instance.loaderType === 'forge' || instance.loaderType === 'neoforge') {
        classpath.push(clientJarMavenPath);
      } else {
        classpath.push(originalClientJarPath);
      }`;

content = content.replace(target, replacement);

fs.writeFileSync(file, content);
