const fs = require('fs');

let launchService = fs.readFileSync('/home/ikitto/.gemini/antigravity/scratch/hiroki-launcher/src/main/services/launcher/launch.service.ts', 'utf8');
launchService = launchService.replace(/isRunning: boolean/g, 'isActive: boolean');
launchService = launchService.replace(/isRunning: true/g, 'isActive: true');
launchService = launchService.replace(/isRunning: false/g, 'isActive: false');
fs.writeFileSync('/home/ikitto/.gemini/antigravity/scratch/hiroki-launcher/src/main/services/launcher/launch.service.ts', launchService);

let preloadIndex = fs.readFileSync('/home/ikitto/.gemini/antigravity/scratch/hiroki-launcher/src/preload/index.ts', 'utf8');
preloadIndex = preloadIndex.replace(/isRunning: boolean/g, 'isActive: boolean');
fs.writeFileSync('/home/ikitto/.gemini/antigravity/scratch/hiroki-launcher/src/preload/index.ts', preloadIndex);

let appTsx = fs.readFileSync('/home/ikitto/.gemini/antigravity/scratch/hiroki-launcher/src/renderer/src/App.tsx', 'utf8');
appTsx = appTsx.replace(/state.isRunning/g, 'state.isActive');
fs.writeFileSync('/home/ikitto/.gemini/antigravity/scratch/hiroki-launcher/src/renderer/src/App.tsx', appTsx);

