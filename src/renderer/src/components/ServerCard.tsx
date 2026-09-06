import React, { useState, useEffect } from 'react';
import { Server, Activity } from 'lucide-react';

interface ServerCardProps {
  instanceId?: string;
}

const ServerCard: React.FC<ServerCardProps> = ({ instanceId }) => {
  const [server, setServer] = useState<{name: string, ip: string} | null>(null);
  const [ping, setPing] = useState<{online: boolean, players?: number, maxPlayers?: number, motd?: string} | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchServer = async () => {
      if (!instanceId) {
        setServer(null);
        setPing(null);
        return;
      }
      setLoading(true);
      try {
        const servers = await window.electronAPI.instances.getServers(instanceId);
        if (servers && servers.length > 0 && active) {
          const s = servers[0]; // pick first server
          setServer(s);
          const p = await window.electronAPI.instances.pingServer(s.ip);
          if (active) setPing(p);
        } else if (active) {
          setServer(null);
          setPing(null);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (active) setLoading(false);
      }
    };
    
    fetchServer();
    
    // Refresh ping every 30s
    const timer = setInterval(() => {
      if (server) {
        window.electronAPI.instances.pingServer(server.ip).then((p: any) => {
          if (active) setPing(p);
        });
      }
    }, 30000);
    
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [instanceId]);

  return (
    <div className="bento-card h-full w-full flex flex-col justify-between p-5 relative overflow-hidden group">
      {/* Background glow for online status */}
      <div 
        className="absolute inset-0 opacity-10 transition-colors duration-1000"
        style={{ background: ping?.online ? 'radial-gradient(circle at center, var(--green) 0%, transparent 70%)' : 'transparent' }}
      />
      
      <div className="relative z-10 flex justify-between items-start">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Server size={12} /> Последний сервер
          </span>
          <span className="text-sm font-black text-white truncate max-w-[150px]">
            {server ? server.name : 'НЕТ СЕРВЕРОВ'}
          </span>
        </div>
        
        {ping?.online && (
          <div className="flex items-center gap-1.5 px-2 py-1 bg-green-500/10 border border-green-500/20 rounded-md">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-bold text-green-500">ONLINE</span>
          </div>
        )}
      </div>

      <div className="relative z-10 flex flex-col gap-1 mt-4">
        {loading && !server ? (
          <div className="text-xs text-slate-500 font-medium animate-pulse">Поиск серверов...</div>
        ) : !server ? (
          <div className="text-[11px] text-slate-500 font-medium">
            В этой сборке еще не добавлены сервера (servers.dat)
          </div>
        ) : (
          <>
            <div className="text-[10px] text-slate-400 font-mono mb-2">{server.ip}</div>
            {ping === null ? (
              <div className="text-xs text-slate-500 flex items-center gap-2">
                <Activity size={14} className="animate-spin" /> Pinging...
              </div>
            ) : ping.online ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-end gap-1.5">
                  <span className="text-2xl font-black text-white leading-none">{ping.players}</span>
                  <span className="text-xs font-bold text-slate-500 mb-0.5">/ {ping.maxPlayers} ИГРОКОВ</span>
                </div>
                {ping.motd && (
                  <div className="text-[10px] text-slate-400 truncate max-w-[150px]">
                    {ping.motd.replace(/§[0-9a-fk-or]/gi, '')}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs font-bold text-red-400/80 mt-1">ОФФЛАЙН</div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ServerCard;
