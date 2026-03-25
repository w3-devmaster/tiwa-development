'use client';
import { useState, useEffect, useRef } from 'react';
import { useLiveLogs } from '@/hooks/useLogs';

const deptColors: Record<string, string> = {
  be: 'text-[#74b9ff]',
  fe: 'text-[#fdcb6e]',
  qa: 'text-[#00b894]',
  dv: 'text-[#6c5ce7]',
};

const tabs = [
  { label: 'All', dept: 'all' },
  { label: 'Backend', dept: 'backend' },
  { label: 'Frontend', dept: 'frontend' },
  { label: 'QA', dept: 'qa' },
  { label: 'DevOps', dept: 'devops' },
];

export default function BottomPanel() {
  const [open, setOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const logRef = useRef<HTMLDivElement>(null);
  const { filterByDept } = useLiveLogs();

  const filteredLogs = filterByDept(activeTab);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [filteredLogs]);

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
          {tabs.map((tab) => (
            <span
              key={tab.dept}
              onClick={(e) => {
                e.stopPropagation();
                setActiveTab(tab.dept);
              }}
              className={`px-2.5 py-[3px] rounded-[10px] text-[10px] cursor-pointer transition-colors ${
                activeTab === tab.dept ? 'bg-[#6c5ce7] text-white' : 'text-[#7b7f9e]'
              }`}
            >
              {tab.label}
            </span>
          ))}
        </div>
      </div>
      {open && (
        <div ref={logRef} className="h-[120px] overflow-y-auto px-5 py-1.5 font-mono text-[11px] leading-[1.9]">
          {filteredLogs.map((log, i) => (
            <div key={i} className="flex gap-2.5">
              <span className="text-[#555878] min-w-[60px]">{new Date().toTimeString().slice(0, 8)}</span>
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
