import React, { useState, useEffect } from 'react'
import type { InstanceMeta, LaunchProgress, Account } from '../../../preload/types'
import ActivityWidget from './ActivityWidget'
import ArtCard from './ArtCard'
import ModsCard from './ModsCard'
import LaunchCard from './LaunchCard'
import { InstanceShelf } from './InstanceShelf'
import { loadLocalData, saveLocalData, StoreKeys } from '../utils/store'

interface BentoGridProps {
  instances: InstanceMeta[]
  selectedInstance: InstanceMeta | null
  onSelectInstance: (inst: InstanceMeta) => void
  onAddInstance: () => void
  onManageInstance?: (id: string) => void
  launchStatus: LaunchProgress | null
  currentAccount: Account | null
  onLaunch: (id: string) => void
  onKill: (id: string) => void
}

export const BentoGrid: React.FC<BentoGridProps> = ({
  instances,
  selectedInstance,
  onSelectInstance,
  onAddInstance,
  onManageInstance,
  launchStatus,
  currentAccount,
  onLaunch,
  onKill,
}) => {
  const [layout, setLayout] = useState<string[]>(['col1', 'shelf', 'art', 'mods', 'launch']);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  useEffect(() => {
    setLayout(loadLocalData(StoreKeys.LAYOUT, ['col1', 'shelf', 'art', 'mods', 'launch']));
  }, []);

  const handleDrop = (idx: number) => {
    if (draggedIdx === null || draggedIdx === idx) return;
    const newLayout = [...layout];
    const item = newLayout.splice(draggedIdx, 1)[0];
    newLayout.splice(idx, 0, item);
    setLayout(newLayout);
    saveLocalData(StoreKeys.LAYOUT, newLayout);
    setDraggedIdx(null);
  };

  const blocks: Record<string, React.ReactNode> = {
    col1: (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <ActivityWidget instances={instances} />
      </div>
    ),
    shelf: (
      <InstanceShelf
        instances={instances}
        selectedInstance={selectedInstance}
        onSelect={onSelectInstance}
        onAdd={onAddInstance}
      />
    ),
    art: (
      <ArtCard username={currentAccount?.username} />
    ),
    mods: (
      <ModsCard
        instanceId={selectedInstance?.id}
        totalMods={0}
        onClick={() => onManageInstance && selectedInstance && onManageInstance(selectedInstance.id)}
      />
    ),
    launch: (
      <LaunchCard
        instanceName={selectedInstance?.name ?? 'UNKNOWN'}
        instanceVersion={selectedInstance?.gameVersion ?? ''}
        isLaunching={launchStatus !== null}
        launchProgress={launchStatus}
        onLaunch={() => selectedInstance && onLaunch(selectedInstance.id)}
        onKill={() => selectedInstance && onKill(selectedInstance.id)}
      />
    )
  };

  const slotClasses = ['bento-col-1', 'bento-shelf', 'bento-art', 'bento-mods', 'bento-launch'];

  return (
    <div className="bento-layout p-4 box-border" style={{ flex: 1, minHeight: 0, width: "100%" }}>
      {slotClasses.map((className, idx) => {
        const blockKey = layout[idx] || 'col1';
        return (
          <div
            key={idx}
            className={`${className} h-full w-full`}
            draggable
            onDragStart={() => setDraggedIdx(idx)}
            onDragEnd={() => setDraggedIdx(null)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(idx)}
            style={{ opacity: draggedIdx === idx ? 0.5 : 1, transition: 'opacity 0.2s' }}
          >
            {blocks[blockKey]}
          </div>
        )
      })}
    </div>
  )
}
