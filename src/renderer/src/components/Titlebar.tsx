import React from 'react'
import { HirokiLogo } from './HirokiLogo'

export const Titlebar: React.FC = () => {
  return (
    <div
      className="drag-area"
      style={{
        height: 38,
        background: '#090a0d',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        borderBottom: '1px solid rgba(255,255,255,0.03)',
        flexShrink: 0,
        zIndex: 50,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <HirokiLogo size={18} />
        <div
          style={{
            fontSize: 12,
            fontWeight: 800,
            color: '#fff',
            letterSpacing: '0.5px',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}
        >
          HIROKILAUNCHER
        </div>
      </div>

      <div className="no-drag" style={{ display: 'flex', gap: 8 }}>
        <div
          onClick={() => window.electronAPI.window.minimize()}
          title="Свернуть"
          style={{
            width: 10, height: 10, borderRadius: '50%',
            background: '#d29922', cursor: 'pointer', transition: '0.15s',
          }}
          onMouseOver={e => (e.currentTarget.style.transform = 'scale(1.2)')}
          onMouseOut={e => (e.currentTarget.style.transform = 'scale(1)')}
        />
        <div
          onClick={() => window.electronAPI.window.maximize()}
          title="Развернуть"
          style={{
            width: 10, height: 10, borderRadius: '50%',
            background: '#2ea043', cursor: 'pointer', transition: '0.15s',
          }}
          onMouseOver={e => (e.currentTarget.style.transform = 'scale(1.2)')}
          onMouseOut={e => (e.currentTarget.style.transform = 'scale(1)')}
        />
        <div
          onClick={() => window.electronAPI.window.close()}
          title="Закрыть"
          style={{
            width: 10, height: 10, borderRadius: '50%',
            background: '#f85149', cursor: 'pointer', transition: '0.15s',
          }}
          onMouseOver={e => (e.currentTarget.style.transform = 'scale(1.2)')}
          onMouseOut={e => (e.currentTarget.style.transform = 'scale(1)')}
        />
      </div>
    </div>
  )
}
