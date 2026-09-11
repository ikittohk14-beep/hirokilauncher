import React, { useEffect, useState } from 'react';
import { Music } from 'lucide-react';

interface MusicData {
  status: string;
  artist: string;
  title: string;
  artUrl: string;
}

export const MusicWidget: React.FC = () => {
  const [music, setMusic] = useState<MusicData | null>(null);

  useEffect(() => {
    if (window.electronAPI && window.electronAPI.onMusicUpdate) {
      window.electronAPI.onMusicUpdate((data) => {
        setMusic(data);
      });
    }
  }, []);

  const isPlaying = music?.status?.toLowerCase() === 'playing';
  const hasMedia = music?.title && music.title.length > 0;

  return (
    <div className="bento-card relative overflow-hidden" style={{ minHeight: 0, padding: 0 }}>
      {/* Background Image with blur */}
      {music?.artUrl && (
        <div 
          className="absolute inset-0 z-0 opacity-40 blur-xl scale-110 transition-all duration-1000"
          style={{ 
            backgroundImage: `url(${music.artUrl.replace('file://', 'file://')})`, 
            backgroundSize: 'cover', 
            backgroundPosition: 'center' 
          }}
        />
      )}
      
      <div className="relative z-10 w-full h-full p-4 flex flex-col justify-between">
        <div className="card-label flex items-center gap-2" style={{ marginBottom: 0 }}>
          
          <div className="flex items-end gap-[2px] h-[10px]">
            {[...Array(8)].map((_, i) => (
              <div key={i} className={`eq-bar ${isPlaying ? 'playing' : ''}`} style={!isPlaying ? { transform: 'scaleY(0.2)' } : {}} />
            ))}
          </div>

          <span>MPRIS PLAYER</span>
        </div>

        {hasMedia ? (
          <div className="flex items-center gap-4 mt-2">
            {music?.artUrl ? (
              <img 
                src={music.artUrl} 
                alt="Album Art" 
                className="w-12 h-12 rounded-md object-cover shadow-lg border border-[var(--border)]"
              />
            ) : (
              <div className="w-12 h-12 rounded-md bg-[var(--card-inner)] flex items-center justify-center border border-[var(--border)]">
                <Music size={20} className="text-slate-500" />
              </div>
            )}
            
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-sm font-bold text-white truncate">{music.title}</span>
              <span className="text-xs text-slate-400 truncate">{music.artist || 'Unknown Artist'}</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 mt-2 opacity-50">
            <div className="w-10 h-10 rounded-full bg-[var(--card-inner)] flex items-center justify-center">
              <Music size={16} />
            </div>
            <span className="text-xs font-mono text-slate-400">Not Playing</span>
          </div>
        )}
      </div>
    </div>
  );
};
