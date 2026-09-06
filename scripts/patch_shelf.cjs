const fs = require('fs');
let code = fs.readFileSync('./src/renderer/src/components/InstanceShelf.tsx', 'utf8');

// Replace the InstanceShelf component
const shelfStart = code.indexOf('export const InstanceShelf: React.FC<InstanceShelfProps> = ({ instances, selectedInstance, onSelect, onAdd }) => {');

const newShelf = `export const InstanceShelf: React.FC<InstanceShelfProps> = ({ instances, selectedInstance, onSelect, onAdd }) => {
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
              loaderLine={\`\${inst.loaderType} · MC \${inst.gameVersion}\`}
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
export default InstanceShelf;`;

code = code.substring(0, shelfStart) + newShelf;
fs.writeFileSync('./src/renderer/src/components/InstanceShelf.tsx', code);
