const fs = require('fs');
const file = '/home/ikitto/.gemini/antigravity/scratch/hiroki-launcher/src/main/services/launcher/launch.service.ts';
let content = fs.readFileSync(file, 'utf8');

const target = `
        gameArgs = [...standardGameArgs];

        if (customGame) {
          for (const arg of customGame) {
            if (typeof arg === 'string') {
              gameArgs.push(replaceTokens(arg));
            }
          }
        }`;

const replacement = `
        const hasLegacyMinecraftArgs = customGame && customGame.some(a => typeof a === 'string' && a.includes('\${auth_player_name}'));
        
        if (!hasLegacyMinecraftArgs) {
          gameArgs = [...standardGameArgs];
        } else {
          gameArgs = []; // Legacy arguments already contain all standard tokens
        }

        if (customGame) {
          for (const arg of customGame) {
            if (typeof arg === 'string') {
              gameArgs.push(replaceTokens(arg));
            }
          }
        }`;

content = content.replace(target, replacement);
fs.writeFileSync(file, content);
