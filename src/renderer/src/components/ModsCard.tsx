import React, { useEffect, useState } from 'react'

interface StatsCardProps {
  instanceId: string | undefined
  totalMods: number // kept for backwards compat with BentoGrid props if needed
  onClick?: () => void
}

const ModsCard: React.FC<StatsCardProps> = ({ instanceId, onClick }) => {
  
  const [checkingUpdates, setCheckingUpdates] = useState(false);
  const [updates, setUpdates] = useState<any[]>([]);
  const [updating, setUpdating] = useState(false);

  const handleCheckUpdates = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!instanceId || checkingUpdates) return;
    setCheckingUpdates(true);
    try {
      const result = await window.electronAPI.content.checkModUpdates(instanceId);
      setUpdates(result || []);
    } catch (err) {
      console.error('Failed to check updates', err);
    }
    setCheckingUpdates(false);
  };

  const handleUpdateAll = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!instanceId || updates.length === 0 || updating) return;
    setUpdating(true);
    try {
      for (const update of updates) {
        await window.electronAPI.content.updateMod(instanceId, update.filename, update.update);
      }
      setUpdates([]);
    } catch (err) {
      console.error('Failed to update mods', err);
    }
    setUpdating(false);
  };

  const [stats, setStats] = useState({
    mods: 0,
    shaders: 0,
    resourcepacks: 0,
    worlds: 0,
  });
  
  const [server, setServer] = useState<{name: string, ip: string} | null>(null);
  const [ping, setPing] = useState<{online: boolean, players?: number, maxPlayers?: number, motd?: string} | null>(null);

  useEffect(() => {
    let active = true;
    
    if (!instanceId) {
      setStats({ mods: 0, shaders: 0, resourcepacks: 0, worlds: 0 });
      setServer(null);
      setPing(null);
      return;
    }

    const loadStats = async () => {
      try {
        let m = 0, s = 0, r = 0, w = 0;
        const items = await window.electronAPI.instances.getInstalledMods(instanceId);
        m = items.filter(x => x.type === 'mod').length;
        s = items.filter(x => x.type === 'shader').length;
        r = items.filter(x => x.type === 'resourcepack').length;
        w = items.filter(x => x.type === 'map').length;

        if (active) setStats({ mods: m, shaders: s, resourcepacks: r, worlds: w });
      } catch (err) {
        console.error('[ModsCard] failed to load stats', err);
      }
    };
    
    let activeServerIp: string | null = null;
    const fetchServer = async () => {
      try {
        const servers = await window.electronAPI.instances.getServers(instanceId);
        if (servers && servers.length > 0 && active) {
          const s = servers[0]; // pick first server
          activeServerIp = s.ip;
          setServer(s);
          const p = await window.electronAPI.instances.pingServer(s.ip);
          if (active) setPing(p);
        } else if (active) {
          activeServerIp = null;
          setServer(null);
          setPing(null);
        }
      } catch (err) {
        console.error(err);
      }
    };
    
    loadStats();
    fetchServer();
    
    // Refresh ping every 30s
    const timer = setInterval(() => {
      if (activeServerIp && active) {
        window.electronAPI.instances.pingServer(activeServerIp).then((p: any) => {
          if (active) setPing(p);
        }).catch(() => {});
      }
    }, 30000);
    
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [instanceId]);

  return (
    <div
      className="bento-card"
      style={{
        padding: '16px 18px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        cursor: 'pointer',
        position: 'relative'
      }}
      onClick={onClick}
    >
      
      <div className="card-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>КОНТЕНТ СБОРКИ</span>
        {instanceId && (
          <div style={{ display: 'flex', gap: '8px' }}>
            {updates.length > 0 ? (
              <button
                onClick={handleUpdateAll}
                disabled={updating}
                style={{
                  fontSize: 10,
                  fontWeight: 'bold',
                  backgroundColor: 'var(--blue)',
                  color: 'white',
                  border: 'none',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  cursor: updating ? 'wait' : 'pointer'
                }}
              >
                {updating ? 'Обновление...' : `Обновить (${updates.length})`}
              </button>
            ) : (
              <button
                onClick={handleCheckUpdates}
                disabled={checkingUpdates}
                style={{
                  fontSize: 10,
                  fontWeight: 'bold',
                  backgroundColor: 'transparent',
                  color: 'var(--text-dim)',
                  border: '1px solid var(--border)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  cursor: checkingUpdates ? 'wait' : 'pointer'
                }}
              >
                {checkingUpdates ? 'Проверка...' : 'Проверить обновления'}
              </button>
            )}
          </div>
        )}
      </div>


      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 12px', marginTop: 'auto', marginBottom: 'auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: 24, fontWeight: 900, lineHeight: 1 }}>{stats.mods}</span>
          <span style={{ fontSize: 10, color: 'var(--text-dim)', fontWeight: 700 }}>МОДОВ</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: 24, fontWeight: 900, lineHeight: 1 }}>{stats.shaders}</span>
          <span style={{ fontSize: 10, color: 'var(--text-dim)', fontWeight: 700 }}>ШЕЙДЕРОВ</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: 24, fontWeight: 900, lineHeight: 1 }}>{stats.resourcepacks}</span>
          <span style={{ fontSize: 10, color: 'var(--text-dim)', fontWeight: 700 }}>РЕСУРСПАКОВ</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: 24, fontWeight: 900, lineHeight: 1 }}>{stats.worlds}</span>
          <span style={{ fontSize: 10, color: 'var(--text-dim)', fontWeight: 700 }}>МИРОВ</span>
        </div>
      </div>
      
      {/* SERVER WIDGET INJECTED HERE */}
      {server && (
        <div style={{
           marginTop: 12,
           paddingTop: 10,
           borderTop: '1px solid var(--border)',
           display: 'flex',
           justifyContent: 'space-between',
           alignItems: 'center',
           gap: 8
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 9, color: 'var(--blue)', fontWeight: 800, letterSpacing: '0.5px' }}>СЕРВЕР</span>
                <span style={{ fontSize: 10, color: 'var(--text-dim)', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{server.name}</span>
             </div>
             
             {ping?.online && ping.motd ? (
               <span style={{ fontSize: 10, color: '#fff', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', marginTop: 2 }}>
                 {ping.motd.replace(/§[0-9a-fk-or]/gi, '')}
               </span>
             ) : ping?.online === false ? (
               <span style={{ fontSize: 10, color: '#ef4444', fontWeight: 600, marginTop: 2 }}>Оффлайн</span>
             ) : (
               <span style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 2 }}>Пинг...</span>
             )}
          </div>
          
          {ping?.online && (
             <div style={{ background: 'rgba(34,197,94,0.1)', padding: '3px 6px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 4, border: '1px solid rgba(34,197,94,0.2)', flexShrink: 0 }}>
                <div style={{ width: 4, height: 4, background: '#22c55e', borderRadius: '50%', boxShadow: '0 0 4px #22c55e' }}></div>
                <span style={{ color: '#22c55e', fontSize: 10, fontWeight: 900 }}>{ping.players} / {ping.maxPlayers}</span>
             </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ModsCard
