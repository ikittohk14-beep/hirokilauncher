const fs = require('fs');
let code = fs.readFileSync('./src/renderer/src/components/BentoGrid.tsx', 'utf8');

code = code.replace(/launchStatus,\n\s*onLaunch,/, "launchStatus,\n  currentAccount,\n  onLaunch,");

fs.writeFileSync('./src/renderer/src/components/BentoGrid.tsx', code);
