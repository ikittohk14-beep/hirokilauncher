const fs = require('fs');
const file = '/home/ikitto/.gemini/antigravity/scratch/hiroki-launcher/src/main/services/launcher/launch.service.ts';
let content = fs.readFileSync(file, 'utf8');

// Replace the if/else block around customJvm
const targetRegex = /        if \(customJvm\) \{\n          for \(const arg of customJvm\) \{\n            if \(typeof arg === 'string'\) \{\n              jvmArgs\.push\(replaceTokens\(arg\)\);\n            \}\n          \}\n        \} else \{\n          jvmArgs\.push\(`-Djava\.library\.path=\$\{nativesDir\}`\);\n          jvmArgs\.push\('-cp', classpathStr\);\n        \}/;

const replacement = `
        jvmArgs.push(\`-Djava.library.path=\${nativesDir}\`);
        jvmArgs.push('-cp', classpathStr);

        if (customJvm) {
          for (const arg of customJvm) {
            if (typeof arg === 'string') {
              jvmArgs.push(replaceTokens(arg));
            }
          }
        }`;

content = content.replace(targetRegex, replacement);

fs.writeFileSync(file, content);
