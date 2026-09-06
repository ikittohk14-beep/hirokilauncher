import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Play, Layers, X, Loader2, Sparkles, Wrench } from 'lucide-react';
import type {
  InstanceMeta,
  MinecraftVersionItem,
  ModLoaderType,
  ModLoaderVersionItem,
} from '../../../preload/types';

interface InstancesProps {
  instances: InstanceMeta[];
  selectedInstance: InstanceMeta | null;
  onSelectInstance: (instance: InstanceMeta) => void;
  onOpenManageInstance: (instanceId: string) => void;
  onLaunch: (instanceId: string) => void;
  onRefresh: () => void;
}

export const Instances: React.FC<InstancesProps> = ({
  instances,
  selectedInstance,
  onSelectInstance,
  onOpenManageInstance,
  onLaunch,
  onRefresh,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newInstanceName, setNewInstanceName] = useState('');
  const [selectedGameVersion, setSelectedGameVersion] = useState('');
  const [selectedLoader, setSelectedLoader] = useState<ModLoaderType>('fabric');
  const [selectedLoaderVersion, setSelectedLoaderVersion] = useState('');

  const [minecraftVersions, setMinecraftVersions] = useState<MinecraftVersionItem[]>([]);
  const [loaderVersions, setLoaderVersions] = useState<ModLoaderVersionItem[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [loadingLoaders, setLoadingLoaders] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;
    const loadMcVersions = async () => {
      setLoadingVersions(true);
      try {
        const versions = await window.electronAPI.versions.getMinecraftVersions();
        if (mounted) {
          // Filter to releases primarily
          const releases = versions.filter((v) => v.type === 'release');
          setMinecraftVersions(releases.length > 0 ? releases : versions);
          if (releases.length > 0 && !selectedGameVersion) {
            setSelectedGameVersion(releases[0]!.id);
          }
        }
      } catch (err) {
        console.error('[Instances] Failed to fetch MC versions:', err);
      } finally {
        if (mounted) setLoadingVersions(false);
      }
    };

    loadMcVersions();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const fetchLoaders = async () => {
      if (!selectedGameVersion || selectedLoader === 'vanilla') {
        setLoaderVersions([]);
        setSelectedLoaderVersion('');
        return;
      }
      setLoadingLoaders(true);
      try {
        const loaders = await window.electronAPI.versions.getLoaderVersions(selectedGameVersion, selectedLoader);
        if (mounted) {
          setLoaderVersions(loaders);
          if (loaders.length > 0) {
            setSelectedLoaderVersion(loaders[0].version);
          } else {
            setSelectedLoaderVersion('');
          }
        }
      } catch (err) {
        console.error('[Instances] Failed to fetch loader versions:', err);
      } finally {
        if (mounted) setLoadingLoaders(false);
      }
    };
    fetchLoaders();
    return () => {
      mounted = false;
    };
  }, [selectedGameVersion, selectedLoader]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInstanceName.trim() || !selectedGameVersion) return;

    setIsSubmitting(true);
    try {
      await window.electronAPI.instances.create({
        name: newInstanceName.trim(),
        gameVersion: selectedGameVersion,
        loaderType: selectedLoader,
        loaderVersion: selectedLoader === 'vanilla' ? '' : selectedLoaderVersion,
      });
      setIsModalOpen(false);
      setNewInstanceName('');
      onRefresh();
    } catch (err) {
      console.error('[Instances] Failed to create instance:', err);
      alert('Ошибка при создании сборки.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      {/* Topbar */}
      <div className="bg-hiroki-card border-b border-hiroki-border px-4 py-3 flex items-center gap-3">
        <h1 className="text-[15px] font-semibold text-white flex-1">Мои сборки</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-500 transition-colors shadow-sm"
        >
          <Plus size={14} />
          <span>Новая</span>
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Instances Grid */}
        <div className="flex-1 p-4 overflow-y-auto">
          {instances.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 rounded-xl border border-dashed border-hiroki-border h-40">
              <span className="text-sm text-slate-400">Нет сохраненных сборок</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {instances.map((inst) => (
                <div
                  key={inst.id}
                  onClick={() => onSelectInstance(inst)}
                  className={`bg-hiroki-card border rounded-xl p-3.5 cursor-pointer transition-colors relative ${
                    selectedInstance?.id === inst.id
                      ? 'border-blue-500 bg-blue-500/5'
                      : 'border-hiroki-border hover:border-slate-500'
                  }`}
                >
                  <div className="text-2xl mb-2">{inst.icon || '📦'}</div>
                  <div className="text-sm font-semibold text-white mb-0.5">{inst.name}</div>
                  <div className="text-xs text-slate-400 capitalize">
                    {inst.loaderType} {inst.loaderVersion && inst.loaderVersion !== 'latest' ? inst.loaderVersion : ''} · {inst.gameVersion}
                  </div>
                  {/* Badge example */}
                  {selectedInstance?.id === inst.id && (
                    <div className="absolute top-3 right-3 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-md text-[10px] px-1.5 py-0.5 font-bold">
                      Выбрано
                    </div>
                  )}
                </div>
              ))}
              <div
                onClick={() => setIsModalOpen(true)}
                className="border border-dashed border-slate-600 rounded-xl p-3.5 cursor-pointer hover:border-slate-400 transition-colors flex flex-col items-center justify-center min-h-[100px]"
              >
                <Plus size={20} className="text-slate-500 mb-1" />
                <span className="text-xs text-slate-400">Добавить сборку</span>
              </div>
            </div>
          )}
        </div>

        {/* Detail Panel */}
        <div className="w-[280px] bg-hiroki-card border-l border-hiroki-border flex flex-col overflow-y-auto">
          {selectedInstance ? (
            <div className="p-5 flex flex-col gap-5 h-full">
              <div className="text-center">
                <div className="text-5xl mb-3">{selectedInstance.icon || '📦'}</div>
                <div className="text-base font-bold text-white">{selectedInstance.name}</div>
                <div className="text-xs text-slate-400 mt-1 capitalize">{selectedInstance.loaderType} · {selectedInstance.gameVersion}</div>
              </div>

              <div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Информация</div>
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <Layers size={14} className="text-slate-500" />
                    <span>Minecraft {selectedInstance.gameVersion}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <Sparkles size={14} className="text-slate-500" />
                    <span className="capitalize">{selectedInstance.loaderType} {selectedInstance.loaderVersion !== 'latest' ? selectedInstance.loaderVersion : ''}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 mt-auto pt-4">
                <button
                  onClick={() => onLaunch(selectedInstance.id)}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors"
                >
                  <Play size={14} /> Играть
                </button>
                <button
                  onClick={() => onOpenManageInstance(selectedInstance.id)}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-hiroki-border hover:bg-hiroki-cardHover text-slate-300 text-xs font-semibold transition-colors"
                >
                  <Wrench size={14} /> Управление
                </button>
                <button
                  onClick={async () => {
                    if (confirm('Точно удалить сборку?')) {
                      await window.electronAPI.instances.delete(selectedInstance.id);
                      onRefresh();
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-hiroki-border hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 text-slate-400 text-xs font-semibold transition-colors mt-2"
                >
                  <Trash2 size={14} /> Удалить
                </button>
              </div>
            </div>
          ) : (
            <div className="p-5 flex-1 flex flex-col items-center justify-center text-center opacity-50">
              <Layers size={32} className="text-slate-500 mb-3" />
              <div className="text-sm font-semibold text-slate-300">Сборка не выбрана</div>
              <div className="text-xs text-slate-500 mt-1">Выберите сборку слева для просмотра информации</div>
            </div>
          )}
        </div>
      </div>

      {/* Creation Modal */}
      {isModalOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-hiroki-card w-full max-w-md rounded-2xl border border-hiroki-border shadow-2xl overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-hiroki-border flex items-center justify-between bg-hiroki-cardHover">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Plus size={18} className="text-blue-400" />
                Создание новой сборки
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-500 hover:text-white p-1 rounded-md transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 flex-1 overflow-y-auto">
              <form id="create-instance-form" onSubmit={handleCreate} className="space-y-4">
                {/* Form fields here (reusing existing state) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Название сборки
                  </label>
                  <input
                    type="text"
                    required
                    value={newInstanceName}
                    onChange={(e) => setNewInstanceName(e.target.value)}
                    placeholder="Например, Моя крутая сборка"
                    className="w-full px-3 py-2 bg-hiroki-dark border border-hiroki-border rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Версия Minecraft
                  </label>
                  <select
                    required
                    value={selectedGameVersion}
                    onChange={(e) => setSelectedGameVersion(e.target.value)}
                    className="w-full px-3 py-2 bg-hiroki-dark border border-hiroki-border rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 transition-colors appearance-none"
                    disabled={loadingVersions}
                  >
                    <option value="" disabled>
                      {loadingVersions ? 'Загрузка версий...' : 'Выберите версию...'}
                    </option>
                    {minecraftVersions.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.id}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Тип загрузчика
                    </label>
                    <select
                      value={selectedLoader}
                      onChange={(e) => setSelectedLoader(e.target.value as ModLoaderType)}
                      className="w-full px-3 py-2 bg-hiroki-dark border border-hiroki-border rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 transition-colors appearance-none"
                    >
                      <option value="vanilla">Vanilla</option>
                      <option value="fabric">Fabric</option>
                      <option value="forge">Forge</option>
                      <option value="quilt">Quilt</option>
                      <option value="neoforge">NeoForge</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Версия загрузчика
                    </label>
                    <select
                      value={selectedLoaderVersion}
                      onChange={(e) => setSelectedLoaderVersion(e.target.value)}
                      disabled={selectedLoader === 'vanilla' || loadingLoaders}
                      className="w-full px-3 py-2 bg-hiroki-dark border border-hiroki-border rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 transition-colors appearance-none disabled:opacity-50"
                    >
                      {selectedLoader === 'vanilla' ? (
                        <option value="">Не требуется</option>
                      ) : (
                        <>
                          <option value="">
                            {loadingLoaders ? 'Загрузка...' : 'Последняя (Рекомендуется)'}
                          </option>
                          {loaderVersions.map((v) => (
                            <option key={v.version} value={v.version}>
                              {v.version}
                            </option>
                          ))}
                        </>
                      )}
                    </select>
                  </div>
                </div>
              </form>
            </div>

            <div className="px-5 py-4 border-t border-hiroki-border bg-hiroki-cardHover flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                disabled={isSubmitting}
              >
                Отмена
              </button>
              <button
                type="submit"
                form="create-instance-form"
                disabled={isSubmitting || !newInstanceName.trim() || !selectedGameVersion}
                className="flex items-center gap-2 px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                <span>Создать</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
