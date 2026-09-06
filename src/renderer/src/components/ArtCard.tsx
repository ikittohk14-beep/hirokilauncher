import React, { useState, useEffect } from 'react'
import { loadLocalData } from '../utils/store'

interface ArtCardProps {
  username?: string
}

// @ts-ignore
import defaultArt from '../assets/art.jpg'

const ArtCard: React.FC<ArtCardProps> = ({ username }) => {
  const [artUrl, setArtUrl] = useState(defaultArt);

  const loadArt = () => {
    const saved = loadLocalData('hiroki_art_url', null);
    if (saved) setArtUrl(saved);
  };

  useEffect(() => {
    loadArt();
    window.addEventListener('art-updated', loadArt);
    return () => window.removeEventListener('art-updated', loadArt);
  }, []);

  return (
    <div
      style={{
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        height: '100%',
        width: '100%',
        borderRadius: 'var(--radius)',
      }}
    >
      <img loading="lazy" src={artUrl}
        alt="Art"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 50%)',
          zIndex: 1,
        }}
      />

      <div style={{ position: 'relative', zIndex: 2, padding: '16px 18px', display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-end' }}>
        <span style={{ fontSize: 24, fontWeight: 900, color: '#fff', letterSpacing: '1px' }}>
          {username ? username.toUpperCase() : 'NO ACCOUNT'}
        </span>
      </div>
    </div>
  )
}

export default ArtCard
