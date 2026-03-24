'use client';
import { useState, useEffect, useRef } from 'react';
import { logEntries } from '@/data/mockData';

const deptColors: Record<string, string> = {
  be: 'text-[#74b9ff]',
  fe: 'text-[#fdcb6e]',
  qa: 'text-[#00b894]',
  dv: 'text-[#6c5ce7]',
};

export default function BottomPanel() {
  const [logs, setLogs] = useState<{ time: string; agent: string; dept: string; message: string }[]>([]);
  const [open, setOpen] = useState(true);
  const logRef = useRef<HTMLDivElement>(null);
  const idxRef = useRef(0);

  useEffect(() => {
    // Initial logs
    const initial = [];
    for (let i = 0; i < 6; i++) {
      const entry = logEntries[i % logEntries.length];
      initial.push({
        time: new Date().toTimeString().slice(0, 8),
        agent: entry.agent,
        dept: entry.dept,
        message: entry.message,
      });
    }
    setLogs(initial);
    idxRef.current = 6;

    const interval = setInterval(() => {
      const entry = logEntries[idxRef.current % logEntries.length];
      setLogs((prev) => {
        const next = [
          ...prev,
          {
            time: new Date().toTimeString().slice(0, 8),
            agent: entry.agent,
            dept: entry.dept,
            message: entry.message,
          },
        ];
        if (next.length > 40) return next.slice(-40);
        return next;
      });
      idxRef.current++;
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="bg-[#181c2e] border-t border-[#2a2e45]">
      <div
        className="flex items-center justify-between px-5 py-2 border-b border-[#2a2e45] cursor-pointer"
        onClick={() => setOpen(!open)}
      >
        <div className="text-xs font-semibold flex items-center gap-2">
          <span className="w-[7px] h-[7px] bg-[#e17055] rounded-full animate-[pulse_1s_infinite]" />
          Live Activity Feed
        </div>
        <div className="flex gap-1">
          {['All', 'Backend', 'Frontend', 'QA', 'DevOps'].map((tab, i) => (
            <span
              key={tab}
              className={`px-2.5 py-[3px] rounded-[10px] text-[10px] cursor-pointer transition-colors ${
                i === 0 ? 'bg-[#6c5ce7] text-white' : 'text-[#7b7f9e]'
              }`}
            >
              {tab}
            </span>
          ))}
        </div>
      </div>
      {open && (
        <div ref={logRef} className="h-[120px] overflow-y-auto px-5 py-1.5 font-mono text-[11px] leading-[1.9]">
          {logs.map((log, i) => (
            <div key={i} className="flex gap-2.5">
              <span className="text-[#555878] min-w-[60px]">{log.time}</span>
              <span className={`min-w-[80px] font-semibold ${deptColors[log.dept] || 'text-[#7b7f9e]'}`}>
                {log.agent}
              </span>
              <span className="text-[#7b7f9e]">{log.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
