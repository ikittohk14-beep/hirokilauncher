import React, { useState, useEffect, useRef } from 'react';

const FOOD_EMOJIS = ["🍱", "🍘", "🍙", "🍚", "🍛", "🍜", "🍝", "🍠", "🍢", "🍣", "🍤", "🍥", "🥟", "🥠", "🥡", "🥮", "🍡"];
import { loadLocalData, saveLocalData, StoreKeys } from '../utils/store';
import { ArrowLeft, Plus, Folder, Trash2, CheckCircle2, XCircle, Search, Compass } from 'lucide-react';
import type { InstanceMeta, InstalledModFile } from '../../../preload/types';

interface InstanceViewProps {
  instanceId: string;
  onBack: () => void;
  onNavigateToCatalog: (category: import('../../../preload/types').ContentCategory) => void;
}

export const InstanceView: React.FC<InstanceViewProps> = ({
  instanceId,
  onBack,
  onNavigateToCatalog,
}) => {
  const [instance, setInstance] = useState<InstanceMeta | null>(null);
  const [iconsMap, setIconsMap] = useState<Record<string, string>>({});
  
  useEffect(() => {
    setIconsMap(loadLocalData(StoreKeys.ICONS, {}));
  }, []);

  const [editingIcon, setEditingIcon] = useState(false);

  const [activeTab, setActiveTab] = useState<'mods' | 'resourcepacks' | 'shaders' | 'maps'>('mods');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mods, setMods] = useState<InstalledModFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;
  const [updatingMod, setUpdatingMod] = useState<string | null>(null);
  const [modVersions, setModVersions] = useState<import('../../../preload/types').ContentVersion[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<string>('');

  const loadData = async () => {
    setLoading(true);
    try {
      const meta = await window.electronAPI.instances.getById(instanceId);
      setInstance(meta);
      const installedMods = await window.electronAPI.instances.getInstalledMods(instanceId);
      setMods(installedMods);
    } catch (err) {
      console.error('[InstanceView] Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [instanceId]);

  const handleToggleMod = async (filename: string, currentEnabled: boolean) => {
    try {
      await window.electronAPI.instances.toggleMod(instanceId, filename, !currentEnabled);
      await loadData();
    } catch (err) {
      console.error('[InstanceView] Error toggling mod:', err);
    }
  };

  const handleDeleteMod = async (filename: string) => {
    if (confirm(`Удалить файл ${filename}?`)) {
      try {
        await window.electronAPI.instances.deleteMod(instanceId, filename);
        await loadData();
      } catch (err) {
        console.error('[InstanceView] Error deleting mod:', err);
      }
    }
  };

    const handleOpenFolder = async () => {
    try {
      await window.electronAPI.instances.openFolder(instanceId);
    } catch (err) {
      console.error('[InstanceView] Error opening folder:', err);
    }
  };

  const filteredMods = mods.filter((m) => {
    const isRightType = (activeTab === 'mods' && m.type === 'mod') || 
                        (activeTab === 'resourcepacks' && m.type === 'resourcepack') || 
                        (activeTab === 'shaders' && m.type === 'shader') ||
                        (activeTab === 'maps' && m.type === 'map');
    if (!isRightType) return false;
    return m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
           m.filename.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const totalPages = Math.ceil(filteredMods.length / itemsPerPage);
  const paginatedMods = filteredMods.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="w-full h-full flex flex-col p-8 overflow-y-auto">
      {/* Top navigation */}
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-lg bg-hiroki-card border border-hiroki-border hover:border-slate-600 text-slate-300 hover:text-white transition-all"
            title="Назад"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              {editingIcon ? null : (
                <span 
                  onClick={() => setEditingIcon(true)} 
                  className="cursor-pointer hover:bg-white/10 px-2 py-1 rounded transition-colors" 
                  title="Изменить иконку"
                >
                  {iconsMap[instanceId] || instance?.icon || '📦'}
                </span>
              )}
              <span>{instance?.name || 'Сборка'}</span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800/40 uppercase">
                {instance?.loaderType} {instance?.gameVersion}
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">Управление установленным контентом</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={async () => {
              if (confirm('Вы уверены, что хотите удалить эту сборку? Это действие нельзя отменить.')) {
                try {
                  await window.electronAPI.instances.delete(instanceId);
                  onBack();
                } catch(e) {
                  alert('Ошибка удаления: ' + e);
                }
              }
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/20 transition-all"
          >
            <Trash2 size={14} />
            <span>Удалить сборку</span>
          </button>
          <button
            onClick={handleOpenFolder}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-hiroki-card border border-hiroki-border text-xs text-slate-300 hover:text-white hover:bg-hiroki-cardHover transition-all"
          >
            <Folder size={14} />
            <span>Папка сборки</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-hiroki-border pb-3 mb-6 flex-shrink-0">
        <button
          onClick={() => setActiveTab('mods')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'mods'
              ? 'bg-[var(--blue)]/20 text-[var(--blue)] border border-blue-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Моды ({mods.length})
        </button>
        <button
          onClick={() => setActiveTab('resourcepacks')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'resourcepacks'
              ? 'bg-[var(--blue)]/20 text-[var(--blue)] border border-blue-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Ресурспаки
        </button>
        <button
          onClick={() => setActiveTab('shaders')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'shaders'
              ? 'bg-[var(--blue)]/20 text-[var(--blue)] border border-blue-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Шейдеры
        </button>
        <button
          onClick={() => setActiveTab('maps')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'maps'
              ? 'bg-[var(--blue)]/20 text-[var(--blue)] border border-blue-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Миры
        </button>
      </div>

      {/* Content */}
      {true && (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4 flex-shrink-0">
            <div className="relative w-full sm:w-72">
              <Search size={15} className="absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Поиск по установленным модам..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="w-full pl-9 pr-3 py-1.5 bg-hiroki-card border border-hiroki-border rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-hiroki-card border border-hiroki-border hover:border-slate-600 text-xs font-semibold text-slate-200 hover:text-white transition-all"
              >
                <Plus size={14} />
                <span>{activeTab === 'mods' ? 'Добавить .jar файл' : 'Добавить .zip архив'}</span>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept={activeTab === 'mods' ? '.jar' : '.zip'}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const filePath = (file as any).path;
                    const type = activeTab === 'mods' ? 'mod' : activeTab === 'resourcepacks' ? 'resourcepack' : activeTab === 'shaders' ? 'shader' : 'map';
                    const success = await window.electronAPI.instances.addLocalMod(instanceId, filePath, type);
                    if (success) {
                      loadData();
                    }
                    // clear input
                    e.target.value = '';
                  }
                }}
              />
              <button
                onClick={() => onNavigateToCatalog(activeTab === 'mods' ? 'mod' : activeTab === 'resourcepacks' ? 'resourcepack' : activeTab === 'shaders' ? 'shader' : 'map')}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[var(--blue)] hover:brightness-110 text-white text-xs font-semibold shadow-sm transition-all"
              >
                <Compass size={14} />
                <span>Найти в каталоге</span>
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center text-xs text-slate-400">
              Загрузка списка модов...
            </div>
          ) : filteredMods.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 rounded-xl border border-dashed border-hiroki-border text-center">
              <p className="text-xs text-slate-400">
                {searchQuery 
    ? (activeTab === 'mods' ? 'Моды' : activeTab === 'resourcepacks' ? 'Ресурспаки' : activeTab === 'shaders' ? 'Шейдеры' : 'Миры') + ' по вашему запросу не найдены' 
    : (activeTab === 'mods' ? 'В этой сборке еще нет модов' : activeTab === 'resourcepacks' ? 'В этой сборке еще нет ресурспаков' : activeTab === 'shaders' ? 'В этой сборке еще нет шейдеров' : 'В этой сборке еще нет миров')}
              </p>
              <button
                onClick={() => onNavigateToCatalog(activeTab === 'mods' ? 'mod' : activeTab === 'resourcepacks' ? 'resourcepack' : activeTab === 'shaders' ? 'shader' : 'map')}
                className="mt-3 px-3.5 py-1.5 rounded-lg bg-[var(--blue)]/20 text-[var(--blue)] border border-blue-500/30 text-xs font-semibold hover:bg-[var(--blue)]/30 transition-all"
              >
                Открыть каталог
              </button>
            </div>
          ) : (<>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1" onScroll={(e) => {
              const target = e.currentTarget;
              if (target.scrollHeight - target.scrollTop - target.clientHeight < 400) {
              }
            }}>

              {paginatedMods.map((mod) => (
                <div
                  key={mod.filename}
                  
                  className={`flex flex-col p-3 rounded-lg border transition-all ${
                    mod.isEnabled
                      ? 'bg-hiroki-card border-hiroki-border hover:border-slate-700'
                      : 'bg-hiroki-dark/60 border-slate-800/60 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <button
                        onClick={() => handleToggleMod(mod.filename, mod.isEnabled)}
                        className={`p-1 rounded-md transition-colors ${
                          mod.isEnabled ? 'text-emerald-400' : 'text-slate-500'
                        }`}
                        title={mod.isEnabled ? 'Отключить мод' : 'Включить мод'}
                      >
                        {mod.isEnabled ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                      </button>
                      
                      {mod.iconUrl && (
                        <img loading="lazy" src={mod.iconUrl} alt="" className="w-8 h-8 rounded bg-hiroki-dark object-cover flex-shrink-0" />
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <div className="text-xs font-bold text-white truncate">{mod.name}</div>
                          {mod.version !== 'unknown' && mod.version !== 'installed' && (
                            <div className="text-[10px] font-mono text-[var(--blue)] px-1.5 py-0.5 rounded bg-blue-500/10 whitespace-nowrap">
                              {mod.version}
                            </div>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate mt-0.5">
                          {mod.filename}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
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
                                await window.electronAPI.content.installContent(instanceId, mod.projectId!, mod.source as 'modrinth' | 'curseforge', v, 'mod');
                                setUpdatingMod(null);
                                loadData();
                              }}
                              className="px-2 py-1 text-[10px] font-semibold text-white bg-[var(--blue)] hover:brightness-110 rounded"
                            >
                              OK
                            </button>
                            <button onClick={() => setUpdatingMod(null)} className="px-2 py-1 text-[10px] text-slate-400 hover:text-white">Отмена</button>
                          </div>
                        ) : (
                        <button
                          onClick={async () => {
                            try {
                              const versions = await window.electronAPI.content.getVersions(mod.projectId!, mod.source as 'modrinth' | 'curseforge', instance.gameVersion, instance.loaderType);
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
                          className="px-2 py-1 text-[10px] font-semibold text-[var(--blue)] hover:text-white bg-blue-500/10 hover:bg-[var(--blue)] rounded transition-colors"
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
                    </div>
                  </div>
                  {mod.description && (
                    <div className="mt-2 text-[10px] text-slate-400 pl-11 line-clamp-2">
                      {mod.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 p-2 bg-hiroki-card border border-hiroki-border rounded-lg">
                <button 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-xs text-white rounded transition-colors"
                >
                  &larr; Назад
                </button>
                <span className="text-xs text-slate-400">Страница {currentPage} из {totalPages}</span>
                <button 
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-xs text-white rounded transition-colors"
                >
                  Вперед &rarr;
                </button>
              </div>
            )}
          </>)}
        </div>
      )}

      
      {editingIcon && (
        <div 
          onClick={(e) => { e.stopPropagation(); setEditingIcon(false); }}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--card-inner)', border: '1px solid var(--border)',
              borderRadius: '16px', padding: '24px', width: '320px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
              display: 'flex', flexDirection: 'column', gap: '16px'
            }}
          >
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#fff', textAlign: 'center' }}>
              Выберите иконку сборки
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
              {FOOD_EMOJIS.map(emoji => (
                <div
                  key={emoji}
                  onClick={() => {
                    const newMap = { ...iconsMap, [instanceId]: emoji };
                    setIconsMap(newMap);
                    saveLocalData(StoreKeys.ICONS, newMap);
                    setEditingIcon(false);
                    // Update instance state if needed, though iconsMap takes precedence
                  }}
                  style={{
                    width: '42px', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '24px', background: 'var(--card)', borderRadius: '10px',
                    cursor: 'pointer', border: '1px solid var(--border)', transition: 'all 0.2s',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = 'var(--blue)';
                    e.currentTarget.style.transform = 'scale(1.1)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  {emoji}
                </div>
              ))}
            </div>
              </div>
        </div>
      )}
    </div>
  );
};
