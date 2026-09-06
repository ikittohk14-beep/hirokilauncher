import React, { useState } from 'react'
import type { LaunchProgress } from '../../../preload/types'

type LaunchState = 'idle' | 'booting' | 'ingame'

interface LaunchCardProps {
  instanceName: string
  instanceVersion: string
  isLaunching: boolean
  launchProgress: LaunchProgress | null
  onLaunch: () => void
  onKill: () => void
}

const ArrowIcon: React.FC = () => (
  <div
    style={{
      width: '30px',
      height: '30px',
      borderRadius: '50%',
      background: 'rgba(0,0,0,0.15)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    }}
  >
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 11L11 3M11 3H5M11 3V9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </div>
)

const LaunchCard: React.FC<LaunchCardProps> = ({
  instanceName,
  instanceVersion,
  isLaunching,
  launchProgress,
  onLaunch,
  onKill,
}) => {
  const [hovered, setHovered] = useState(false)

  // Derived state based on props
  let state: LaunchState = 'idle'
  if (isLaunching) {
    if (launchProgress) state = 'booting'
    else state = 'ingame'
  }

  const handleClick = () => {
    if (state === 'idle') {
      onLaunch()
    } else if (state === 'ingame') {
      onKill()
    }
  }

  const getCardStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      cursor: 'pointer',
      borderRadius: 'var(--radius)',
      padding: '18px 20px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      minHeight: 0,
      border: 'none',
      transition: 'all 0.2s ease',
      outline: 'none',
      width: '100%',
      height: '100%',
      boxSizing: 'border-box',
      transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
      filter: hovered ? 'brightness(1.05)' : 'brightness(1)',
      position: 'relative',
    }

    if (state === 'ingame') {
      return {
        ...base,
        background: '#86efac',
        color: '#121316',
        boxShadow: '0 4px 24px rgba(134,239,172,0.35)',
      }
    }

    return {
      ...base,
      background: 'var(--card-accent-beige, #e8dcc8)',
      color: '#121316',
      boxShadow: '0 4px 24px rgba(232,220,200,0.2)',
    }
  }

  const getMainTitle = (): string => {
    if (state === 'booting' || launchProgress) return 'ЗАПУСК...'
    if (state === 'ingame') return 'В ИГРЕ ▶'
    return 'ЗАПУСТИТЬ'
  }

  const getSubLine = (): string => {
    if (launchProgress && launchProgress.step) return launchProgress.step.toUpperCase()
    if (state === 'booting') return 'ПОДГОТОВКА...'
    if (state === 'ingame') return 'КЛИК ДЛЯ ОСТАНОВКИ'
    return `${instanceName.toUpperCase()} · ${instanceVersion}`
  }

  return (
    <button
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={getCardStyle()}
    >
      <div style={{ alignSelf: 'flex-end' }}>
        <ArrowIcon />
      </div>

      <div style={{ width: '100%', textAlign: 'left' }}>
        <div
          className="launch-main-title"
          style={{
            fontSize: '22px',
            fontWeight: 900,
            letterSpacing: '-0.5px',
            lineHeight: 1.1,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}
        >
          {getMainTitle()}
        </div>
        <div
          style={{
            fontSize: '10px',
            opacity: 0.8,
            fontWeight: 800,
            marginTop: '4px',
            fontFamily: "'JetBrains Mono', monospace",
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {getSubLine()}
        </div>
        
        {/* Progress Bar */}
        {(state === 'booting' || launchProgress) && (
          <div style={{ marginTop: 10, width: '100%', height: 4, background: 'rgba(0,0,0,0.1)', borderRadius: 2, overflow: 'hidden' }}>
            <div
              style={{
                width: `${launchProgress ? launchProgress.percentage : 10}%`,
                height: '100%',
                background: '#121316',
                transition: 'width 0.2s',
              }}
            />
          </div>
        )}
      </div>
    </button>
  )
}

export default LaunchCard
