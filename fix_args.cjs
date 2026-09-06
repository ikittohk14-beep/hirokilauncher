const fs = require('fs');
const file = '/home/ikitto/.gemini/antigravity/scratch/hiroki-launcher/src/main/services/launcher/launch.service.ts';
let content = fs.readFileSync(file, 'utf8');

const replacement = `
      const standardGameArgs = [
          '--username', account.username,
          '--version', instance.gameVersion,
          '--gameDir', instanceDir,
          '--assetsDir', path.join(sharedDir, 'assets'),
          '--assetIndex', assetIndexId,
          '--uuid', account.uuid.replace(/-/g, ''),
          '--accessToken', account.accessToken || '0',
          '--userType', account.type === 'elyby' ? 'mojang' : 'legacy',
          '--versionType', 'HirokiLauncher',
      ];

      let gameArgs: string[] = [];

      if (customJvm || customGame) {
        // MODERN FORGE / NEOFORGE

        jvmArgs.push(\`-Djava.library.path=\${nativesDir}\`);
        jvmArgs.push('-cp', classpathStr);

        if (customJvm) {
          for (const arg of customJvm) {
            if (typeof arg === 'string') {
              jvmArgs.push(replaceTokens(arg));
            }
          }
        }

        jvmArgs.push(mainClass);

        gameArgs = [...standardGameArgs];

        if (customGame) {
          for (const arg of customGame) {
            if (typeof arg === 'string') {
              gameArgs.push(replaceTokens(arg));
            }
          }
        }
      } else {
        // VANILLA / FABRIC / QUILT
        jvmArgs.push(\`-Djava.library.path=\${nativesDir}\`);
        jvmArgs.push('-cp', classpathStr);
        jvmArgs.push(mainClass);

        gameArgs = [...standardGameArgs];
      }
`;

content = content.replace(/      let gameArgs: string\[\] = \[\];[\s\S]*?(?=      const fullArgs = \[)/, replacement + '\n');
fs.writeFileSync(file, content);
