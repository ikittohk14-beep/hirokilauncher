import React, { useMemo } from 'react'
import { loadLocalData, StoreKeys } from '../utils/store'

const HeatmapCard: React.FC = () => {
  const levels = useMemo(() => {
    const pt = loadLocalData(StoreKeys.PLAYTIME, {});
    const now = new Date();
    const data: number[] = [];
    let totalSessions = 0;
    
    // Past 28 days
    for (let i = 27; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      
      let dayTotal = 0;
      Object.values(pt).forEach((instData: any) => {
        if (instData[dateStr]) dayTotal += instData[dateStr];
      });
      
      if (dayTotal > 0) totalSessions++;
      
      let level = 0;
      if (dayTotal > 0 && dayTotal <= 1) level = 1;
      else if (dayTotal > 1 && dayTotal <= 3) level = 2;
      else if (dayTotal > 3 && dayTotal <= 6) level = 3;
      else if (dayTotal > 6) level = 4;
      
      data.push(level);
    }
    return { data, totalSessions };
  }, []);

  const monthName = new Date().toLocaleString('ru', { month: 'long' }).toUpperCase();

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
        <span>MONTH ACTIVITY</span>
        <span style={{ color: 'var(--text-dim)' }}>{monthName}</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: 'auto 0' }}>
        <span style={{ fontSize: 10, fontWeight: 800, color: '#fff' }}>
          {levels.totalSessions} СЕССИЙ ЗА МЕСЯЦ
        </span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
          {levels.data.map((lvl, i) => (
            <div
              key={i}
              className={`h-dot level-${lvl}`}
              style={{
                aspectRatio: '1/1',
                borderRadius: 3,
                background:
                  lvl === 0 ? 'var(--card-inner)' :
                  lvl === 1 ? 'rgba(122,162,247,0.3)' :
                  lvl === 2 ? 'rgba(122,162,247,0.5)' :
                  lvl === 3 ? 'rgba(122,162,247,0.7)' :
                  'var(--blue)',
                border: lvl === 0 ? '1px solid rgba(255,255,255,0.03)' : 'none',
              }}
            />
          ))}
        </div>
      </div>

      <div style={{ fontSize: 10, color: 'var(--text-dim)', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>РЕДКО</span>
        <div style={{ display: 'flex', gap: 2 }}>
          {[0, 1, 2, 3, 4].map(l => (
            <div
              key={l}
              style={{
                width: 6, height: 6, borderRadius: 2,
                background:
                  l === 0 ? 'var(--card-inner)' :
                  l === 1 ? 'rgba(122,162,247,0.3)' :
                  l === 2 ? 'rgba(122,162,247,0.5)' :
                  l === 3 ? 'rgba(122,162,247,0.7)' : 'var(--blue)'
              }}
            />
          ))}
        </div>
        <span>ЧАСТО</span>
      </div>
    </div>
  )
}

export default HeatmapCard
