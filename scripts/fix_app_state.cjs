const fs = require('fs');
const file = '/home/ikitto/.gemini/antigravity/scratch/hiroki-launcher/src/renderer/src/App.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `setIsRunning(state.isActive);
      if (!state.isActive) {`;
const replacement = `setIsRunning(state.isRunning);
      if (!state.isRunning) {`;

content = content.replace(target, replacement);
fs.writeFileSync(file, content);
