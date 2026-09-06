const fs = require('fs');
const file = '/home/ikitto/.gemini/antigravity/scratch/hiroki-launcher/src/main/services/launcher/launch.service.ts';
let content = fs.readFileSync(file, 'utf8');

const target = `
      const fullArgs = [...jvmArgs, ...gameArgs];`;

const replacement = `
      // NEOFORGE / FORGE: dynamically add mapped client jars to classpath if present
      if (customJvm || customGame) {
        let mcpVersion = '';
        const mcpIndex = gameArgs.findIndex(a => a === '--fml.mcpVersion' || a === '--fml.neoFormVersion');
        if (mcpIndex !== -1 && mcpIndex + 1 < gameArgs.length) {
          mcpVersion = gameArgs[mcpIndex + 1];
        }

        if (mcpVersion) {
          const mappedClientDir = path.join(librariesDir, 'net', 'minecraft', 'client', \`\${instance.gameVersion}-\${mcpVersion}\`);
          if (fs.existsSync(mappedClientDir)) {
            const files = fs.readdirSync(mappedClientDir);
            for (const f of files) {
              if (f.endsWith('.jar')) {
                const jarPath = path.join(mappedClientDir, f);
                
                // Add to JVM args cp
                const cpIndex = jvmArgs.indexOf('-cp');
                if (cpIndex !== -1) {
                  jvmArgs[cpIndex + 1] = jvmArgs[cpIndex + 1] + ':' + jarPath;
                }
              }
            }
          }
        }
      }

      const fullArgs = [...jvmArgs, ...gameArgs];`;

content = content.replace(target, replacement);
fs.writeFileSync(file, content);
