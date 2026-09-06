const fs = require('fs');
const file = '/home/ikitto/.gemini/antigravity/scratch/hiroki-launcher/src/main/services/launcher/launch.service.ts';
let content = fs.readFileSync(file, 'utf8');

const target = /      \/\/ NEOFORGE \/ FORGE: dynamically add mapped client jars.*?const fullArgs = \[\.\.\.jvmArgs, \.\.\.gameArgs\];/s;
const replacement = `      const fullArgs = [...jvmArgs, ...gameArgs];`;

content = content.replace(target, replacement);
fs.writeFileSync(file, content);
