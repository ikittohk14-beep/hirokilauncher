const fs = require('fs');
let code = fs.readFileSync('./src/renderer/src/pages/Catalog.tsx', 'utf8');

// Add states for selected mod
if (!code.includes('selectedMod')) {
  code = code.replace(/const \[loading, setLoading\] = useState\(false\);/, 
    "const [loading, setLoading] = useState(false);\n  const [selectedMod, setSelectedMod] = useState<any | null>(null);\n  const [modDetails, setModDetails] = useState<any | null>(null);\n  const [detailsLoading, setDetailsLoading] = useState(false);");
  
  // Add selectMod method
  code = code.replace(/const handleInstall = async/, 
    `const selectMod = async (item: any) => {
    setSelectedMod(item);
    setModDetails(null);
    if (!item) return;
    setDetailsLoading(true);
    try {
      const details = await window.electronAPI.content.getProject(item.id, item.source);
      setModDetails(details);
    } catch(e) {
      console.error(e);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleInstall = async`);

  // Update tabs to clear selected mod
  code = code.replace(/onClick=\{\(\) => setCategory\(t.id\)\}/g, "onClick={() => { setCategory(t.id); setSelectedMod(null); }}");
  
  // Update the grid layout to support sidebar
  code = code.replace(/<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">/, 
    `<div className="flex-1 flex overflow-hidden gap-4 min-h-0 w-full">
      <div className="flex-1 overflow-y-auto pr-2 hide-scrollbar">
        <div className={\`grid gap-4 transition-all duration-300 \${selectedMod ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}\`}>`);
  
  // Add the sidebar AFTER the results.map
  code = code.replace(/<\/div>\n\s*\{loading && page > 0 && <div className="text-center text-slate-400 text-xs py-4">Загрузка\.\.\.<\/div>\}/, 
    `       </div>
            {loading && page > 0 && <div className="text-center text-slate-400 text-xs py-4">Загрузка...</div>}
          </div>
          
          {selectedMod && (
            <div className="w-[60%] flex-shrink-0 bg-hiroki-card border border-hiroki-border rounded-xl flex flex-col overflow-hidden animate-in slide-in-from-right-8 duration-300">
              <div className="flex items-center justify-between p-4 border-b border-hiroki-border/60 bg-slate-900/40">
                <div className="flex items-center gap-3">
                  {selectedMod.iconUrl ? (
                    <img src={selectedMod.iconUrl} className="w-10 h-10 rounded-lg object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-[var(--blue)]/20 border border-[var(--blue)]/30 flex items-center justify-center">
                      <Package size={20} className="text-[var(--blue)]" />
                    </div>
                  )}
                  <div>
                    <h2 className="text-sm font-bold text-white">{selectedMod.title}</h2>
                    <p className="text-[11px] text-slate-400">Автор: {selectedMod.author}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedMod(null)}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 hide-scrollbar">
                {detailsLoading ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
                    <Loader2 size={24} className="animate-spin text-[var(--blue)]" />
                    <span className="text-xs">Загрузка информации...</span>
                  </div>
                ) : modDetails ? (
                  <div className="space-y-6">
                    {/* Gallery */}
                    {modDetails.gallery && modDetails.gallery.length > 0 && (
                      <div className="flex gap-2 overflow-x-auto hide-scrollbar snap-x pb-2">
                        {modDetails.gallery.map((g: string, i: number) => (
                          <img key={i} src={g} className="h-32 rounded-lg object-cover snap-center border border-hiroki-border/60" />
                        ))}
                      </div>
                    )}
                    
                    {/* Description */}
                    <div>
                      <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Описание</h3>
                      <p className="text-xs text-slate-300 leading-relaxed">{modDetails.description}</p>
                    </div>
                    
                    {/* Recent Versions */}
                    <div>
                      <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Доступные версии (последние)</h3>
                      <div className="space-y-2">
                        {modDetails.versions?.slice(0, 5).map((v: any) => (
                          <div key={v.id} className="p-3 bg-slate-900/50 border border-hiroki-border rounded-lg flex items-center justify-between">
                            <div>
                              <p className="text-xs font-semibold text-slate-200">{v.name}</p>
                              <p className="text-[10px] text-slate-500 mt-0.5">MC: {v.game_versions.slice(0, 3).join(', ')}{v.game_versions.length > 3 ? '...' : ''}</p>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {v.loaders.slice(0, 2).map((l: string) => (
                                <span key={l} className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase">
                                  {l}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-xs text-slate-500 mt-10">
                    Не удалось загрузить детальную информацию.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>`);

  // Close the outer div
  // The outer div was <> ... </> but now it's <div className="flex-1..."> ... </div>
  code = code.replace(/<\/div>\n\s*<\/>\n\s*\{installingId/, "  {installingId");

  // Make the mod card clickable
  code = code.replace(/<div\n\s*key=\{item.id\}\n\s*className="p-4 rounded-xl bg-hiroki-card border border-hiroki-border hover:border-slate-700 flex flex-col justify-between transition-all"/,
    `<div
                key={item.id}
                onClick={() => selectMod(item)}
                className={\`p-4 rounded-xl border flex flex-col justify-between transition-all cursor-pointer \${selectedMod?.id === item.id ? 'bg-blue-500/10 border-blue-500 shadow-[0_0_20px_rgba(122,162,247,0.15)]' : 'bg-hiroki-card border-hiroki-border hover:border-slate-700'}\`}`);

  // Prevent install buttons from triggering card click
  code = code.replace(/onClick=\{\(\) => handleUninstall\(item, uninstallFilename\)\}/, "onClick={(e) => { e.stopPropagation(); handleUninstall(item, uninstallFilename); }}");
  code = code.replace(/onClick=\{\(\) => handleInstall\(item\)\}/, "onClick={(e) => { e.stopPropagation(); handleInstall(item); }}");
}

fs.writeFileSync('./src/renderer/src/pages/Catalog.tsx', code);
