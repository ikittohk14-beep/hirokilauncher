import React, { useState, useEffect, useRef } from 'react';
import { Plus } from 'lucide-react';
import { loadLocalData, saveLocalData, StoreKeys } from '../utils/store';
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
  shape: 'classic' | 'compact';
  emoji: string;
  name: string;
  loaderLine: string;
  modCount: number;
  selected: boolean;
  isAdd?: boolean;
  onClick: () => void;
}

const InstTile: React.FC<InstTileProps> = ({ shape, emoji, name, loaderLine, selected, isAdd, onClick }) => {
  const [hovered, setHovered] = React.useState(false);

  const borderColor = selected ? 'var(--blue)' : hovered ? 'rgba(122,162,247,0.35)' : 'var(--border)';
  const background = selected ? 'rgba(122,162,247,0.08)' : hovered ? 'var(--card-hover)' : isAdd ? 'transparent' : 'var(--card-inner)';
  const boxShadow = selected ? '0 0 18px rgba(122,162,247,0.2)' : 'none';

  const isCompact = shape === 'compact';
  
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background,
        border: isAdd ? `1px dashed ${hovered ? 'var(--blue)' : 'var(--border)'}` : `1px solid ${borderColor}`,
        borderRadius: 'var(--radius)',
        padding: isCompact ? '12px 10px' : '14px 16px',
        display: 'flex',
        flexDirection: isCompact ? 'column' : 'row',
        justifyContent: isCompact ? 'space-between' : 'flex-start',
        alignItems: 'center',
        gap: isCompact ? 6 : 16,
        cursor: 'pointer',
        transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
        position: 'relative',
        minHeight: 0,
        height: '100%',
        width: '100%',
        boxSizing: 'border-box',
        overflow: 'hidden',
        transform: hovered && !selected ? 'translateY(-2px)' : 'none',
        boxShadow,
      }}
    >
      {selected && (
        <div style={{
          position: 'absolute', top: 8, right: 8, width: 6, height: 6, borderRadius: '50%',
          background: 'var(--blue)', boxShadow: '0 0 8px var(--blue)', zIndex: 10,
        }} />
      )}

      {/* Render modern Lucide Plus icon when isAdd is true, otherwise clean emoji */}
      {isAdd ? (
        <div
          style={{
            width: isCompact ? 42 : 46,
            height: isCompact ? 42 : 46,
            borderRadius: 12,
            background: hovered ? 'rgba(122,162,247,0.12)' : 'rgba(255,255,255,0.03)',
            border: `1.5px dashed ${hovered ? 'var(--blue)' : 'rgba(255,255,255,0.18)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transform: hovered ? 'scale(1.06)' : 'none',
            transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
            color: hovered ? 'var(--blue)' : 'var(--text-dim)',
            marginTop: isCompact ? 4 : 0,
            boxShadow: hovered ? '0 0 14px rgba(122,162,247,0.2)' : 'none',
          }}
        >
          <Plus size={isCompact ? 22 : 24} strokeWidth={2.2} />
        </div>
      ) : (
        <div
          style={{
            fontSize: isCompact ? '40px' : '44px',
            lineHeight: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transform: hovered ? 'scale(1.08)' : 'none',
            transition: 'transform 0.25s cubic-bezier(0.16,1,0.3,1)',
            userSelect: 'none',
            marginTop: isCompact ? 4 : 0,
            filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.3))',
          }}
        >
          {emoji}
        </div>
      )}

      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 3, 
        flex: 1, 
        justifyContent: 'center',
        alignItems: isCompact ? 'center' : 'flex-start',
        minWidth: 0,
        width: '100%'
      }}>
        <div style={{
          fontSize: isCompact ? 13 : 15,
          fontWeight: 800,
          color: isAdd ? (hovered ? 'var(--blue)' : 'var(--text-dim)') : '#fff',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          letterSpacing: '-0.3px',
          textAlign: isCompact || isAdd ? 'center' : 'left',
          width: '100%'
        }}>
          {name}
        </div>
        <div style={{
          fontSize: 10,
          color: 'var(--text-dim)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          fontFamily: "'JetBrains Mono', monospace",
          textAlign: isCompact || isAdd ? 'center' : 'left',
          width: '100%'
        }}>
          {isAdd ? (
            <span style={{ color: hovered ? 'var(--blue)' : 'var(--text-dim)', fontWeight: 700 }}>
              + ДОБАВИТЬ
            </span>
          ) : (
            loaderLine
          )}
        </div>
      </div>
    </div>
  );
};

interface InstanceShelfProps {
  isEditMode?: boolean;
  tileShape: 'classic' | 'compact';
  instances: InstanceMeta[];
  selectedInstance: InstanceMeta | null;
  onSelect: (inst: InstanceMeta) => void;
  onAdd: () => void;
}

export const InstanceShelf: React.FC<InstanceShelfProps> = ({ isEditMode = false, tileShape = 'compact', instances, selectedInstance, onSelect, onAdd }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [iconsMap, setIconsMap] = useState<Record<string, string>>({});

  // Local drag state
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [localOrder, setLocalOrder] = useState<string[]>([]);

  useEffect(() => {
    setIconsMap(loadLocalData(StoreKeys.ICONS, {}));
    const savedOrder = loadLocalData('hiroki_instance_order', []);
    setLocalOrder(savedOrder);
  }, []);

  // Sort by localOrder, fallback to ascending creation time (so new instances are added to the end!)
  let sortedInstances = [...instances].sort((a, b) => {
    const idxA = localOrder.indexOf(a.id);
    const idxB = localOrder.indexOf(b.id);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return (a.createdAt || 0) - (b.createdAt || 0);
  });

  const handleDrop = (targetId: string) => {
    if (!draggedId || draggedId === targetId) return;
    const currentOrder = sortedInstances.map(i => i.id);
    const draggedIdx = currentOrder.indexOf(draggedId);
    const targetIdx = currentOrder.indexOf(targetId);
    
    currentOrder.splice(draggedIdx, 1);
    currentOrder.splice(targetIdx, 0, draggedId);
    
    setLocalOrder(currentOrder);
    saveLocalData('hiroki_instance_order', currentOrder);
    setDraggedId(null);
  };

  // Mouse wheel vertical scrolling for multi-row instances
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (e.deltaY !== 0) {
        el.scrollTop += e.deltaY;
      }
    };
    el.addEventListener('wheel', onWheel, { passive: true });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  return (
    <div 
      className="bento-card"
      style={{
        padding: 12,
        minHeight: 0,
        height: '100%',
        width: '100%',
        minWidth: 0,
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {/* Scrollable multi-row instances area with Add tile at the end */}
      <div 
        ref={scrollRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'grid',
          gridTemplateColumns: tileShape === 'compact' ? 'repeat(auto-fill, minmax(115px, 1fr))' : 'repeat(auto-fill, minmax(210px, 1fr))',
          gap: 12,
          alignContent: 'flex-start',
          overflowX: 'hidden',
          overflowY: 'auto',
          scrollbarWidth: 'none',
          minWidth: 0,
          padding: '2px 6px 6px 2px',
          boxSizing: 'border-box',
        }}
      >
        {sortedInstances.map((inst) => (
          <div key={inst.id} 
            className="no-drag"
            draggable={isEditMode}
            onDragStart={() => setDraggedId(inst.id)}
            onDragEnd={() => setDraggedId(null)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(inst.id)}
            style={{ 
              opacity: draggedId === inst.id ? 0.5 : 1,
              transition: 'opacity 0.2s',
              aspectRatio: tileShape === 'compact' ? '1 / 1' : undefined,
              height: tileShape === 'compact' ? undefined : 74,
              width: '100%',
              minHeight: tileShape === 'compact' ? 110 : 74,
              boxSizing: 'border-box',
            }}
          >
            <InstTile shape={tileShape}
              emoji={iconsMap[inst.id] || getEmoji(inst.icon)} 
              name={inst.name}
              loaderLine={`${inst.loaderType} · MC ${inst.gameVersion}`}
              modCount={0}
              selected={selectedInstance?.id === inst.id}
              onClick={() => onSelect(inst)}
            />
          </div>
        ))}

        {/* Add Instance Tile - always at the end of the list and identical in size */}
        <div 
          className="no-drag"
          style={{ 
            aspectRatio: tileShape === 'compact' ? '1 / 1' : undefined,
            height: tileShape === 'compact' ? undefined : 74,
            width: '100%',
            minHeight: tileShape === 'compact' ? 110 : 74,
            boxSizing: 'border-box',
          }}
        >
          <InstTile shape={tileShape}
            emoji=""
            name="Новая сборка"
            loaderLine="Создать / Импорт"
            modCount={0}
            selected={false}
            isAdd={true}
            onClick={onAdd}
          />
        </div>
      </div>
    </div>
  );
};
export default InstanceShelf;
