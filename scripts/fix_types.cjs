const fs = require('fs');
let view = fs.readFileSync('./src/renderer/src/pages/InstanceView.tsx', 'utf8');
view = view.replace(/onNavigateToCatalog: \(category: 'mod' \| 'resourcepack' \| 'shader'\) => void;/, 
  "onNavigateToCatalog: (category: import('../../../preload/types').ContentCategory) => void;");
fs.writeFileSync('./src/renderer/src/pages/InstanceView.tsx', view);

let shelf = fs.readFileSync('./src/renderer/src/components/InstanceShelf.tsx', 'utf8');
shelf = shelf.replace(/function getModCountColor\(count: number\): string \{\n\s*if \(count > 100\) return 'var\(--yellow\)';\n\s*if \(count > 0\) return 'var\(--green\)';\n\s*return 'var\(--text-dim\)';\n\s*\}\n/s, '');
shelf = shelf.replace(/modCount, /, '');
shelf = shelf.replace(/modCount: number\n\s*/, '');
fs.writeFileSync('./src/renderer/src/components/InstanceShelf.tsx', shelf);
