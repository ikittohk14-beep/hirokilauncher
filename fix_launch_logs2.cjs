const fs = require('fs');
const file = '/home/ikitto/.gemini/antigravity/scratch/hiroki-launcher/src/main/services/launcher/launch.service.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /const child = spawn\(javaExecutable, fullArgs, \{/,
  `fs.appendFileSync('/tmp/hiroki-game.log', '[SPAWN ARGS]\\n' + fullArgs.join('\\n') + '\\n');
      const child = spawn(javaExecutable, fullArgs, {`
);

fs.writeFileSync(file, content);
