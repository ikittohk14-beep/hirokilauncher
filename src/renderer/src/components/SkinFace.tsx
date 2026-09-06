import React, { useState } from 'react';
import { User } from 'lucide-react';

interface SkinFaceProps {
  skinUrl?: string;
  username: string;
  className?: string;
}

export const SkinFace: React.FC<SkinFaceProps> = ({ username, className, skinUrl }) => {
  const [error, setError] = useState(false);

  if (error) {
    return <User size={24} className="text-slate-400" />;
  }

  if (skinUrl) {
    return (
      <div className={className} style={{ position: 'relative', overflow: 'hidden', borderRadius: '4px' }}>
        {/* Base Face (X: 8, Y: 8) */}
        <img 
          src={skinUrl}
          onError={() => setError(true)}
          alt={username}
          style={{
            position: 'absolute',
            top: '-100%',
            left: '-100%',
            width: '800%',
            height: 'auto',
            maxWidth: 'none',
            imageRendering: 'pixelated'
          }}
        />
        {/* Hat Overlay (X: 40, Y: 8) */}
        <img 
          src={skinUrl}
          alt=""
          style={{
            position: 'absolute',
            top: '-100%',
            left: '-500%',
            width: '800%',
            height: 'auto',
            maxWidth: 'none',
            imageRendering: 'pixelated',
            zIndex: 10
          }}
        />
      </div>
    );
  }

  const faceUrl = `https://minotar.net/helm/${username}/64.png`;

  return (
    <img loading="lazy" 
      src={faceUrl}
      onError={() => setError(true)}
      alt={username}
      className={className}
      style={{ imageRendering: 'pixelated', borderRadius: '4px', objectFit: 'contain' }}
    />
  );
};
