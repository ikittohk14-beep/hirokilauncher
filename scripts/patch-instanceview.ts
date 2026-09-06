import fs from 'node:fs';

export function patchInstanceView() {
  const content = fs.readFileSync('src/renderer/src/pages/InstanceView.tsx', 'utf-8');
  let newContent = content;

  // Add state
  newContent = newContent.replace(
    /  const \[searchQuery, setSearchQuery\] = useState\(''\);/,
    `  const [searchQuery, setSearchQuery] = useState('');\n  const [updatingMod, setUpdatingMod] = useState<string | null>(null);\n  const [modVersions, setModVersions] = useState<import('../../../preload/types').ContentVersion[]>([]);\n  const [selectedVersionId, setSelectedVersionId] = useState<string>('');`
  );

  // Replace button logic
  const targetBtn = `<div className="flex items-center gap-1 flex-shrink-0">
                      {mod.projectId && mod.source && instance && (
                        updatingMod === mod.filename ? (
                          <div className="flex items-center gap-2">
                            <select
                              value={selectedVersionId}
                              onChange={(e) => setSelectedVersionId(e.target.value)}
                              className="px-2 py-1 bg-hiroki-dark border border-hiroki-border rounded text-[10px] text-white"
                            >
                              {modVersions.map(v => (
                                <option key={v.id} value={v.id}>{v.versionNumber}</option>
                              ))}
                            </select>
                            <button
                              onClick={async () => {
                                const v = modVersions.find(x => x.id === selectedVersionId);
                                if (!v) return;
                                await window.electronAPI.instances.deleteMod(instanceId, mod.filename);
                                await window.electronAPI.content.installContent(instanceId, mod.projectId!, mod.source!, v, 'mod');
                                setUpdatingMod(null);
                                loadData();
                              }}
                              className="px-2 py-1 text-[10px] font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded"
                            >
                              OK
                            </button>
                            <button onClick={() => setUpdatingMod(null)} className="px-2 py-1 text-[10px] text-slate-400 hover:text-white">Отмена</button>
                          </div>
                        ) : (
                        <button
                          onClick={async () => {
                            try {
                              const versions = await window.electronAPI.content.getVersions(mod.projectId!, mod.source!, instance.gameVersion, instance.loaderType);
                              if (versions.length === 0) {
                                alert('Нет доступных версий для вашей игры и загрузчика.');
                                return;
                              }
                              setModVersions(versions);
                              setSelectedVersionId(versions[0].id);
                              setUpdatingMod(mod.filename);
                            } catch(e) {
                              console.error(e);
                              alert('Не удалось получить версии.');
                            }
                          }}
                          className="px-2 py-1 text-[10px] font-semibold text-blue-400 hover:text-white bg-blue-500/10 hover:bg-blue-600 rounded transition-colors"
                          title="Изменить версию мода"
                        >
                          Изменить версию
                        </button>
                        )
                      )}
                      {updatingMod !== mod.filename && (
                        <button
                          onClick={() => handleDeleteMod(mod.filename)}
                          className="text-slate-500 hover:text-red-400 p-1.5 rounded-md hover:bg-slate-800 transition-colors"
                          title="Удалить"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>`;

  const re = /<div className="flex items-center gap-1 flex-shrink-0">[\s\S]*?<\/div>\n                  <\/div>\n                  \{mod.description/m;
  newContent = newContent.replace(re, target + '\n                  </div>\n                  {mod.description');

  fs.writeFileSync('src/renderer/src/pages/InstanceView.tsx', newContent);
}
patchInstanceView();
