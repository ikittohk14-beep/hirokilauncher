const fs = require('fs');
let code = fs.readFileSync('./src/renderer/src/components/BentoGrid.tsx', 'utf8');

// Imports
code = code.replace(/import SessionCard from '\.\/SessionCard'\nimport HeatmapCard from '\.\/HeatmapCard'/, 
  "import ActivityWidget from './ActivityWidget'");

// Replacements in col1 block
code = code.replace(/<div style=\{\{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%' \}\}>\n\s*<div style=\{\{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' \}\}>\n\s*<SessionCard\n\s*instanceId=\{selectedInstance\?\.id\}\n\s*instanceName=\{selectedInstance\?\.name \?\? 'NO INSTANCE'\}\n\s*hoursToday=\{0\.0\}\n\s*isActive=\{launchStatus !== null\}\n\s*\/>\n\s*<\/div>\n\s*<div style=\{\{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' \}\}>\n\s*<HeatmapCard \/>\n\s*<\/div>\n\s*<\/div>/, 
  `<div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <ActivityWidget instances={instances} />
      </div>`);

fs.writeFileSync('./src/renderer/src/components/BentoGrid.tsx', code);
