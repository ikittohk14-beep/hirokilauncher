import React, { useState, useEffect, useMemo } from 'react';
import { loadLocalData, StoreKeys } from '../utils/store';
import type { InstanceMeta } from '../../../preload/types';

interface ActivityWidgetProps {
  instances: InstanceMeta[];
}

const ActivityWidget: React.FC<ActivityWidgetProps> = ({ instances }) => {
  const [now, setNow] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [playtime, setPlaytime] = useState<Record<string, Record<string, number>>>({});
  const [iconsMap, setIconsMap] = useState<Record<string, string>>({});

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Poll playtime and icons from local storage periodically (since it might be updated by background game session)
  useEffect(() => {
    const fetchStorage = () => {
      setPlaytime(loadLocalData(StoreKeys.PLAYTIME, {}));
      setIconsMap(loadLocalData(StoreKeys.ICONS, {}));
    };
    fetchStorage();
    const timer = setInterval(fetchStorage, 5000);
    return () => clearInterval(timer);
  }, []);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], [now]);
  const activeDateStr = selectedDate || todayStr;

  // Process data for the active day
  const activeDayInstances = useMemo(() => {
    const items: { id: string; name: string; emoji: string; minutes: number; hours: number }[] = [];
    let totalHours = 0;
    
    Object.entries(playtime).forEach(([instId, dates]) => {
      if (dates[activeDateStr]) {
        const h = dates[activeDateStr];
        totalHours += h;
        const inst = instances.find(i => i.id === instId);
        items.push({
          id: instId,
          name: inst?.name || 'Удаленная сборка',
          emoji: iconsMap[instId] || '🍱',
          minutes: Math.round(h * 60),
          hours: h
        });
      }
    });
    
    items.sort((a, b) => b.hours - a.hours);
    return { items, totalHours };
  }, [playtime, activeDateStr, instances, iconsMap]);

  // Process 28-day heatmap and month total
  const { heatmapDays, monthTotalHours } = useMemo(() => {
    const days = [];
    let mTotal = 0;
    
    for (let i = 27; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      
      let dayTotal = 0;
      Object.values(playtime).forEach((dates) => {
        if (dates[dateStr]) dayTotal += dates[dateStr];
      });
      
      mTotal += dayTotal;
      
      let color = 'var(--card-inner)';
      if (dayTotal > 0 && dayTotal <= 1) color = 'rgba(122,162,247,0.3)';
      else if (dayTotal > 1 && dayTotal <= 3) color = 'rgba(122,162,247,0.5)';
      else if (dayTotal > 3 && dayTotal <= 6) color = 'rgba(122,162,247,0.7)';
      else if (dayTotal > 6) color = 'var(--blue)';
      
      days.push({
        date: dateStr,
        label: d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
        hours: dayTotal,
        color
      });
    }
    return { heatmapDays: days, monthTotalHours: mTotal };
  }, [playtime, now]); // re-run if playtime or day changes

  const timeString = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  const dateString = now.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', weekday: 'long' });

  return (
    <div className="bento-card flex flex-col h-full w-full relative p-5">
      {/* HEADER: CLOCK & DATE */}
      <div className="flex flex-col mb-6">
         <span className="text-[32px] leading-none font-black tracking-tighter text-white">{timeString}</span>
         <span className="text-[10px] font-bold text-[var(--blue)] uppercase tracking-wider mt-1">{dateString}</span>
      </div>

      {/* MIDDLE: TODAY OR SELECTED DAY INFO */}
      <div className="flex-1 flex flex-col min-h-0">
         <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex justify-between items-end">
           <span>{selectedDate ? `АКТИВНОСТЬ ЗА ${new Date(selectedDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}` : "СЕГОДНЯШНЯЯ СЕССИЯ"}</span>
           {selectedDate && (
             <button 
               onClick={() => setSelectedDate(null)}
               className="text-[var(--blue)] hover:text-white transition-colors uppercase text-[9px]"
             >
               Сбросить
             </button>
           )}
         </div>
         <div className="text-[32px] leading-none font-black text-white mb-3">
            {activeDayInstances.totalHours.toFixed(1)} <span className="text-xs font-semibold text-slate-500">ЧАСОВ</span>
         </div>
         
         {/* List of instances played on this day */}
         <div className="flex-1 overflow-y-auto pr-1 hide-scrollbar flex flex-col gap-2">
           {activeDayInstances.items.map(inst => (
             <div key={inst.id} className="flex justify-between items-center bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.04)] transition-colors p-2.5 rounded-lg border border-hiroki-border">
               <div className="flex items-center gap-2.5 min-w-0">
                 <span className="text-base flex-shrink-0">{inst.emoji}</span>
                 <span className="text-[11px] font-bold text-slate-300 truncate leading-none">{inst.name}</span>
               </div>
               <div className="text-[10px] font-black text-[var(--blue)] flex-shrink-0 ml-2 bg-[rgba(122,162,247,0.1)] px-2 py-1 rounded">
                 {inst.minutes} МИН
               </div>
             </div>
           ))}
           {activeDayInstances.items.length === 0 && (
             <div className="text-[11px] text-slate-500 font-medium italic mt-2 text-center bg-[rgba(255,255,255,0.01)] py-4 rounded-lg border border-hiroki-border/50">
               Нет активности в этот день
             </div>
           )}
         </div>
      </div>

      {/* BOTTOM: MONTH HEATMAP */}
      <div className="mt-5 pt-4 border-t border-hiroki-border/60">
         <div className="flex justify-between items-center mb-3">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              СУММАРНО ЗА МЕСЯЦ
            </div>
            <div className="text-[11px] font-black text-slate-300">
              {monthTotalHours.toFixed(1)} Ч.
            </div>
         </div>
         {/* HEATMAP GRID */}
         <div className="grid grid-cols-7 gap-[5px]">
           {heatmapDays.map(day => (
             <div 
               key={day.date}
               onClick={() => setSelectedDate(day.date)}
               className={`aspect-square rounded-[3px] cursor-pointer transition-all hover:scale-110 relative group ${selectedDate === day.date ? 'ring-2 ring-[var(--blue)] ring-offset-2 ring-offset-[var(--card)]' : 'border border-[rgba(255,255,255,0.03)]'}`}
               style={{ backgroundColor: day.color }}
             >
               <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block whitespace-nowrap bg-slate-900 text-white text-[10px] py-1 px-2 rounded pointer-events-none z-10 border border-slate-700 shadow-xl">
                 <span className="font-bold text-[var(--blue)]">{day.label}</span>: {day.hours.toFixed(1)}ч
               </div>
             </div>
           ))}
         </div>
      </div>
    </div>
  );
};

export default ActivityWidget;
