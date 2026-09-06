const fs = require('fs');
const file = '/home/ikitto/.gemini/antigravity/scratch/hiroki-launcher/src/main/services/launcher/launch.service.ts';
let content = fs.readFileSync(file, 'utf8');

// Replace the previous fix
const target = /      \/\/ NEOFORGE \/ FORGE: dynamically add mapped client jars.*?const fullArgs = \[\.\.\.jvmArgs, \.\.\.gameArgs\];/s;

const replacement = `      // NEOFORGE / FORGE: dynamically add mapped client jars to classpath if present
      if (customJvm || customGame) {
        let mcpVersion = '';
        const mcpIndex = gameArgs.findIndex(a => a === '--fml.mcpVersion' || a === '--fml.neoFormVersion');
        if (mcpIndex !== -1 && mcpIndex + 1 < gameArgs.length) {
          mcpVersion = gameArgs[mcpIndex + 1];
        }

        if (mcpVersion) {
          const mappedClientDir = path.join(librariesDir, 'net', 'minecraft', 'client', \`\${instance.gameVersion}-\${mcpVersion}\`);
          if (fs.existsSync(mappedClientDir)) {
            const cpIndex = jvmArgs.indexOf('-cp');
            if (cpIndex !== -1) {
               // Add the extra and slim jars
               const slimJar = path.join(mappedClientDir, \`client-\${instance.gameVersion}-\${mcpVersion}-slim.jar\`);
               const extraJar = path.join(mappedClientDir, \`client-\${instance.gameVersion}-\${mcpVersion}-extra.jar\`);
               if (fs.existsSync(slimJar)) jvmArgs[cpIndex + 1] += ':' + slimJar;
               if (fs.existsSync(extraJar)) jvmArgs[cpIndex + 1] += ':' + extraJar;
               
               // Also add the mappings file or its directory to classpath if needed!
               jvmArgs[cpIndex + 1] += ':' + mappedClientDir;
            }
          }
        }
      }

      const fullArgs = [...jvmArgs, ...gameArgs];`;

content = content.replace(target, replacement);
fs.writeFileSync(file, content);
