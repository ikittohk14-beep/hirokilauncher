const fs = require('fs');
let code = fs.readFileSync('./src/renderer/src/pages/Catalog.tsx', 'utf8');

code = code.replace(/<ReactMarkdown className="(.*?)">/, 
  `<div className="$1">
                              <ReactMarkdown>`);

code = code.replace(/<\/ReactMarkdown>/, 
  `</ReactMarkdown>
                            </div>`);

fs.writeFileSync('./src/renderer/src/pages/Catalog.tsx', code);
