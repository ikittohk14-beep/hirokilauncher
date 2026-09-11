import React, { useState, useEffect, useMemo, useRef } from 'react';
import { loadLocalData, StoreKeys } from '../utils/store';
import type { InstanceMeta } from '../../../preload/types';

interface ActivityWidgetProps {
  instances: InstanceMeta[];
}

const ActivityWidget: React.FC<ActivityWidgetProps> = ({ instances }) => {
  const widgetRef = useRef<HTMLDivElement>(null);
  const [widgetHeight, setWidgetHeight] = useState<number>(400);
  const [now, setNow] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [hoveredDay, setHoveredDay] = useState<{
    weekday: string;
    label: string;
    timeText: string;
    hours: number;
  } | null>(null);
  const [playtime, setPlaytime] = useState<Record<string, Record<string, number>>>({});
  const [iconsMap, setIconsMap] = useState<Record<string, string>>({});

  // Dynamic height measurement to switch to compact mode when widget is small
  useEffect(() => {
    if (!widgetRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        setWidgetHeight(entries[0].contentRect.height);
      }
    });
    observer.observe(widgetRef.current);
    return () => observer.disconnect();
  }, []);

  const isCompact = widgetHeight < 315;

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Poll playtime and icons from local storage periodically
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

  const formatTimeText = (hours: number): string => {
    if (hours <= 0) return '0 ч (нет сессий)';
    const totalMinutes = Math.round(hours * 60);
    if (totalMinutes < 60) return `${totalMinutes} мин`;
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return m > 0 ? `${h} ч ${m} мин` : `${h} ч`;
  };

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
      
      let level = 0;
      if (dayTotal > 0 && dayTotal < 0.5) level = 1;
      else if (dayTotal >= 0.5 && dayTotal < 1.5) level = 2;
      else if (dayTotal >= 1.5 && dayTotal < 3.5) level = 3;
      else if (dayTotal >= 3.5) level = 4;
      
      const isToday = i === 0;
      const weekday = d.toLocaleDateString('ru-RU', { weekday: 'short' });
      const label = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
      
      days.push({
        date: dateStr,
        weekday,
        label,
        hours: dayTotal,
        timeText: formatTimeText(dayTotal),
        level,
        isToday
      });
    }
    return { heatmapDays: days, monthTotalHours: mTotal };
  }, [playtime, now]);

  const getCubeClass = (day: { level: number; isToday: boolean; date: string }, isSelected: boolean) => {
    const base = "aspect-square w-full max-w-[20px] rounded-[4px] mx-auto cursor-pointer transition-all duration-150 relative flex items-center justify-center";
    
    if (isSelected) {
      return `${base} ring-2 ring-[var(--blue)] ring-offset-2 ring-offset-[#121318] scale-110 z-10 shadow-[0_0_10px_rgba(122,162,247,0.6)] ${
        day.level === 0 ? 'bg-[rgba(122,162,247,0.15)] border border-[var(--blue)]' : ''
      }`;
    }
    
    switch (day.level) {
      case 1:
        return `${base} bg-[#7aa2f7]/30 border border-[#7aa2f7]/40 hover:bg-[#7aa2f7]/50 hover:scale-110 shadow-[0_0_4px_rgba(122,162,247,0.2)]`;
      case 2:
        return `${base} bg-[#7aa2f7]/60 border border-[#7aa2f7]/70 hover:bg-[#7aa2f7]/80 hover:scale-110 shadow-[0_0_8px_rgba(122,162,247,0.35)]`;
      case 3:
        return `${base} bg-[var(--blue)] border border-[#9ab8ff] hover:brightness-110 hover:scale-110 shadow-[0_0_10px_rgba(122,162,247,0.5)]`;
      case 4:
        return `${base} bg-[#b4f9f8] border border-white hover:brightness-110 hover:scale-110 shadow-[0_0_12px_rgba(180,249,248,0.7)]`;
      default:
        if (day.isToday) {
          return `${base} bg-white/[0.05] border border-[var(--blue)]/60 hover:bg-white/[0.12] hover:border-[var(--blue)] hover:scale-110 shadow-[0_0_6px_rgba(122,162,247,0.2)]`;
        }
        return `${base} bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.12] hover:border-white/[0.2] hover:scale-110`;
    }
  };

  const timeString = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  const dateString = now.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', weekday: 'long' });

  return (
    <div 
      ref={widgetRef}
      className="bento-card flex flex-col h-full w-full relative p-4 overflow-hidden box-border select-none"
    >
      {/* HEADER: CLOCK & DATE */}
      <div className="flex flex-col flex-shrink-0 mb-2">
        <span className="text-2xl sm:text-[26px] leading-none font-black tracking-tighter text-white">{timeString}</span>
        <span className="text-[10px] font-bold text-[var(--blue)] uppercase tracking-wider mt-1 truncate">{dateString}</span>
      </div>

      {/* MIDDLE: TODAY OR SELECTED DAY INFO */}
      <div className={`flex flex-col flex-shrink-0 ${isCompact ? 'mb-2' : 'mb-1.5'}`}>
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5 flex justify-between items-center">
          <span className="truncate mr-2">
            {selectedDate ? `АКТИВНОСТЬ: ${new Date(selectedDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}` : "СЕГОДНЯШНЯЯ СЕССИЯ"}
          </span>
          {selectedDate && (
            <button 
              onClick={() => setSelectedDate(null)}
              className="text-[var(--blue)] hover:text-white transition-colors uppercase text-[9px] flex-shrink-0 cursor-pointer font-bold"
            >
              Сбросить
            </button>
          )}
        </div>
        <div className="text-xl sm:text-2xl leading-none font-black text-white">
          {activeDayInstances.totalHours.toFixed(1)} <span className="text-xs font-semibold text-slate-500">ЧАСОВ</span>
        </div>
      </div>

      {/* INSTANCE LIST: Only shown when widget is tall enough (!isCompact) */}
      {!isCompact && (
        <div className="flex-1 flex flex-col min-h-0 mb-2 overflow-hidden">
          <div className="flex-1 overflow-y-auto pr-0.5 flex flex-col gap-1.5 min-h-0" style={{ scrollbarWidth: 'none' }}>
            {activeDayInstances.items.map(inst => (
              <div key={inst.id} className="flex justify-between items-center bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.04)] transition-colors px-2.5 py-1.5 rounded-lg border border-hiroki-border flex-shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm flex-shrink-0">{inst.emoji}</span>
                  <span className="text-[11px] font-bold text-slate-300 truncate leading-none">{inst.name}</span>
                </div>
                <div className="text-[9px] font-black text-[var(--blue)] flex-shrink-0 ml-2 bg-[rgba(122,162,247,0.1)] px-2 py-0.5 rounded">
                  {inst.minutes} МИН
                </div>
              </div>
            ))}
            {activeDayInstances.items.length === 0 && (
              <div className="text-[10px] text-slate-500 font-medium italic text-center bg-[rgba(255,255,255,0.01)] py-2 rounded-lg border border-hiroki-border/40">
                Нет активности в этот день
              </div>
            )}
          </div>
        </div>
      )}

      {/* BOTTOM: MONTH HEATMAP */}
      <div className="mt-auto pt-2 border-t border-hiroki-border/60 flex-shrink-0">
        <div className="flex justify-between items-center mb-1.5 h-4">
          <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider truncate mr-2">
            {hoveredDay ? (
              <span className="text-[var(--blue)] font-extrabold flex items-center gap-1">
                <span>{hoveredDay.weekday.toUpperCase()}, {hoveredDay.label}</span>
              </span>
            ) : (
              'СУММАРНО ЗА МЕСЯЦ'
            )}
          </div>
          <div className="text-[10px] font-black text-slate-300 font-mono flex-shrink-0">
            {hoveredDay ? (
              <span className="text-white font-mono font-bold">{hoveredDay.timeText}</span>
            ) : (
              `${monthTotalHours.toFixed(1)} Ч.`
            )}
          </div>
        </div>

        {/* ERGONOMIC HEATMAP GRID (4 rows x 7 cols) */}
        <div className="grid grid-cols-7 gap-1.5 justify-items-center w-full">
          {heatmapDays.map(day => {
            const isSelected = selectedDate === day.date;
            return (
              <div 
                key={day.date}
                onClick={() => setSelectedDate(day.date)}
                onMouseEnter={() => setHoveredDay({
                  weekday: day.weekday,
                  label: day.label,
                  timeText: day.timeText,
                  hours: day.hours
                })}
                onMouseLeave={() => setHoveredDay(null)}
                title={`${day.weekday.toUpperCase()}, ${day.label}: ${day.timeText}`}
                className={getCubeClass(day, isSelected)}
              >
                {day.isToday && day.level === 0 && (
                  <span className="w-1 h-1 rounded-full bg-[var(--blue)] animate-pulse" />
                )}
              </div>
            );
          })}
        </div>

        {/* Heatmap Legend */}
        <div className="flex items-center justify-between mt-1.5 pt-1 text-[8px] font-mono text-slate-500 uppercase tracking-wider">
          <span>Меньше</span>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-[2px] bg-white/[0.04] border border-white/[0.06]" />
            <div className="w-2 h-2 rounded-[2px] bg-[#7aa2f7]/30 border border-[#7aa2f7]/40" />
            <div className="w-2 h-2 rounded-[2px] bg-[#7aa2f7]/60 border border-[#7aa2f7]/70" />
            <div className="w-2 h-2 rounded-[2px] bg-[var(--blue)] border border-[#9ab8ff]" />
            <div className="w-2 h-2 rounded-[2px] bg-[#b4f9f8] border border-white" />
          </div>
          <span>Больше</span>
        </div>
      </div>
    </div>
  );
};

export default ActivityWidget;
