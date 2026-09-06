import React from 'react';


export type BentoNavTab = 'home' | 'catalog' | 'accounts' | 'console' | 'settings';

interface NavRailProps {
  currentTab: BentoNavTab;
  onTabChange: (tab: BentoNavTab) => void;
}

// SVG иконки
const IconGrid = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="7" height="7" rx="1"/>
    <rect x="14" y="3" width="7" height="7" rx="1"/>
    <rect x="14" y="14" width="7" height="7" rx="1"/>
    <rect x="3" y="14" width="7" height="7" rx="1"/>
  </svg>
)

const IconPackage = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
    <line x1="12" y1="22.08" x2="12" y2="12"/>
  </svg>
)

const IconUser = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
)

const IconTerminal = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="4 17 10 11 4 5"/>
    <line x1="12" y1="19" x2="20" y2="19"/>
  </svg>
)

const IconSettings = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
)

const TABS: { id: BentoNavTab, icon: JSX.Element, title: string }[] = [
  { id: 'home', icon: <IconGrid />, title: 'Сборки' },
  { id: 'catalog', icon: <IconPackage />, title: 'Каталог Modrinth' },
  { id: 'accounts', icon: <IconUser />, title: 'Аккаунты' },
  { id: 'console', icon: <IconTerminal />, title: 'JVM Консоль' },
];

export const NavRail: React.FC<NavRailProps> = ({ currentTab, onTabChange }) => {
  return (
    <nav style={{
      width: 60,
      background: 'var(--card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '14px 0',
      gap: 12,
      flexShrink: 0,
      zIndex: 30,
      transition: 'border-color 0.2s',
    }}
    onMouseOver={e => (e.currentTarget.style.borderColor = 'var(--border-hover)')}
    onMouseOut={e => (e.currentTarget.style.borderColor = 'var(--border)')}
    >
      {TABS.map((tab, idx) => (
        <React.Fragment key={tab.id}>
          {idx === 3 && (
            <div style={{ width: 20, height: 1, background: 'var(--border)', margin: '4px 0' }} />
          )}
          <div
            className={`nav-tab${currentTab === tab.id ? ' active' : ''}`}
            title={tab.title}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.icon}
          </div>
        </React.Fragment>
      ))}

      {/* Settings — внизу */}
      <div style={{ marginTop: 'auto' }}>
        <div
          className={`nav-tab${currentTab === 'settings' ? ' active' : ''}`}
          title="Настройки"
          onClick={() => onTabChange('settings')}
        >
          <IconSettings />
        </div>
      </div>
    </nav>
  )
}
