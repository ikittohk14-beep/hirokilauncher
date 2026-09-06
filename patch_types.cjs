const fs = require('fs');
const path = './src/preload/types.ts';
let code = fs.readFileSync(path, 'utf8');

if (!code.includes('getProject(')) {
  code = code.replace(/search: \(.*?\).*?,/s, 
    match => match + "\n    getProject: (id: string, source: string) => Promise<any>;");
  fs.writeFileSync(path, code);
}
