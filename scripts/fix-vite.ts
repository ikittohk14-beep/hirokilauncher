import fs from 'node:fs';

let config = fs.readFileSync('vite.config.ts', 'utf-8');
const firstSsr = config.indexOf('ssr: true,');
config = config.slice(0, firstSsr) + config.slice(firstSsr + 10);
fs.writeFileSync('vite.config.ts', config);
