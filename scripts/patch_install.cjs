const fs = require('fs');
let code = fs.readFileSync('./src/renderer/src/pages/Catalog.tsx', 'utf8');

const handleSpecific = `
  const handleInstallSpecificVersion = async (item: any, versionToInstall: any) => {
    if (!targetInstanceId) {
      alert('Пожалуйста, выберите целевую сборку для установки.');
      return;
    }
    setInstallingId(item.id);
    setInstallProgress(10);
    
    let simProgress = 10;
    const interval = setInterval(() => {
      simProgress += Math.random() * 15;
      if (simProgress > 90) simProgress = 90;
      setInstallProgress(simProgress);
    }, 200);

    try {
      if (category === 'modpack') {
        await window.electronAPI.content.installModpack(versionToInstall, item.title);
        onInstanceCreated();
        setInstalledMap((prev) => ({ ...prev, [item.id]: { filename: versionToInstall.filename } }));
      } else {
        const ok = await window.electronAPI.content.installContent(
          targetInstanceId,
          item.id,
          source,
          versionToInstall,
          category
        );
        if (ok) {
          const meta = await window.electronAPI.instances.getModsMetadata(targetInstanceId);
          setInstalledMap(meta || {});
          const mods = await window.electronAPI.instances.getMods(targetInstanceId);
          setLocalMods(mods || []);
        }
      }
    } catch (err) {
      console.error('Install error:', err);
    } finally {
      clearInterval(interval);
      setInstallProgress(100);
      setTimeout(() => setInstallingId(null), 300);
    }
  };

  const handleUninstall = async (item: ContentItem, filename?: string) => {`;

code = code.replace(/const handleUninstall = async \(item: ContentItem, filename\?: string\) => \{/, handleSpecific);

// Update versions tab rendering
code = code.replace(/\{activeDetailsTab === 'versions' && \(\n.*?<div className="space-y-2">\n.*?\{modDetails\.versions\?\.\w+\(\(v: any\) => \(\n.*?<div key=\{v\.id\}.*?>\n.*?<div>\n.*?<p className="text-xs font-semibold text-slate-200">\{v\.name\}<\/p>\n.*?<p className="text-\[10px\] text-slate-500 mt-0\.5">MC: \{v\.game_versions\.slice\(0, 4\)\.join\(\', \'\)\}\{v\.game_versions\.length > 4 \? \'\.\.\.\' : \'\'\}<\/p>\n.*?<\/div>\n.*?<div className="flex items-center gap-1\.5">\n.*?\{v\.loaders\.slice\(0, 3\)\.map\(\(l: string\) => \(\n.*?<span key=\{l\}.*?>\n.*?\{l\}\n.*?<\/span>\n.*?\)\)\}\n.*?<\/div>\n.*?<\/div>\n.*?\)\)\}\n.*?<\/div>\n.*?\)\}/s, 
  `{activeDetailsTab === 'versions' && (
                        <div className="space-y-2">
                          {modDetails.versions?.map((v: any) => (
                            <div key={v.id} className="p-3 bg-slate-900/50 border border-hiroki-border rounded-lg flex items-center justify-between">
                              <div className="min-w-0 flex-1 pr-3">
                                <p className="text-xs font-semibold text-slate-200 truncate">{v.name}</p>
                                <p className="text-[10px] text-slate-500 mt-0.5 truncate">MC: {v.gameVersions.slice(0, 4).join(', ')}{v.gameVersions.length > 4 ? '...' : ''}</p>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <div className="hidden sm:flex items-center gap-1.5 mr-2">
                                  {v.loaders.slice(0, 3).map((l: string) => (
                                    <span key={l} className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase">
                                      {l}
                                    </span>
                                  ))}
                                </div>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleInstallSpecificVersion(selectedMod, v); }}
                                  disabled={installingId === selectedMod.id}
                                  className="px-3 py-1.5 bg-[var(--blue-glow)] text-[var(--blue)] border border-[var(--blue)] rounded hover:bg-[var(--blue)] hover:text-white transition-colors text-[10px] uppercase font-bold"
                                >
                                  Установить
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}`);

fs.writeFileSync('./src/renderer/src/pages/Catalog.tsx', code);
