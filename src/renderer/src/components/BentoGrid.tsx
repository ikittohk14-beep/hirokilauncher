import React, { useState, useEffect, useRef } from 'react'
import { Responsive } from 'react-grid-layout';
const GridLayout = Responsive as any;

import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'


import type { InstanceMeta, LaunchProgress, Account } from '../../../preload/types'
import ActivityWidget from './ActivityWidget'
import ArtCard from './ArtCard'
import { MusicWidget } from './MusicWidget'
import ModsCard from './ModsCard'
import LaunchCard from './LaunchCard'
import { InstanceShelf } from './InstanceShelf'
import { loadLocalData, saveLocalData, StoreKeys } from '../utils/store'
import type { AppSettings } from '../../../preload/types';

// Hardcoded 24-column grid layout for more fine-grained resizing
const DEFAULT_LAYOUT = [
  { i: 'col1', x: 0, y: 0, w: 6, h: 3, minW: 4, minH: 2 },
  { i: 'music', x: 0, y: 3, w: 6, h: 1, minW: 4, minH: 1 },
  { i: 'shelf', x: 6, y: 0, w: 18, h: 2, minW: 8, minH: 2 },
  { i: 'art', x: 6, y: 2, w: 5, h: 2, minW: 4, minH: 2 },
  { i: 'mods', x: 11, y: 2, w: 6, h: 2, minW: 5, minH: 2 },
  { i: 'launch', x: 17, y: 2, w: 7, h: 2, minW: 6, minH: 2 }
];

interface BentoGridProps {
  isEditMode: boolean;
  settings: AppSettings | null;
  instances: InstanceMeta[]
  selectedInstance: InstanceMeta | null
  onSelectInstance: (inst: InstanceMeta) => void
  onAddInstance: () => void
  onManageInstance?: (id: string) => void
  launchStatus: LaunchProgress | null
  isRunning?: boolean
  currentAccount: Account | null
  onLaunch: (id: string) => void
  onKill: (id: string) => void
}

function mergeWithDefaults(saved: any[]): any[] {
  if (!Array.isArray(saved)) return DEFAULT_LAYOUT;
  const merged = [...saved];
  DEFAULT_LAYOUT.forEach(defaultItem => {
    if (!merged.find(item => item.i === defaultItem.i)) {
      merged.push(defaultItem);
    }
  });
  return merged;
}

