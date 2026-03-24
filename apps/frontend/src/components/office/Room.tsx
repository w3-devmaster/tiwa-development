'use client';
import DeskUnit from './DeskUnit';
import { agents as allAgents } from '@/data/mockData';
import type { AgentData } from '@/data/mockData';

interface RoomData {
  id: string;
  name: string;
  dept: string;
  icon: string;
  iconClass: string;
  agents: string[];
  progress: number;
}

const iconBgs: Record<string, string> = {
  be: 'bg-[rgba(116,185,255,.12)]',
  fe: 'bg-[rgba(253,203,110,.12)]',
  qa: 'bg-[rgba(0,184,148,.12)]',
  dv: 'bg-[rgba(108,92,231,.12)]',
};

const progColors: Record<string, string> = {
  be: 'bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe]',
  fe: 'bg-gradient-to-r from-[#fdcb6e] to-[#ffeaa7]',
  qa: 'bg-gradient-to-r from-[#00b894] to-[#55efc4]',
  dv: 'bg-gradient-to-r from-[#00b894] to-[#55efc4]',
};

export default function Room({ room, onClick }: { room: RoomData; onClick?: () => void }) {
  const roomAgents: AgentData[] = room.agents.map((id) => allAgents.find((a) => a.id === id)!).filter(Boolean);
  const hasActive = roomAgents.some((a) => a.status === 'working' || a.status === 'thinking');

  return (
    <div
      onClick={onClick}
      className="bg-[#181c2e] border border-[#2a2e45] rounded-[18px] overflow-hidden transition-all duration-[350ms] cursor-pointer hover:border-[#6c5ce7] hover:shadow-[0_0_40px_rgba(108,92,231,.15)] hover:-translate-y-1"
    >
      {/* Room sign */}
      <div className="px-5 py-3.5 flex items-center justify-between border-b border-[#2a2e45] bg-gradient-to-r from-[rgba(255,255,255,.02)] to-transparent">
        <div className="flex items-center gap-3">
          <div className={`w-[38px] h-[38px] rounded-[10px] flex items-center justify-center text-lg ${iconBgs[room.iconClass]}`}>
            {room.icon}
          </div>
          <div>
            <div className="text-sm font-semibold">{room.name}</div>
            <div className="text-[10px] text-[#7b7f9e]">{room.dept}</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-[#00b894] font-semibold">
          <div className={`w-2 h-2 rounded-full ${hasActive ? 'bg-[#00b894] animate-[pulse_2s_infinite]' : 'bg-[#fdcb6e]'}`} />
          {hasActive ? 'Active' : 'Busy'}
        </div>
      </div>

      {/* Interior */}
      <div className="px-5 py-6 min-h-[240px] flex justify-center items-start" style={{
        background: 'repeating-linear-gradient(90deg,rgba(255,255,255,.008) 0px,rgba(255,255,255,.008) 1px,transparent 1px,transparent 60px),repeating-linear-gradient(0deg,rgba(255,255,255,.008) 0px,rgba(255,255,255,.008) 1px,transparent 1px,transparent 60px),linear-gradient(180deg,rgba(0,0,0,.08),transparent)',
      }}>
        <div className="flex gap-8 flex-wrap justify-center">
          {roomAgents.map((agent) => (
            <DeskUnit key={agent.id} agent={agent} />
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-[#2a2e45] flex justify-between items-center">
        <div className="flex gap-3.5 text-[10px] text-[#7b7f9e]">
          <span>✅ {room.progress > 80 ? 'Pipeline OK' : `${Math.floor(room.progress * 0.15)} done`}</span>
          <span>🔄 {roomAgents.filter((a) => a.status === 'working').length} active</span>
        </div>
        <div>
          <div className="h-1 bg-[#2a2e45] rounded-sm overflow-hidden w-[120px]">
            <div className={`h-full rounded-sm transition-all duration-1000 ${progColors[room.iconClass]}`} style={{ width: `${room.progress}%` }} />
          </div>
          <div className="text-[10px] text-[#6c5ce7] text-right mt-0.5">{room.progress}%</div>
        </div>
      </div>
    </div>
  );
}
