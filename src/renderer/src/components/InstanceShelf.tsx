import React, { useState, useEffect, useRef } from 'react';
import { loadLocalData, StoreKeys } from '../utils/store';
import type { InstanceMeta } from '../../../preload/types';

const BENTO_EMOJIS: Record<string, string> = {
  box:      '🍙',
  package:  '🍣',
  sword:    '🥒',
  hammer:   '🍚',
  pickaxe:  '🍱',
  wand:     '🍱',
  flame:    '🍱',
  ghost:    '🍱',
  heart:    '🍱',
};
const DEFAULT_EMOJI = '🍱';

function getEmoji(iconId?: string): string {
  if (!iconId) return DEFAULT_EMOJI;
  return BENTO_EMOJIS[iconId] ?? DEFAULT_EMOJI;
}


interface InstTileProps {
  emoji: string;
  name: string;
  loaderLine: string;
  modCount: number;
  selected: boolean;
  isAdd?: boolean;
  onClick: () => void;
}

const InstTile: React.FC<InstTileProps> = ({ emoji, name, loaderLine, selected, isAdd, onClick }) => {
  const [hovered, setHovered] = React.useState(false);

  const borderColor = selected ? 'var(--blue)' : hovered ? 'rgba(122,162,247,0.35)' : 'var(--border)';
  const background = selected ? 'rgba(122,162,247,0.08)' : hovered ? 'var(--card-hover)' : 'var(--card-inner)';
  const boxShadow = selected ? '0 0 18px rgba(122,162,247,0.2)' : 'none';
  const boxArtBg = selected ? 'rgba(122,162,247,0.08)' : hovered ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.04)';
  const boxArtBorder = selected ? 'rgba(122,162,247,0.35)' : hovered ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.07)';

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background, border: `1px solid ${borderColor}`, borderRadius: 'var(--radius)',
        padding: 12, display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        cursor: 'pointer', transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
        position: 'relative', minHeight: 0, height: '100%', width: '100%',
        transform: hovered && !selected ? 'translateY(-2px)' : 'none',
        boxShadow,
        ...(isAdd ? { borderStyle: 'dashed', background: 'transparent' } : {}),
      }}
    >
      {selected && (
        <div style={{
          position: 'absolute', top: 8, right: 8, width: 6, height: 6, borderRadius: '50%',
          background: 'var(--blue)', boxShadow: '0 0 8px var(--blue)', zIndex: 10,
        }} />
      )}
      <div
        className="tile-box-art"
        style={{
          background: boxArtBg,
          borderColor: boxArtBorder,
          transform: hovered ? 'scale(1.03)' : 'none',
          ...(isAdd ? { borderStyle: 'dashed' } : {}),
          ...(isAdd ? { alignItems: 'center', justifyContent: 'center' } : {}),
        }}
      >
        {emoji}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingTop: 6, flex: 1, justifyContent: 'space-between' }}>
        <div style={{
          fontSize: isAdd ? 13 : 15, fontWeight: 800, color: isAdd ? 'var(--text-dim)' : '#fff',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '-0.3px',
          textAlign: isAdd ? 'center' : 'left',
        }}>
          {name}
        </div>
        <div style={{
          fontSize: 11, color: 'var(--text-dim)', whiteSpace: 'nowrap', overflow: 'hidden',
          textOverflow: 'ellipsis', fontFamily: "'JetBrains Mono', monospace",
          textAlign: isAdd ? 'center' : 'left',
        }}>
          {loaderLine}
        </div>
        <div style={{
          fontSize: 11, display: 'flex', alignItems: 'center',
          justifyContent: isAdd ? 'center' : 'flex-start', fontWeight: 700, paddingTop: 2,
        }}>
          {isAdd && (
            <span style={{ color: 'var(--blue)', fontSize: 10 }}>+ ДОБАВИТЬ</span>
          )}
        </div>
      </div>
    </div>
  );
};

interface InstanceShelfProps {
  instances: InstanceMeta[];
  selectedInstance: InstanceMeta | null;
  onSelect: (inst: InstanceMeta) => void;
  onAdd: () => void;
}

export const InstanceShelf: React.FC<InstanceShelfProps> = ({ instances, selectedInstance, onSelect, onAdd }) => {
  const [hovered, setHovered] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [iconsMap, setIconsMap] = useState<Record<string, string>>({});

  useEffect(() => {
    setIconsMap(loadLocalData(StoreKeys.ICONS, {}));
  }, []);

  // Sort by last played
  let sortedInstances = [...instances].sort((a, b) => (b.lastPlayedAt || b.createdAt) - (a.lastPlayedAt || a.createdAt));

  // Custom mouse wheel horizontal scrolling
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      // Only prevent default if we're scrolling horizontally
      if (e.deltaY !== 0) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      }
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  return (
    <div style={{
      gridColumn: '2 / 5', gridRow: '1',
      background: 'var(--card)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius)', padding: 12,
      display: 'grid', gridTemplateColumns: '1fr min-content', gap: 12,
      minHeight: 0, height: '100%', width: '100%', transition: 'border-color 0.2s',
      borderColor: hovered ? 'var(--border-hover)' : 'var(--border)',
      minWidth: 0, overflow: 'hidden'
    }}
    onMouseOver={() => setHovered(true)}
    onMouseOut={() => setHovered(false)}
    >
      <div 
        ref={scrollRef}
        style={{
          display: 'flex',
          gap: 12, width: '100%', height: '100%', alignItems: 'stretch',
          overflowX: 'auto',
          overflowY: 'hidden',
          scrollbarWidth: 'none',
          minWidth: 0 // fixes grid overflow
        }}
      >
        {sortedInstances.map((inst) => (
          <div key={inst.id} style={{ flex: '0 0 calc((100% - 36px) / 4)', height: '100%', minHeight: 0, minWidth: 160 }}>
            <InstTile
              emoji={iconsMap[inst.id] || getEmoji(inst.icon)} 
              name={inst.name}
              loaderLine={`${inst.loaderType} · MC ${inst.gameVersion}`}
              modCount={0}
              selected={selectedInstance?.id === inst.id}
              onClick={() => onSelect(inst)}
            />
          </div>
        ))}
      </div>
      
      <div style={{ height: '100%', minHeight: 0, width: '160px', flexShrink: 0 }}>
        <InstTile
          emoji="🍱"
          name="Новая сборка"
          loaderLine="Создать / Импорт"
          modCount={0}
          selected={false}
          isAdd={true}
          onClick={onAdd}
        />
      </div>
    </div>
  );
};
export default InstanceShelf;