const fs = require('fs');
let code = fs.readFileSync('./src/renderer/src/components/BentoGrid.tsx', 'utf8');

code = code.replace(/import ArtCard from '\.\/ArtCard'/, "import ServerCard from './ServerCard'");
code = code.replace(/<ArtCard username=\{currentAccount\?\.username\} \/>/, "<ServerCard instanceId={selectedInstance?.id} />");

fs.writeFileSync('./src/renderer/src/components/BentoGrid.tsx', code);
