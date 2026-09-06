const fs = require('fs');
const file = '/home/ikitto/.gemini/antigravity/scratch/hiroki-launcher/src/main/services/launcher/launch.service.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /const child = spawn\(javaPath, \[\.\.\.jvmArgs, mainClass, \.\.\.gameArgs\], \{/,
  `fs.appendFileSync('/tmp/hiroki-game.log', '[SPAWN ARGS] javaPath=' + javaPath + '\\nJVM: ' + JSON.stringify(jvmArgs) + '\\nMAIN: ' + mainClass + '\\nGAME: ' + JSON.stringify(gameArgs) + '\\n');\nconst child = spawn(javaPath, [...jvmArgs, mainClass, ...gameArgs], {`
);

fs.writeFileSync(file, content);
