const fs = require('fs');
let code = fs.readFileSync('./src/renderer/src/pages/Catalog.tsx', 'utf8');

const oldProgress = /\{installingId && \(\n\s*<div className="fixed bottom-0 left-0 w-full h-1 z-50 overflow-hidden bg-black">\n\s*<div className="h-full bg-\[var\(--blue\)\] relative overflow-hidden transition-all duration-300 ease-out" style=\{\{ width: \`\$\{installProgress\}%\` \}\}>\n\s*<div className="absolute inset-0 bg-white\/20 w-1\/3 skew-x-12 animate-\[slide_1s_ease-in-out_infinite\]" \/>\n\s*<\/div>\n\s*<\/div>\n\s*\)\}/s;

const newProgress = `{installingId && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-4 fade-in duration-300 pointer-events-none">
          <div className="bg-slate-900/95 backdrop-blur-md border border-hiroki-border/80 shadow-[0_8px_30px_rgba(0,0,0,0.4)] rounded-full px-5 py-3 flex items-center gap-4 min-w-[300px]">
            <Loader2 size={16} className="animate-spin text-[var(--blue)] flex-shrink-0" />
            <div className="flex-1 flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-slate-300">
                <span>{category === 'modpack' ? 'Загрузка сборки...' : 'Установка...'}</span>
                <span className="text-[var(--blue)]">{Math.round(installProgress)}%</span>
              </div>
              <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[var(--blue)] rounded-full transition-all duration-300 ease-out relative overflow-hidden" 
                  style={{ width: \`\${installProgress}%\` }}
                >
                  <div className="absolute inset-0 bg-white/20 w-1/3 skew-x-12 animate-[slide_1s_ease-in-out_infinite]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}`;

code = code.replace(oldProgress, newProgress);

fs.writeFileSync('./src/renderer/src/pages/Catalog.tsx', code);
