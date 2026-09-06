import React, { useState, useEffect } from 'react';
import { applyTheme, saveLocalData, loadLocalData, StoreKeys } from '../utils/store';
import { Settings as SettingsIcon, Palette, Folder, Cpu, Terminal, Image as ImageIcon } from 'lucide-react';
import type { AppSettings, JavaInstallation } from '../../../preload/types';

export const Settings: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [jvms, setJvms] = useState<JavaInstallation[]>([]);
  const [scanning, setScanning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sysMem, setSysMem] = useState(8192);
  const [themeColor, setThemeColor] = useState(loadLocalData(StoreKeys.THEME, '#7aa2f7'));

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const current = await window.electronAPI.settings.get();
      setSettings(current);
      
      const mem = await window.electronAPI.settings.getSystemMemoryMb();
      setSysMem(mem);

      const jvmList = await window.electronAPI.settings.detectJava();
      setJvms(jvmList);
    } catch (err) {
      console.error('[Settings] Load failed:', err);
    }
  };

  const updateSetting = async (key: keyof AppSettings, value: any) => {
    if (!settings) return;
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    
    try {
      setSaving(true);
      await window.electronAPI.settings.update({ [key]: value });
      setTimeout(() => setSaving(false), 500);
    } catch (err) {
      console.error('[Settings] Save failed:', err);
      setSaving(false);
    }
  };


  if (!settings) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-slate-400 font-medium animate-pulse">Загрузка настроек...</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col p-8 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 flex-shrink-0 border-b border-[var(--border)] pb-4 max-w-3xl w-full mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <SettingsIcon className="text-[var(--blue)]" />
            <span>Настройки лаунчера</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Конфигурация памяти, Java runtime, рабочих папок и внешнего вида
          </p>
        </div>
        
        {saving && (
          <div className="text-xs font-semibold text-[var(--green)] animate-pulse">
            Сохранение...
          </div>
        )}
      </div>

      <div className="flex flex-col gap-6 max-w-3xl mx-auto w-full pb-10">
        
        {/* Game Directory */}
        <div className="p-5 rounded-xl bg-[var(--card)] border border-[var(--border)] flex flex-col gap-3">
          <div className="flex items-center gap-2 mb-1">
            <Folder size={16} className="text-[var(--blue)]" />
            <h3 className="text-sm font-bold text-white">Директория игры и сборок</h3>
          </div>
          <p className="text-xs text-slate-400">Место хранения установленных файлов Minecraft, сборок, миров и модов</p>
          
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 text-xs text-slate-300 font-mono overflow-hidden text-ellipsis whitespace-nowrap">
              {settings.gameDirectory}
            </div>
            <button 
              onClick={async () => {
                const p = await window.electronAPI.settings.selectDirectory();
                if (p) updateSetting('gameDirectory', p);
              }}
              className="px-4 py-2 rounded-lg bg-[var(--card-inner)] border border-[var(--border)] hover:border-slate-500 text-xs font-semibold text-slate-300 hover:text-white transition-all"
            >
              Обзор...
            </button>
          </div>
        </div>

        {/* RAM */}
        <div className="p-5 rounded-xl bg-[var(--card)] border border-[var(--border)] flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Cpu size={16} className="text-[var(--blue)]" />
            <h3 className="text-sm font-bold text-white">Выделение оперативной памяти (ОЗУ)</h3>
          </div>
          
          <div className="flex flex-col gap-2 mt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Максимальная память (RAM):</span>
              <span className="text-xs font-bold text-[var(--blue)] bg-[var(--blue)]/10 px-2 py-0.5 rounded-md">
                {settings.maxMemoryMb || 4096} MB ({( (settings.maxMemoryMb || 4096) / 1024).toFixed(1)} GB)
              </span>
            </div>
            <input
              type="range"
              min="1024"
              max={sysMem}
              step="512"
              value={settings.maxMemoryMb || 4096}
              onChange={(e) => updateSetting('maxMemoryMb', parseInt(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500 mt-2"
            />
            <div className="flex items-center justify-between mt-1 text-[10px] text-slate-500 font-medium">
              <span>1 GB</span>
              <span>{(sysMem / 1024).toFixed(0)} GB (RAM Системы)</span>
            </div>
          </div>
        </div>

        

        {/* Art Image */}
        <div className="p-5 rounded-xl bg-[var(--card)] border border-[var(--border)] flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <ImageIcon size={16} className="text-[var(--blue)]" />
            <h3 className="text-sm font-bold text-white">Картинка профиля</h3>
          </div>
          <div className="flex items-center gap-4">
            <label className="cursor-pointer bg-[var(--card-inner)] border border-[var(--border)] hover:border-[var(--blue)] text-[var(--blue)] text-xs font-semibold px-4 py-2 rounded transition-all">
              Выбрать файл
              <input 
                type="file" 
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      try {
                        const base64 = event.target?.result as string;
                        saveLocalData('hiroki_art_url', base64);
                        window.dispatchEvent(new Event('art-updated'));
                      } catch (e) {
                        alert('Картинка слишком большая для сохранения в браузере (Лимит 5МБ).');
                      }
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
            </label>
            <span className="text-xs text-slate-400">
              {loadLocalData('hiroki_art_url', null) ? 'Пользовательская картинка установлена' : 'Стандартная картинка'}
            </span>
          </div>
        </div>

        {/* Theme */}
        <div className="p-5 rounded-xl bg-[var(--card)] border border-[var(--border)] flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Palette size={16} className="text-[var(--blue)]" />
            <h3 className="text-sm font-bold text-white">Акцентный цвет интерфейса</h3>
          </div>
          <div className="flex items-center gap-4">
            <input 
              type="color" 
              value={themeColor} 
              onChange={(e) => {
                setThemeColor(e.target.value);
                applyTheme(e.target.value);
                saveLocalData(StoreKeys.THEME, e.target.value);
              }}
              className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0 outline-none p-0"
            />
            <span className="text-xs text-slate-400 font-mono">{themeColor.toUpperCase()}</span>
          </div>
        </div>

        {/* Java */}
        <div className="p-5 rounded-xl bg-[var(--card)] border border-[var(--border)] flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal size={16} className="text-[var(--blue)]" />
              <h3 className="text-sm font-bold text-white">Среда выполнения Java (JVM)</h3>
            </div>
            <button 
              onClick={async () => {
                setScanning(true);
                const list = await window.electronAPI.settings.detectJava();
                setJvms(list);
                setScanning(false);
              }}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
            >
              <Terminal size={12} className={scanning ? 'animate-spin' : ''} />
              <span>Сканировать</span>
            </button>
          </div>
          
          <p className="text-xs text-slate-400 mb-2">Обнаруженные установки Java:</p>
          
          <div className="flex flex-col gap-2">
            {jvms.map((jvm, i) => {
              const isSelected = settings.javaPath === jvm.path;
              return (
                <div 
                  key={i}
                  onClick={() => updateSetting('javaPath', jvm.path)}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                    isSelected 
                      ? 'bg-blue-600/10 border-[var(--blue)]/30' 
                      : 'bg-[var(--card-inner)] border-transparent hover:border-slate-700/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-[var(--blue)]' : 'border-slate-600'}`}>
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-[var(--blue)]" />}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-white">
                        Java {jvm.version} <span className="text-slate-500 text-xs font-normal">({jvm.is64Bit ? '64-bit' : '32-bit'})</span>
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono mt-0.5">{jvm.path}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
