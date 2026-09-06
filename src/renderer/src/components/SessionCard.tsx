import React, { useEffect, useState } from 'react'
import { loadLocalData, StoreKeys } from '../utils/store'

interface SessionCardProps {
  instanceId?: string
  instanceName: string
  hoursToday: number // We will calculate this inside instead of props to keep it simple, but we can take prop as base
  isActive: boolean
}

const SessionCard: React.FC<SessionCardProps> = ({ instanceId, instanceName, isActive }) => {
  const [playtime, setPlaytime] = useState(0)

  useEffect(() => {
    let interval: any;
    const updateTime = () => {
      if (!instanceId) {
        setPlaytime(0);
        return;
      }
      const pt = loadLocalData(StoreKeys.PLAYTIME, {});
      const today = new Date().toISOString().split('T')[0];
      let val = (pt[instanceId] && pt[instanceId][today]) ? pt[instanceId][today] : 0;
      setPlaytime(val);
    };

    updateTime();
    
    // Refresh every minute if active to show real time, wait, we only save when stopped.
    // To show real time, we could listen to a global state, but for now we just show saved time.
    interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, [instanceId, isActive]);

  return (
    <div
      className="bento-card"
      style={{
        padding: '16px 18px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
        width: '100%',
      }}
    >
      <div className="card-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>TODAY'S SESSION</span>
        <span>:</span>
      </div>

      <div style={{ fontSize: 32, fontWeight: 900, lineHeight: 1, marginTop: 'auto', marginBottom: 'auto' }}>
        {playtime.toFixed(1)} <span style={{ fontSize: 14, color: 'var(--text-dim)', fontWeight: 500 }}>/ 6H</span>
      </div>

      <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-dim)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>
          {instanceName.toUpperCase()}
        </span>
        {isActive && (
          <span style={{ color: 'var(--green)', fontWeight: 700 }}>
            ● ACTIVE
          </span>
        )}
      </div>
    </div>
  )
}

export default SessionCard
