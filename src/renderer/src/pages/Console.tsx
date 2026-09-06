import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Trash2, Copy, Check, ArrowDown } from 'lucide-react';
import type { GameLog } from '../../../preload/types';

interface ConsoleProps {
  logs: GameLog[];
  onClearLogs: () => void;
}

export const Console: React.FC<ConsoleProps> = ({ logs, onClearLogs }) => {
  const [autoScroll, setAutoScroll] = useState(true);
  const [copied, setCopied] = useState(false);
  const [filter, setFilter] = useState('');
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const handleCopy = () => {
    const text = logs.map((l) => `[${new Date(l.timestamp).toLocaleTimeString()}] [${l.level.toUpperCase()}] ${l.message}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredLogs = logs.filter((l) =>
    filter ? l.message.toLowerCase().includes(filter.toLowerCase()) : true
  );

  return (
    <div className="w-full h-full flex flex-col p-8 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Terminal className="text-blue-400" />
            <span>Консоль и логи запуска</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Потоковый вывод игрового процесса и JVM в реальном времени
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Фильтр по логам..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-1.5 bg-hiroki-card border border-hiroki-border rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`p-2 rounded-lg border text-xs transition-all ${
              autoScroll
                ? 'bg-blue-600/20 text-blue-400 border-blue-500/40'
                : 'bg-hiroki-card text-slate-400 border-hiroki-border'
            }`}
            title="Автопрокрутка вниз"
          >
            <ArrowDown size={14} />
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-hiroki-card border border-hiroki-border hover:border-slate-600 text-xs font-semibold text-slate-200 hover:text-white rounded-lg transition-all"
            title="Скопировать все логи"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            <span>{copied ? 'Скопировано!' : 'Копировать'}</span>
          </button>
          <button
            onClick={onClearLogs}
            className="p-2 bg-hiroki-card border border-hiroki-border hover:border-red-500/40 text-slate-400 hover:text-red-400 rounded-lg transition-all"
            title="Очистить логи"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Terminal logs container */}
      <div
        ref={logContainerRef}
        className="flex-1 bg-black/80 rounded-2xl border border-hiroki-border p-4 font-mono text-xs overflow-y-auto select-text shadow-inner"
      >
        {filteredLogs.length === 0 ? (
          <div className="text-slate-600 italic">Логи пока отсутствуют. Запустите игру для просмотра вывода.</div>
        ) : (
          filteredLogs.map((log, index) => {
            let color = 'text-slate-300';
            if (log.level === 'warn') color = 'text-amber-400';
            else if (log.level === 'error') color = 'text-red-400';
            else if (log.level === 'debug') color = 'text-slate-500';

            return (
              <div key={index} className="leading-relaxed whitespace-pre-wrap break-all py-0.5">
                <span className="text-slate-600 select-none mr-2">
                  [{new Date(log.timestamp).toLocaleTimeString()}]
                </span>
                <span className={`font-semibold mr-2 uppercase text-[10px] select-none ${
                  log.level === 'error' ? 'text-red-500' : log.level === 'warn' ? 'text-amber-500' : 'text-blue-500'
                }`}>
                  [{log.level}]
                </span>
                <span className={color}>{log.message}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
