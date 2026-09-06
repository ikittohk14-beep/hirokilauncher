const fs = require('fs');
let code = fs.readFileSync('./src/renderer/src/components/BentoGrid.tsx', 'utf8');

code = code.replace(/import ServerCard from '\.\/ServerCard'/, "import ArtCard from './ArtCard'");
code = code.replace(/<ServerCard instanceId=\{selectedInstance\?\.id\} \/>/, "<ArtCard username={currentAccount?.username} />");

fs.writeFileSync('./src/renderer/src/components/BentoGrid.tsx', code);
