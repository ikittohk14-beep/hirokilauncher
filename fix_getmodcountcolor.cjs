const fs = require('fs');
let shelf = fs.readFileSync('./src/renderer/src/components/InstanceShelf.tsx', 'utf8');

const regex = /function getModCountColor[\s\S]*?\}\n/;
shelf = shelf.replace(regex, '');

fs.writeFileSync('./src/renderer/src/components/InstanceShelf.tsx', shelf);