export const BentoGrid: React.FC<BentoGridProps> = ({
  isEditMode,
  settings, instances, selectedInstance, onSelectInstance, onAddInstance, onManageInstance, launchStatus, isRunning, currentAccount, onLaunch, onKill
}) => {
  const [layout, setLayout] = useState<any[]>(() => {
    if (settings?.layout && Array.isArray(settings.layout) && settings.layout.length > 0) {
      return mergeWithDefaults(settings.layout);
    }
    const saved = loadLocalData(StoreKeys.LAYOUT + '_v8', null);
    if (saved && Array.isArray(saved) && saved.length > 0) {
      return mergeWithDefaults(saved);
    }
    return DEFAULT_LAYOUT;
  });

  const [containerWidth, setContainerWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync with persistent settings from disk when loaded via IPC
  useEffect(() => {
    if (settings?.layout && Array.isArray(settings.layout) && settings.layout.length > 0) {
      setLayout(mergeWithDefaults(settings.layout));
    }
  }, [settings?.layout]);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(entries => {
      setContainerWidth(entries[0].contentRect.width);
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const saveLayoutToStorage = (newLayout: any[]) => {
    const clean = newLayout.map((item: any) => ({
      i: item.i,
      x: item.x,
      y: item.y,
      w: item.w,
      h: item.h,
      minW: item.minW ?? 2,
      minH: item.minH ?? 1
    }));
    setLayout(clean);
    saveLocalData(StoreKeys.LAYOUT + '_v8', clean);
    if (window.electronAPI?.settings?.update) {
      window.electronAPI.settings.update({ layout: clean }).catch((err) => {
        console.error('[BentoGrid] Failed to persist layout to settings.json:', err);
      });
    }
  };

  const handleLayoutChange = (currentLayout: any) => {
    // Crucial: Only persist layout changes if the user is in Edit Mode.
    // ResponsiveGridLayout fires onLayoutChange on mount and container resizing.
    // Overwriting layout outside of edit mode resets widget positions!
    if (!isEditMode) return;
    saveLayoutToStorage(currentLayout);
  };

  const blocks: Record<string, React.ReactNode> = {
    music: <MusicWidget />,
      col1: <ActivityWidget instances={instances} />,
    shelf: <InstanceShelf isEditMode={isEditMode} tileShape={settings?.tileShape || "compact"} instances={instances} selectedInstance={selectedInstance} onSelect={onSelectInstance} onAdd={onAddInstance} />,
    art: <ArtCard username={currentAccount?.username} />,
    mods: <ModsCard instanceId={selectedInstance?.id} totalMods={0} onClick={() => { if (!isEditMode && onManageInstance && selectedInstance) onManageInstance(selectedInstance.id) }} />,
    launch: <LaunchCard instanceName={selectedInstance?.name ?? 'UNKNOWN'} instanceVersion={selectedInstance?.gameVersion ?? ''} isLaunching={launchStatus !== null || !!isRunning} isRunning={!!isRunning} launchProgress={isRunning ? null : launchStatus} onLaunch={() => { if (!isEditMode && selectedInstance) onLaunch(selectedInstance.id) }} onKill={() => { if (!isEditMode && selectedInstance) onKill(selectedInstance.id) }} />
  };

  if (!layout.length) return null;

  return (
    <div style={{ flex: 1, minHeight: 0, width: "100%", display: 'flex', flexDirection: 'column', position: 'relative' }}>
      

      {/* RGL Container */}
      <div ref={containerRef} style={{ flex: 1, overflowY: 'hidden', overflowX: 'hidden', padding: '16px' }}>
        {containerWidth > 0 && (
                    <GridLayout
            className={`layout ${isEditMode ? 'edit-mode' : ''}`}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }} cols={{ lg: 24, md: 24, sm: 24, xs: 24, xxs: 24 }} layouts={{ lg: layout.map(l => ({ ...l, static: !isEditMode, isDraggable: isEditMode, isResizable: isEditMode, minH: 1, minW: 2 })), md: layout.map(l => ({ ...l, static: !isEditMode, isDraggable: isEditMode, isResizable: isEditMode, minH: 1, minW: 2 })), sm: layout.map(l => ({ ...l, static: !isEditMode, isDraggable: isEditMode, isResizable: isEditMode, minH: 1, minW: 2 })), xs: layout.map(l => ({ ...l, static: !isEditMode, isDraggable: isEditMode, isResizable: isEditMode, minH: 1, minW: 2 })), xxs: layout.map(l => ({ ...l, static: !isEditMode, isDraggable: isEditMode, isResizable: isEditMode, minH: 1, minW: 2 })) }} width={containerWidth} 
            rowHeight={Math.max(100, (containerRef.current?.clientHeight || 600) / 4 - 24)} 
            
            onLayoutChange={handleLayoutChange}
            onDragStop={handleLayoutChange}
            onResizeStop={handleLayoutChange}
            isDraggable={isEditMode}
            isResizable={isEditMode}
            margin={[12, 12]}
            compactType={null}
            preventCollision={true}
            draggableCancel=".no-drag"
          >
            {layout.map(l => (
              <div key={l.i} data-grid={{ x: l.x, y: l.y, w: l.w, h: l.h, minW: l.minW, minH: l.minH, isDraggable: isEditMode, isResizable: isEditMode, static: !isEditMode }} style={{ 
                height: '100%', width: '100%',
                pointerEvents: 'auto', 
                opacity: isEditMode ? 0.9 : 1,
                border: isEditMode ? '2px dashed var(--blue)' : 'none',
                borderRadius: 'var(--radius)',
                overflow: 'hidden'
              }}>
                {blocks[l.i]}
              </div>
            ))}
          </GridLayout>
        )}
      </div>
    </div>
  )
}
