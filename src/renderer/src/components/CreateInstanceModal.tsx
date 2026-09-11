import React, { useState, useEffect } from 'react';
import { X, Loader2, Sparkles, Wrench } from 'lucide-react';
import type { MinecraftVersionItem, ModLoaderType, ModLoaderVersionItem } from '../../../preload/types';

interface CreateInstanceModalProps {
  onClose: () => void;
  onCreated: () => void;
}

export const CreateInstanceModal: React.FC<CreateInstanceModalProps> = ({ onClose, onCreated }) => {
  const [newInstanceName, setNewInstanceName] = useState('');
  const [selectedGameVersion, setSelectedGameVersion] = useState('');
  const [selectedLoader, setSelectedLoader] = useState<ModLoaderType>('fabric');
  const [selectedLoaderVersion, setSelectedLoaderVersion] = useState('');
  
  const [allVersions, setAllVersions] = useState<MinecraftVersionItem[]>([]);
  const [showSnapshots, setShowSnapshots] = useState(true);
  const [mcVersions, setMcVersions] = useState<MinecraftVersionItem[]>([]);
  const [loaderVersions, setLoaderVersions] = useState<ModLoaderVersionItem[]>([]);
  const [isLoadingVersions, setIsLoadingVersions] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [importProgress, setImportProgress] = useState<{ percentage: number; text: string } | null>(null);

  useEffect(() => {
    const unsub = window.electronAPI.instances.onImportProgress?.((progress) => {
      setImportProgress(progress);
    });
    return () => unsub?.();
  }, []);

  useEffect(() => {
    loadMcVersions();
  }, []);

  useEffect(() => {
    if (selectedGameVersion && selectedLoader !== 'vanilla') {
      loadLoaderVersions(selectedGameVersion, selectedLoader);
    } else {
      setLoaderVersions([]);
      setSelectedLoaderVersion('');
    }
  }, [selectedGameVersion, selectedLoader]);

  const loadMcVersions = async () => {
    setIsLoadingVersions(true);
    try {
      const [v, settings] = await Promise.all([
        window.electronAPI.versions.getMinecraftVersions(),
        window.electronAPI.settings.get()
      ]);
      const allowSnapshots = settings?.showSnapshots !== false;
      setShowSnapshots(allowSnapshots);
      setAllVersions(v);

      const filtered = allowSnapshots 
        ? v.filter(x => x.type === 'release' || x.type === 'snapshot') 
        : v.filter(x => x.type === 'release');

      setMcVersions(filtered);
      if (filtered.length > 0) {
        setSelectedGameVersion(filtered[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingVersions(false);
    }
  };

  const handleToggleSnapshots = async (enabled: boolean) => {
    setShowSnapshots(enabled);
    const filtered = enabled 
      ? allVersions.filter(x => x.type === 'release' || x.type === 'snapshot') 
      : allVersions.filter(x => x.type === 'release');
    setMcVersions(filtered);
    if (filtered.length > 0 && !filtered.find(x => x.id === selectedGameVersion)) {
      setSelectedGameVersion(filtered[0].id);
    }
    try {
      await window.electronAPI.settings.update({ showSnapshots: enabled });
    } catch (e) {
      console.error('Failed to update showSnapshots setting', e);
    }
  };

  
  const [isImporting, setIsImporting] = useState(false);

  const handleImportZip = async () => {
    setIsImporting(true);
    try {
      const result = await window.electronAPI.dialog.showOpenDialog({
        title: 'Выберите архив сборки',
        properties: ['openFile'],
        filters: [{ name: 'Модпаки', extensions: ['zip', 'mrpack'] }]
      });
      if (result.canceled || result.filePaths.length === 0) {
        setIsImporting(false);
        return;
      }
      const filePath = result.filePaths[0];
      console.log('Selected file:', filePath);
      await window.electronAPI.instances.importZip(filePath);
      onCreated();
    } catch (err) {
      console.error('Import failed', err);
      alert('Ошибка импорта: ' + String(err));
      setIsImporting(false);
    }
  };

  const loadLoaderVersions = async (gameVer: string, loader: ModLoaderType) => {
    try {
      const v = await window.electronAPI.versions.getLoaderVersions(gameVer, loader);
      setLoaderVersions(v);
      if (v.length > 0) setSelectedLoaderVersion(v[0].version);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInstanceName.trim() || !selectedGameVersion) return;
    setIsCreating(true);
    try {
      await window.electronAPI.instances.create({
        name: newInstanceName.trim(),
        gameVersion: selectedGameVersion,
        loaderType: selectedLoader,
        loaderVersion: selectedLoader === 'vanilla' ? undefined : selectedLoaderVersion,
      });
      onCreated();
      onClose();
    } catch (err) {
      alert(`Ошибка создания сборки: ${err}`);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-[var(--border)] bg-[var(--card-inner)]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[var(--blue)]/20 rounded-lg text-[var(--blue)]">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Новая сборка</h2>
              <p className="text-xs text-slate-400">Создание чистого профиля</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 flex-1 overflow-y-auto">
          <form id="create-instance-form" onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Название</label>
              <input
                autoFocus
                type="text"
                value={newInstanceName}
                onChange={(e) => setNewInstanceName(e.target.value)}
                placeholder="Моя крутая сборка"
                className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[var(--blue)] transition-colors placeholder-slate-600"
                required
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Версия игры</label>
                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showSnapshots}
                    onChange={(e) => handleToggleSnapshots(e.target.checked)}
                    className="rounded border-slate-700 text-[var(--blue)] focus:ring-0 cursor-pointer w-3.5 h-3.5"
                  />
                  <span className="text-[11px] font-semibold text-slate-400 hover:text-slate-200 transition-colors">
                    Снапшоты
                  </span>
                </label>
              </div>
              <select
                value={selectedGameVersion}
                onChange={(e) => setSelectedGameVersion(e.target.value)}
                className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[var(--blue)] transition-colors"
                disabled={isLoadingVersions}
              >
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
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Загрузчик</label>
                <select
                  value={selectedLoader}
                  onChange={(e) => setSelectedLoader(e.target.value as ModLoaderType)}
                  className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[var(--blue)] transition-colors"
                >
                  <option value="vanilla">Vanilla</option>
                  <option value="fabric">Fabric</option>
                  <option value="forge">Forge</option>
                  <option value="quilt">Quilt</option>
                  <option value="neoforge">NeoForge</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Версия API</label>
                <select
                  value={selectedLoaderVersion}
                  onChange={(e) => setSelectedLoaderVersion(e.target.value)}
                  className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[var(--blue)] transition-colors disabled:opacity-50"
                  disabled={selectedLoader === 'vanilla' || loaderVersions.length === 0}
                >
                  {selectedLoader === 'vanilla' ? (
                    <option value="">-</option>
                  ) : (
                    loaderVersions.map((v) => (
                      <option key={v.version} value={v.version}>{v.version}</option>
                    ))
                  )}
                </select>
              </div>
            </div>
          </form>
        </div>

        {importProgress && (
          <div className="px-5 pb-4">
            <div className="flex justify-between text-xs text-slate-400 font-semibold mb-1.5 uppercase tracking-wide">
              <span>{importProgress.text}</span>
              <span>{importProgress.percentage}%</span>
            </div>
            <div className="h-1.5 bg-[var(--bg)] rounded-full overflow-hidden border border-[var(--border)]">
              <div 
                className="h-full bg-[var(--blue)] transition-all duration-300"
                style={{ width: `${importProgress.percentage}%` }}
              />
            </div>
          </div>
        )}
        <div className="p-5 border-t border-[var(--border)] bg-[var(--card-inner)] flex justify-between gap-3">
          <div>
            
            <button
              type="button"
              onClick={handleImportZip}
              disabled={isImporting}
              className="px-4 py-2.5 rounded-lg text-sm font-semibold text-[var(--text-dim)] hover:text-white border border-[var(--border)] hover:border-[var(--blue)] hover:bg-[rgba(122,162,247,0.1)] transition-colors flex items-center gap-2"
            >
              {isImporting ? <Loader2 size={16} className="animate-spin" /> : <Wrench size={16} />} {/* using Wrench or Archive icon */}
              Импорт ZIP
            </button>
          </div>
          <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg text-sm font-semibold text-slate-300 hover:text-white transition-colors"
          >
            Отмена
          </button>
          <button
            type="submit"
            form="create-instance-form"
            disabled={isCreating || !newInstanceName.trim()}
            className="px-5 py-2.5 rounded-lg bg-[var(--blue)] hover:brightness-110 text-white text-sm font-bold shadow-md shadow-blue-500/20 disabled:opacity-50 flex items-center gap-2 transition-all"
          >
            {isCreating ? <Loader2 size={16} className="animate-spin" /> : <Wrench size={16} />}
            Создать
          </button>
          </div>
        </div>
      </div>
    </div>
  );
};
