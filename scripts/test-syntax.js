const fs = require('fs');
const content = fs.readFileSync('src/renderer/src/pages/Instances.tsx', 'utf-8');
const acorn = require('acorn-jsx'); // if available, or just babel
console.log("Length:", content.length);
