import React, { useState, useEffect } from 'react';
import { Titlebar } from './components/Titlebar';
import { NavRail, BentoNavTab } from './components/NavRail';
import { Home } from './pages/Home';
import { Catalog } from './pages/Catalog';
import { Accounts } from './pages/Accounts';
import { Settings } from './pages/Settings';
import { Console } from './pages/Console';
import { InstanceView } from './pages/InstanceView';
import { CreateInstanceModal } from './components/CreateInstanceModal';
import { loadLocalData, saveLocalData, StoreKeys, applyTheme } from './utils/store';
import type {
  Account,
  ContentCategory,
  GameLog,
  InstanceMeta,
  LaunchProgress,
} from '../../preload/types';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<BentoNavTab>('home');
  const [instances, setInstances] = useState<InstanceMeta[]>([]);
  const [selectedInstance, setSelectedInstance] = useState<InstanceMeta | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [activeAccount, setActiveAccount] = useState<Account | null>(null);

  // Deep navigation to specific instance content
  const [manageInstanceId, setManageInstanceId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [catalogCategory, setCatalogCategory] = useState<ContentCategory>('mod');

  // Launch state
  const [isRunning, setIsRunning] = useState(false);
  const startTimeRef = React.useRef<number | null>(null);
  const runningInstanceIdRef = React.useRef<string | null>(null);
  const [launchProgress, setLaunchProgress] = useState<LaunchProgress | null>(null);
  const [logs, setLogs] = useState<GameLog[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  const refreshData = async () => {
    try {
      const allInstances = await window.electronAPI.instances.getAll();
      const s = await window.electronAPI.settings.get();
      setSettings(s);
      setInstances(allInstances);
      if (allInstances.length > 0) {
        if (!selectedInstance || !allInstances.find((i) => i.id === selectedInstance.id)) {
          setSelectedInstance(allInstances[0]!);
        }
      } else {
        setSelectedInstance(null);
      }

      const allAccounts = await window.electronAPI.accounts.getAll();
      setAccounts(allAccounts);
      const active = await window.electronAPI.accounts.getActive();
      setActiveAccount(active);
    } catch (err) {
      console.error('[App] Failed to refresh base data:', err);
    }
  };

  useEffect(() => {
    const themeHex = loadLocalData(StoreKeys.THEME, '#7aa2f7');
    applyTheme(themeHex);
    if (!window.electronAPI) return;

    refreshData();

    const unsubProgress = window.electronAPI.launcher?.onProgress((progress) => {
      setLaunchProgress(progress);
      if (progress.percentage >= 100) {
        setTimeout(() => setLaunchProgress(null), 2500);
      }
    });

    const unsubLog = window.electronAPI.launcher?.onLog((log) => {
      setLogs((prev) => [...prev.slice(-500), log]);
    });

    const unsubState = window.electronAPI.launcher?.onStateChange((state) => {
      setIsRunning(state.isActive);
      if (!state.isActive) {
        setLaunchProgress(null);
        if (startTimeRef.current && runningInstanceIdRef.current) {
          const durationHours = (Date.now() - startTimeRef.current) / 3600000;
          const today = new Date().toISOString().split('T')[0];
          const pt = loadLocalData(StoreKeys.PLAYTIME, {});
          if (!pt[runningInstanceIdRef.current]) pt[runningInstanceIdRef.current] = {};
          pt[runningInstanceIdRef.current][today] = (pt[runningInstanceIdRef.current][today] || 0) + durationHours;
          saveLocalData(StoreKeys.PLAYTIME, pt);
        }
        startTimeRef.current = null;
        runningInstanceIdRef.current = null;
      }
    });

    return () => {
      unsubProgress?.();
      unsubLog?.();
      unsubState?.();
    };
  }, []);

  const handleLaunch = async (instanceId: string) => {
    try {
      runningInstanceIdRef.current = instanceId;
      startTimeRef.current = Date.now();
      await window.electronAPI.launcher.launch(instanceId);
    } catch (err: any) {
      console.error('[App] Launch invocation error:', err);
      setIsRunning(false);
      setLaunchProgress(null);
      runningInstanceIdRef.current = null;
      startTimeRef.current = null;
      alert(`Ошибка при запуске игры:\n${err?.message || String(err)}`);
    }
  };

  const handleKill = async (instanceId: string) => {
    try {
      await window.electronAPI.launcher.kill(instanceId);
    } catch (err) {
      console.error('[App] Kill error:', err);
    }
  };

  const handleTabChange = (tab: BentoNavTab) => {
    setManageInstanceId(null);
    setCurrentTab(tab);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', background: 'var(--bg)', userSelect: 'none', overflow: 'hidden' }}>
      <Titlebar />

      <div style={{ display: 'flex', flex: 1, minHeight: 0, padding: '16px 16px 16px 0' }}>
        <div style={{ padding: '0 8px 0 16px', display: 'flex', alignItems: 'center' }}>
          <NavRail currentTab={currentTab} onTabChange={handleTabChange} />
        </div>

        <main style={{ flex: 1, background: 'var(--bg)', minWidth: 0, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
          {manageInstanceId ? (
            <div key="manage-instance" className="page-transition" style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
              <InstanceView
                instanceId={manageInstanceId}
                onBack={() => { setManageInstanceId(null); refreshData(); }}
                onNavigateToCatalog={(cat) => {
                  setCatalogCategory(cat);
                  setManageInstanceId(null);
                  setCurrentTab('catalog');
                }}
              />
            </div>
          ) : (
            <div className="page-transition" style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
              <div style={{ display: currentTab === 'home' ? 'flex' : 'none', flex: 1, height: '100%' }}>
                <Home
                  isEditMode={isEditMode}
                  settings={settings}
                  instances={instances}
                  selectedInstance={selectedInstance}
                  onSelectInstance={setSelectedInstance}
                  onOpenCreateModal={() => setIsCreateModalOpen(true)}
                  onOpenManageInstance={(id) => setManageInstanceId(id)}
                  onLaunch={handleLaunch}
                  onKill={handleKill}
                  isRunning={isRunning}
                  launchProgress={launchProgress}
                  activeAccount={activeAccount}
                />
              </div>

              <div style={{ display: currentTab === 'catalog' ? 'flex' : 'none', flex: 1, height: '100%' }}>
                <Catalog
                  instances={instances}
                  selectedInstance={selectedInstance}
                  initialCategory={catalogCategory}
                  onInstanceCreated={refreshData}
                />
              </div>

              <div style={{ display: currentTab === 'accounts' ? 'flex' : 'none', flex: 1, height: '100%' }}>
                <Accounts
                  accounts={accounts}
                  activeAccount={activeAccount}
                  onRefresh={refreshData}
                />
              </div>

              <div style={{ display: currentTab === 'settings' ? 'flex' : 'none', flex: 1, height: '100%' }}>
                <Settings isEditMode={isEditMode} setIsEditMode={setIsEditMode} />
              </div>

              <div style={{ display: currentTab === 'console' ? 'flex' : 'none', flex: 1, height: '100%' }}>
                <Console logs={logs} onClearLogs={() => setLogs([])} />
              </div>
            </div>
          )}
              {isCreateModalOpen && (
        <CreateInstanceModal 
          onClose={() => setIsCreateModalOpen(false)} 
          onCreated={() => { setIsCreateModalOpen(false); refreshData(); }} 
        />
      )}
        </main>
      </div>
    </div>
  );
};
