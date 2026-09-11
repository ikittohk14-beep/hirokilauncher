import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { ChevronDown,
  Search,
  Download,
  Check,
  Loader2,
  Package,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import type {
  ContentCategory,
  ContentItem,
  ContentVersion,
  InstanceMeta,
  MinecraftVersionItem,
  ModLoaderType,
} from '../../../preload/types';

interface CatalogProps {
  instances: InstanceMeta[];
  selectedInstance: InstanceMeta | null;
  initialCategory?: ContentCategory;
  onInstanceCreated: () => void;
}

export const Catalog: React.FC<CatalogProps> = ({
  instances,
  selectedInstance,
  initialCategory = 'mod',
  onInstanceCreated,
}) => {
  const [source, setSource] = useState<'modrinth' | 'curseforge'>('modrinth');
  const [category, setCategory] = useState<ContentCategory>(initialCategory);
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState<'relevance' | 'downloads' | 'newest' | 'updated'>('relevance');
  const [tags, setTags] = useState<string[]>([]);
  const [customVersion, setCustomVersion] = useState<string>('');
  const [customLoader, setCustomLoader] = useState<string>('');
  const [mcVersions, setMcVersions] = useState<MinecraftVersionItem[]>([]);
  const [showSnapshots, setShowSnapshots] = useState<boolean>(true);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [results, setResults] = useState<ContentItem[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedMod, setSelectedMod] = useState<any | null>(null);
  const [modDetails, setModDetails] = useState<any | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [activeDetailsTab, setActiveDetailsTab] = useState<'desc' | 'gallery' | 'versions'>('desc');
  const loadingRef = useRef(false);
  const [targetInstanceId, setTargetInstanceId] = useState<string>(selectedInstance?.id || '');

  useEffect(() => {
    if (!targetInstanceId && instances.length > 0) {
      setTargetInstanceId(instances[0].id);
    }
  }, [instances, targetInstanceId]);

  useEffect(() => {
    const fetchVersions = async () => {
      try {
        const [v, settings] = await Promise.all([
          window.electronAPI.versions.getMinecraftVersions(),
          window.electronAPI.settings.get()
        ]);
        setMcVersions(v || []);
        if (settings && typeof settings.showSnapshots === 'boolean') {
          setShowSnapshots(settings.showSnapshots);
        }
      } catch (err) {
        console.error('[Catalog] Failed to load Minecraft versions or settings:', err);
      }
    };
    fetchVersions();
  }, []);

  // Installing states
  const [installingId, setInstallingId] = useState<string | null>(null);
  const [installProgress, setInstallProgress] = useState(0);
  const [installedMap, setInstalledMap] = useState<Record<string, { filename: string }>>({});
  const [localMods, setLocalMods] = useState<any[]>([]);

  useEffect(() => {
    if (!targetInstanceId) {
      setInstalledMap({});
      setLocalMods([]);
      return;
    }

    const fetchMods = async () => {
      try {
        const mods = await window.electronAPI.instances.getInstalledMods(targetInstanceId);
        setLocalMods(mods);
        
        const newMap: Record<string, { filename: string }> = {};
        const activeInst = instances.find((i) => i.id === targetInstanceId);
        
        // 1. Add from metadata (guarantees catalog-installed mods are tracked)
        if (activeInst?.installedContent) {
          Object.entries(activeInst.installedContent).forEach(([filename, val]) => {
            newMap[val.projectId] = { filename };
          });
        }
        
        // 2. Add from actual filesystem (catches manually added mods)
        mods.forEach(mod => {
          if (mod.projectId) {
            newMap[mod.projectId] = { filename: mod.filename };
          }
        });
        
        setInstalledMap(newMap);
      } catch (err) {
        console.error('[Catalog] Failed to fetch installed mods:', err);
      }
    };
    
    fetchMods();
  }, [targetInstanceId, instances, installingId]);


  const SORT_OPTIONS = [
    { id: 'relevance', label: 'Релевантность' },
    { id: 'downloads', label: 'Популярность' },
    { id: 'newest', label: 'Новые' },
    { id: 'updated', label: 'Недавно обновленные' },
  ];

  const TAG_OPTIONS = [
    { id: 'optimization', label: 'Оптимизация' },
    { id: 'library', label: 'Библиотеки' },
    { id: 'technology', label: 'Технологии' },
    { id: 'magic', label: 'Магия' },
    { id: 'adventure', label: 'Приключения' },
    { id: 'worldgen', label: 'Генерация мира' },
    { id: 'decoration', label: 'Декор' },
    { id: 'equipment', label: 'Снаряжение' },
    { id: 'food', label: 'Еда' },
  ];

  const categories: { id: ContentCategory; label: string }[] = [
    { id: 'mod', label: 'Моды' },
    { id: 'modpack', label: 'Сборки (Модпаки)' },
    { id: 'resourcepack', label: 'Ресурспаки' },
    { id: 'shader', label: 'Шейдеры' },
    { id: 'datapack', label: 'Датапаки' },
    { id: 'map', label: 'Карты' },
  ];

  useEffect(() => {
    if (searchTimeout) clearTimeout(searchTimeout);
    const timeout = setTimeout(() => {
      setPage(0); handleSearch(query, category, source, 0);
    }, 500);
    setSearchTimeout(timeout);
    return () => clearTimeout(timeout);
  }, [query, category, source, targetInstanceId, sortBy, tags, customVersion, customLoader]);


  useEffect(() => {
    if (page > 0) {
      handleSearch(query, category, source, page, sortBy, tags);
    }
  }, [page]);

  const handleSearch = async (searchQuery = query, cat = category, src = source, pageNum = 0, sort = sortBy, t = tags) => {
    setLoading(true);
    loadingRef.current = true;
    try {
      const activeInst = instances.find((i) => i.id === targetInstanceId);
      
      let gameVersion: string | undefined = undefined;
      if (cat !== 'modpack') {
        if (customVersion && customVersion !== 'all' && customVersion !== 'auto') {
          gameVersion = customVersion;
        } else if (customVersion === 'auto' || customVersion === '') {
          gameVersion = activeInst?.gameVersion;
        }
      }

      let loader: ModLoaderType | undefined = undefined;
      if (cat === 'mod' || cat === 'modpack') {
        if (customLoader && customLoader !== 'all' && customLoader !== 'auto') {
          loader = customLoader as ModLoaderType;
        } else if (customLoader === 'auto' || customLoader === '') {
          loader = activeInst?.loaderType;
        }
      }

      const res = await window.electronAPI.content.search(
        searchQuery,
        cat,
        gameVersion,
        loader,
        src,
        pageNum,
        sort,
        t
      );
      setResults(pageNum === 0 ? res.items : (prev) => {
        const ids = new Set(prev.map(i => i.id));
        return [...prev, ...res.items.filter(i => !ids.has(i.id))];
      });
    } catch (err) {
      console.error('[Catalog] Search failed:', err);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  };
  
  const selectMod = async (item: any) => {
    setSelectedMod(item);
    setModDetails(null);
    if (!item) return;
    setDetailsLoading(true);
    setActiveDetailsTab('desc');
    try {
      const details = await window.electronAPI.content.getProject(item.id, item.source);
      setModDetails(details);
    } catch(e) {
      console.error(e);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleInstall = async (item: ContentItem) => {
    setInstallingId(item.id);
    setInstallProgress(0);
    try {
      const activeInst = instances.find((i) => i.id === targetInstanceId);

      // 1. Fetch versions
      const versions = await window.electronAPI.content.getVersions(
        item.id,
        source,
        category === 'modpack' ? undefined : activeInst?.gameVersion,
        category === 'mod' ? activeInst?.loaderType : undefined
      );

      if (versions.length === 0) {
        alert('Не найдено совместимых версий для выбранной конфигурации.');
        /* no interval */
        setInstallingId(null);
        return;
      }

      const versionToInstall = versions[0] as ContentVersion;

      if (category === 'modpack') {
        // Install modpack as a new instance
        await window.electronAPI.content.installModpack(versionToInstall, item.title);
        onInstanceCreated();
        setInstalledMap((prev) => ({ ...prev, [item.id]: { filename: versionToInstall.filename } }));
      } else {
        // Install into target instance
        if (!targetInstanceId) {
          alert('Пожалуйста, выберите целевую сборку для установки.');
          /* no interval */
          setInstallingId(null);
          return;
        }

        const ok = await window.electronAPI.content.installContent(
          targetInstanceId, item.id, source,
          versionToInstall,
          category
        );
        if (ok) {
          setInstalledMap((prev) => ({ ...prev, [item.id]: { filename: versionToInstall.filename } }));
          onInstanceCreated(); // Keep global instances state in sync
        } else {
          alert('Ошибка установки контента в сборку.');
        }
      }
    } catch (err) {
      console.error('[Catalog] Installation failed:', err);
      alert(`Ошибка при установке: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      /* no interval */ setInstallProgress(100); setTimeout(() => setInstallingId(null), 800);
    }
  };

  
  const handleInstallSpecificVersion = async (item: any, versionToInstall: any) => {
    if (!targetInstanceId) {
      alert('Пожалуйста, выберите целевую сборку для установки.');
      return;
    }
    setInstallingId(item.id);
    setInstallProgress(0);

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
          setInstalledMap((prev) => ({ ...prev, [item.id]: { filename: versionToInstall.filename } }));
        }
      }
    } catch (err) {
      console.error('Install error:', err);
    } finally {
      setInstallProgress(100);
      setTimeout(() => setInstallingId(null), 300);
    }
  };

const handleUninstall = async (item: ContentItem, explicitFilename?: string) => {
    if (!targetInstanceId) return;

    // If explicitFilename is not provided, try to find it in activeInst metadata
    let filename = explicitFilename;
    if (!filename) {
      const activeInst = instances.find((i) => i.id === targetInstanceId);
      if (activeInst?.installedContent) {
        const entry = Object.entries(activeInst.installedContent).find(
          ([_, v]) => v.projectId === item.id
        );
        if (entry) filename = entry[0];
      }
    }

    if (!filename) {
      alert('Не удалось определить файл мода для удаления.');
      return;
    }

    setInstallingId(item.id);
    try {
      await window.electronAPI.instances.deleteMod(targetInstanceId, filename);
      setInstalledMap((prev) => {
        const next = { ...prev };
        delete next[item.id];
        return next;
      });
      // Trigger a re-fetch of localMods by firing this event
      onInstanceCreated(); 
    } catch (err) {
      console.error('[Catalog] Failed to uninstall mod:', err);
      alert(`Ошибка при удалении: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setInstallingId(null);
    }
  };

  const activeInst = instances.find((i) => i.id === targetInstanceId);

  return (
    <div className="w-full h-full flex flex-col p-8 overflow-y-auto" >
      {/* Header & Source switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Package className="text-[var(--blue)]" />
            <span>Каталог контента</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Загрузка модов, сборок, шейдеров и ресурспаков в 1 клик
          </p>
        </div>

        {/* Source Toggle */}
        <div className="flex items-center p-1 bg-hiroki-card border border-hiroki-border rounded-xl">
          <button
            onClick={() => setSource('modrinth')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              source === 'modrinth'
                ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Modrinth
          </button>
          <button
            onClick={() => setSource('curseforge')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              source === 'curseforge'
                ? 'bg-amber-600/20 text-amber-400 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            CurseForge
          </button>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-5 flex-shrink-0">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              category === cat.id
                ? 'bg-[var(--blue)] text-white shadow-sm'
                : 'bg-hiroki-card text-slate-400 hover:text-slate-200 border border-hiroki-border'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Filter bar & Target instance selection */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 mb-6 flex-shrink-0">
                <div className="flex-1 w-full flex flex-col gap-2">
          <div className="flex gap-2">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setPage(0); handleSearch(query, category, source, 0, sortBy, tags);
              }}
              className="relative flex-1"
            >
              <Search size={15} className="absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder={`Поиск по ${source === 'modrinth' ? 'Modrinth' : 'CurseForge'}...`}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-9 pr-20 py-2 bg-hiroki-card border border-hiroki-border rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                className="absolute right-2 top-1.5 px-3 py-1 bg-[var(--blue)] hover:brightness-110 text-white rounded-lg text-xs font-semibold transition-all"
              >
                Поиск
              </button>
            </form>
                        <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="appearance-none px-3 py-2 pr-8 bg-hiroki-card border border-hiroki-border rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer min-w-[140px]"
              >
                {SORT_OPTIONS.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            </div>
            <div className="relative">
              <select
                value={customVersion}
                onChange={(e) => setCustomVersion(e.target.value)}
                className="appearance-none px-3 py-2 pr-8 bg-hiroki-card border border-hiroki-border rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer min-w-[145px] max-w-[180px] truncate"
              >
                <option value="auto">
                  {activeInst ? `Сборка: ${activeInst.gameVersion}` : 'Версия (Все)'}
                </option>
                <option value="all">Все версии</option>
                <optgroup label="Популярные версии">
                  {['1.21.4', '1.21.1', '1.20.4', '1.20.1', '1.19.4', '1.19.2', '1.18.2', '1.16.5', '1.12.2', '1.7.10'].map((ver) => (
                    <option key={ver} value={ver}>{ver}</option>
                  ))}
                </optgroup>
                <optgroup label="Официальные релизы">
                  {mcVersions.filter(v => v.type === 'release').map((v) => (
                    <option key={v.id} value={v.id}>{v.id}</option>
                  ))}
                </optgroup>
                {showSnapshots && (
                  <optgroup label="Снапшоты (Snapshots)">
                    {mcVersions.filter(v => v.type === 'snapshot').map((v) => (
                      <option key={v.id} value={v.id}>{v.id} (snapshot)</option>
                    ))}
                  </optgroup>
                )}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            </div>
            <div className="relative">
              <select
                value={customLoader}
                onChange={(e) => setCustomLoader(e.target.value)}
                className="appearance-none px-3 py-2 pr-8 bg-hiroki-card border border-hiroki-border rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer w-[130px]"
              >
                <option value="auto">
                  {activeInst?.loaderType ? `Сборка (${activeInst.loaderType})` : 'Загрузчик'}
                </option>
                <option value="all">Все загрузчики</option>
                <option value="fabric">Fabric</option>
                <option value="forge">Forge</option>
                <option value="neoforge">NeoForge</option>
                <option value="quilt">Quilt</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            </div>
          </div>
          {source === 'modrinth' && category === 'mod' && (
            <div className="flex flex-wrap gap-1.5 mt-1">
              {TAG_OPTIONS.map((t) => {
                const isActive = tags.includes(t.id);
                return (
                  <button
                    key={t.id}
                    onClick={() => setTags(prev => isActive ? prev.filter(x => x !== t.id) : [...prev, t.id])}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors border ${
                      isActive 
                        ? 'bg-[var(--blue)]/20 text-[var(--blue)] border-[var(--blue)]/40' 
                        : 'bg-transparent text-slate-400 border-slate-700/50 hover:border-slate-500'
                    }`}
                  >
                    {t.label}
                  </button>
                )
              })}
              {tags.length > 0 && (
                <button 
                  onClick={() => setTags([])}
                  className="px-2 py-0.5 rounded text-[10px] font-semibold text-red-400/80 hover:text-red-400 transition-colors ml-auto"
                >
                  Сбросить
                </button>
              )}
            </div>
          )}
        </div>

        {category !== 'modpack' && (
          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-xs text-slate-400 whitespace-nowrap">Устанавливать в:</span>
            <div className="relative flex-1 max-w-[200px]">
              <select
                value={targetInstanceId}
                onChange={(e) => setTargetInstanceId(e.target.value)}
                className="appearance-none w-full px-3 py-1.5 pr-8 bg-hiroki-card border border-hiroki-border rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                {instances.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name} ({i.loaderType} {i.gameVersion})
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            </div>
          </div>
        )}
      </div>

      {/* Results List */}
      {loading && page === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-2">
          <Loader2 size={24} className="animate-spin text-[var(--blue)]" />
          <span className="text-xs">Загрузка каталога...</span>
        </div>
      ) : results.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 rounded-2xl border border-dashed border-hiroki-border text-center">
          <p className="text-sm font-bold text-slate-300 mb-1">Ничего не найдено</p>
          <p className="text-xs text-slate-400 max-w-sm mb-4">
            По текущему запросу или фильтрам версии ничего не найдено.
          </p>
          <button
            onClick={() => {
              setCustomVersion('all');
              setCustomLoader('all');
              setQuery('');
              setTags([]);
            }}
            className="px-4 py-2 rounded-xl bg-[var(--card-inner)] border border-[var(--border)] hover:border-[var(--blue)] text-[var(--blue)] hover:text-white text-xs font-semibold transition-all"
          >
            Сбросить фильтры (Показать все моды)
          </button>
        </div>
      ) : (
        <>
        <div className="flex-1 flex overflow-hidden gap-4 min-h-0 w-full">
      <div className="flex-1 overflow-y-auto pr-2 hide-scrollbar">
        <div className={`grid gap-4 transition-all duration-300 ${selectedMod ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
          {results.map((item) => {
            const isInstalling = installingId === item.id;
            const isInstalledByProject = !!installedMap[item.id];
            
            // Fuzzy match for manually added mods that lack a projectId
            const isInstalledByName = localMods.some(m => 
              m.name?.toLowerCase() === item.title.toLowerCase() ||
              m.filename?.toLowerCase().includes(item.slug.toLowerCase())
            );
            
            const isInstalled = isInstalledByProject || (category !== 'modpack' && isInstalledByName);
            
            // To uninstall, we need the filename.
            let uninstallFilename: string | undefined;
            if (isInstalledByProject) {
              uninstallFilename = installedMap[item.id].filename;
            } else if (isInstalledByName) {
              const matchedMod = localMods.find(m => 
                m.name?.toLowerCase() === item.title.toLowerCase() ||
                m.filename?.toLowerCase().includes(item.slug.toLowerCase())
              );
              uninstallFilename = matchedMod?.filename;
            }

            return (
              <div
                key={item.id}
                onClick={() => selectMod(item)}
                className={`p-4 rounded-xl border flex flex-col justify-between transition-all cursor-pointer ${selectedMod?.id === item.id ? 'bg-blue-500/10 border-blue-500 shadow-[0_0_20px_rgba(122,162,247,0.15)]' : 'bg-hiroki-card border-hiroki-border hover:border-slate-700'}`}
                
              >
                <div>
                  <div className="flex items-start gap-3.5 mb-2.5">
                    {item.iconUrl ? (
                      <img loading="lazy" src={item.iconUrl}
                        alt={item.title}
                        className="w-[60px] h-[60px] rounded-[14px] object-cover border border-slate-700/60 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-[60px] h-[60px] rounded-[14px] bg-[var(--blue)]/20 border border-blue-500/30 flex items-center justify-center text-[var(--blue)] flex-shrink-0">
                        <Sparkles size={26} />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2 mb-0.5">
                        <h3 className="text-base font-bold text-white leading-[1.2] line-clamp-2">{item.title}</h3>
                        <span className="text-[10px] text-slate-500 flex-shrink-0 pt-0.5">
                          {item.downloads ? `${(item.downloads / 1000).toFixed(1)}k ⬇` : ''}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 block">Автор: {item.author}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2 mb-3">{item.description}</p>
                </div>

                <div className="pt-3 border-t border-hiroki-border/60 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 overflow-hidden">
                    {item.categories.slice(0, 2).map((c) => (
                      <span
                        key={c}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-hiroki-dark text-slate-400 border border-hiroki-border"
                      >
                        {c}
                      </span>
                    ))}
                  </div>

                  {isInstalled && category !== 'modpack' ? (
                    <button
                      disabled={isInstalling}
                      onClick={(e) => { e.stopPropagation(); handleUninstall(item, uninstallFilename); }}
                      title="Нажмите для удаления из сборки"
                      className="group flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm bg-emerald-600/20 text-emerald-400 border border-emerald-500/40 hover:bg-red-600/20 hover:text-red-400 hover:border-red-500/40 active:scale-95"
                    >
                      {isInstalling ? (
                        <>
                          <Loader2 size={13} className="animate-spin" />
                          <span>Удаление...</span>
                        </>
                      ) : (
                        <>
                          <Check size={13} className="group-hover:hidden" />
                          <Trash2 size={13} className="hidden group-hover:inline" />
                          <span className="group-hover:hidden">Установлено</span>
                          <span className="hidden group-hover:inline">Удалить</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      disabled={isInstalling || isInstalled}
                      onClick={(e) => { e.stopPropagation(); handleInstall(item); }}
                      className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded border text-xs font-semibold transition-all ${
    isInstalled 
      ? 'bg-emerald-600/10 text-emerald-500 border-emerald-500/30 cursor-default' 
      : isInstalling
      ? 'bg-[var(--blue-glow)] text-[var(--blue)] border-[var(--blue)]'
      : 'bg-[var(--card-inner)] border-[var(--border)] hover:border-[var(--blue)] text-[var(--blue)]'
  }`}
                    >
                      {isInstalling ? (
                        <>
                          <Loader2 size={13} className="animate-spin" />
                          <span>Установка...</span>
                        </>
                      ) : isInstalled ? (
                        <>
                          <Check size={13} />
                          <span>Установлено</span>
                        </>
                      ) : (
                        <>
                          <Download size={13} />
                          <span>{category === 'modpack' ? 'Скачать сборку' : 'Установить'}</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
               </div>
            {!loading && results.length > 0 && results.length % 20 === 0 && (
              <div className="flex justify-center mt-6 mb-8">
                <button 
                  className="px-8 py-2 bg-[var(--blue)]/10 hover:bg-[var(--blue)]/20 text-[var(--blue)] text-xs uppercase tracking-wider font-bold rounded-lg border border-[var(--blue)]/30 transition-colors"
                  onClick={() => setPage(p => p + 1)}
                >
                  Загрузить еще
                </button>
              </div>
            )}
            {loading && page > 0 && (
              <div className="flex items-center justify-center gap-2 text-slate-400 text-xs py-6">
                <Loader2 size={16} className="animate-spin text-[var(--blue)]" /> 
                Загрузка следующей страницы...
              </div>
            )}
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
                  <div className="flex flex-col h-full">
                    {/* Tabs */}
                    <div className="flex gap-4 border-b border-hiroki-border/60 mb-4 pb-2">
                      <button 
                        onClick={() => setActiveDetailsTab('desc')}
                        className={`text-[11px] font-bold uppercase tracking-wider pb-1 transition-colors ${activeDetailsTab === 'desc' ? 'text-[var(--blue)] border-b-2 border-[var(--blue)]' : 'text-slate-500 hover:text-slate-300'}`}
                      >
                        Описание
                      </button>
                      {modDetails.gallery && modDetails.gallery.length > 0 && (
                        <button 
                          onClick={() => setActiveDetailsTab('gallery')}
                          className={`text-[11px] font-bold uppercase tracking-wider pb-1 transition-colors ${activeDetailsTab === 'gallery' ? 'text-[var(--blue)] border-b-2 border-[var(--blue)]' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                          Скриншоты
                        </button>
                      )}
                      <button 
                        onClick={() => setActiveDetailsTab('versions')}
                        className={`text-[11px] font-bold uppercase tracking-wider pb-1 transition-colors ${activeDetailsTab === 'versions' ? 'text-[var(--blue)] border-b-2 border-[var(--blue)]' : 'text-slate-500 hover:text-slate-300'}`}
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
                            <div className="text-xs text-slate-400 leading-relaxed max-w-full overflow-hidden break-words [&_p]:my-3 [&_h1]:text-lg [&_h1]:font-bold [&_h1]:text-slate-200 [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-slate-200 [&_h3]:text-sm [&_h3]:font-bold [&_h3]:text-slate-200 [&_a]:text-blue-400 [&_ul]:list-disc [&_ul]:pl-4 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:pl-4 [&_ol]:my-2 [&_li]:my-1 [&_strong]:text-slate-200 [&_strong]:font-bold [&_code]:bg-slate-800 [&_code]:px-1 [&_code]:rounded [&_code]:text-slate-300 [&_pre]:bg-slate-900 [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_blockquote]:border-l-2 [&_blockquote]:border-slate-600 [&_blockquote]:pl-3 [&_blockquote]:italic">
                              <ReactMarkdown>
                              {modDetails.body}
                            </ReactMarkdown>
                            </div>
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
                      )}
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
        </div>
        </>
      )}
      {installingId && (
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
                  style={{ width: `${installProgress}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 w-1/3 skew-x-12 animate-[slide_1s_ease-in-out_infinite]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
