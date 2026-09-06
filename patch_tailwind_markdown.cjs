const fs = require('fs');
let code = fs.readFileSync('./src/renderer/src/pages/Catalog.tsx', 'utf8');

code = code.replace(/className="text-xs text-slate-400 leading-relaxed max-w-full overflow-hidden break-words prose prose-invert prose-sm prose-p:my-2 prose-headings:my-3 prose-a:text-blue-400 prose-ul:list-disc prose-ul:pl-4 prose-ol:list-decimal prose-ol:pl-4 prose-strong:text-slate-200"/, 
  `className="text-xs text-slate-400 leading-relaxed max-w-full overflow-hidden break-words [&_p]:my-3 [&_h1]:text-lg [&_h1]:font-bold [&_h1]:text-slate-200 [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-slate-200 [&_h3]:text-sm [&_h3]:font-bold [&_h3]:text-slate-200 [&_a]:text-blue-400 [&_ul]:list-disc [&_ul]:pl-4 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:pl-4 [&_ol]:my-2 [&_li]:my-1 [&_strong]:text-slate-200 [&_strong]:font-bold [&_code]:bg-slate-800 [&_code]:px-1 [&_code]:rounded [&_code]:text-slate-300 [&_pre]:bg-slate-900 [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_blockquote]:border-l-2 [&_blockquote]:border-slate-600 [&_blockquote]:pl-3 [&_blockquote]:italic"`);

fs.writeFileSync('./src/renderer/src/pages/Catalog.tsx', code);
