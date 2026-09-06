const fs = require('fs');
let code = fs.readFileSync('./src/renderer/src/pages/Catalog.tsx', 'utf8');

// Add import ReactMarkdown
if (!code.includes('import ReactMarkdown')) {
  code = code.replace(/import React, \{ useState, useEffect, useRef \} from 'react';/, 
    "import React, { useState, useEffect, useRef } from 'react';\nimport ReactMarkdown from 'react-markdown';");
}

// Replace dangerouslySetInnerHTML with ReactMarkdown
code = code.replace(/<div className="text-xs text-slate-400 leading-relaxed max-w-full overflow-hidden break-words prose prose-invert prose-sm" dangerouslySetInnerHTML=\{\{ __html: modDetails\.body \}\} \/>/, 
  `<ReactMarkdown className="text-xs text-slate-400 leading-relaxed max-w-full overflow-hidden break-words prose prose-invert prose-sm prose-p:my-2 prose-headings:my-3 prose-a:text-blue-400 prose-ul:list-disc prose-ul:pl-4 prose-ol:list-decimal prose-ol:pl-4 prose-strong:text-slate-200">
                              {modDetails.body}
                            </ReactMarkdown>`);

fs.writeFileSync('./src/renderer/src/pages/Catalog.tsx', code);
