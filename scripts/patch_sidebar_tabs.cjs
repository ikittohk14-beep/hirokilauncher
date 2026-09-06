const fs = require('fs');
let code = fs.readFileSync('./src/renderer/src/pages/Catalog.tsx', 'utf8');

// 1. Add activeDetailsTab state
code = code.replace(/const \[detailsLoading, setDetailsLoading\] = useState\(false\);/, 
  "const [detailsLoading, setDetailsLoading] = useState(false);\n  const [activeDetailsTab, setActiveDetailsTab] = useState<'desc' | 'gallery' | 'versions'>('desc');");

// 2. Reset activeDetailsTab on selectMod
code = code.replace(/setDetailsLoading\(true\);/, "setDetailsLoading(true);\n    setActiveDetailsTab('desc');");

// 3. Rewrite the sidebar details rendering
const oldSidebarContent = `                ) : modDetails ? (
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
                ) : (`;

const newSidebarContent = `                ) : modDetails ? (
                  <div className="flex flex-col h-full">
                    {/* Tabs */}
                    <div className="flex gap-4 border-b border-hiroki-border/60 mb-4 pb-2">
                      <button 
                        onClick={() => setActiveDetailsTab('desc')}
                        className={\`text-[11px] font-bold uppercase tracking-wider pb-1 transition-colors \${activeDetailsTab === 'desc' ? 'text-[var(--blue)] border-b-2 border-[var(--blue)]' : 'text-slate-500 hover:text-slate-300'}\`}
                      >
                        Описание
                      </button>
                      {modDetails.gallery && modDetails.gallery.length > 0 && (
                        <button 
                          onClick={() => setActiveDetailsTab('gallery')}
                          className={\`text-[11px] font-bold uppercase tracking-wider pb-1 transition-colors \${activeDetailsTab === 'gallery' ? 'text-[var(--blue)] border-b-2 border-[var(--blue)]' : 'text-slate-500 hover:text-slate-300'}\`}
                        >
                          Скриншоты
                        </button>
                      )}
                      <button 
                        onClick={() => setActiveDetailsTab('versions')}
                        className={\`text-[11px] font-bold uppercase tracking-wider pb-1 transition-colors \${activeDetailsTab === 'versions' ? 'text-[var(--blue)] border-b-2 border-[var(--blue)]' : 'text-slate-500 hover:text-slate-300'}\`}
                      >
                        Версии
                      </button>
                    </div>
                    
                    {/* Tab Content */}
                    <div className="flex-1 overflow-y-auto pr-1 hide-scrollbar">
                      {activeDetailsTab === 'desc' && (
                        <div>
                          <p className="text-xs text-slate-300 leading-relaxed mb-4">{modDetails.description}</p>
                          {modDetails.body && (
                            <div className="text-xs text-slate-400 leading-relaxed max-w-full overflow-hidden break-words prose prose-invert prose-sm" dangerouslySetInnerHTML={{ __html: modDetails.body }} />
                          )}
                        </div>
                      )}
                      
                      {activeDetailsTab === 'gallery' && modDetails.gallery && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {modDetails.gallery.map((g: any, i: number) => (
                            <div key={i} className="flex flex-col gap-1.5">
                              <a href={g.url || g} target="_blank" rel="noreferrer" className="block w-full h-32 rounded-lg border border-hiroki-border/60 overflow-hidden bg-slate-900/50 hover:border-slate-500 transition-colors">
                                <img src={g.url || g} className="w-full h-full object-cover" />
                              </a>
                              {g.title && <span className="text-[10px] text-slate-400 text-center">{g.title}</span>}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {activeDetailsTab === 'versions' && (
                        <div className="space-y-2">
                          {modDetails.versions?.map((v: any) => (
                            <div key={v.id} className="p-3 bg-slate-900/50 border border-hiroki-border rounded-lg flex items-center justify-between">
                              <div>
                                <p className="text-xs font-semibold text-slate-200">{v.name}</p>
                                <p className="text-[10px] text-slate-500 mt-0.5">MC: {v.game_versions.slice(0, 4).join(', ')}{v.game_versions.length > 4 ? '...' : ''}</p>
                              </div>
                              <div className="flex items-center gap-1.5">
                                {v.loaders.slice(0, 3).map((l: string) => (
                                  <span key={l} className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase">
                                    {l}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (`;

code = code.replace(oldSidebarContent, newSidebarContent);
fs.writeFileSync('./src/renderer/src/pages/Catalog.tsx', code);
