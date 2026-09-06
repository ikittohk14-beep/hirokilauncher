const fs = require('fs');
const path = require('path');
const file = '/home/ikitto/.gemini/antigravity/scratch/hiroki-launcher/src/main/services/minecraft/game-installer.service.ts';
let content = fs.readFileSync(file, 'utf8');

const target = /      if \(\!fs\.existsSync\(profileJsonPath\)\) \{/g;
const replacement = `      
      // Verification for corrupted installations
      let isInstalled = fs.existsSync(profileJsonPath);
      if (isInstalled) {
        if (isForge) {
          const forgeClientJar = path.join(sharedDir, 'libraries', 'net', 'minecraftforge', 'forge', \`\${instance.gameVersion}-\${loaderVer}\`, \`forge-\${instance.gameVersion}-\${loaderVer}-client.jar\`);
          if (!fs.existsSync(forgeClientJar)) {
            isInstalled = false;
            fs.unlinkSync(profileJsonPath);
          }
        } else {
          const neoClientJar = path.join(sharedDir, 'libraries', 'net', 'neoforged', 'neoforge', loaderVer, \`neoforge-\${loaderVer}-client.jar\`);
          if (!fs.existsSync(neoClientJar)) {
            isInstalled = false;
            fs.unlinkSync(profileJsonPath);
          }
        }
      }

      if (!isInstalled) {`;

content = content.replace(target, replacement);

fs.writeFileSync(file, content);
