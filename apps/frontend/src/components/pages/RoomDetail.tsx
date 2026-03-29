'use client';
import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useAgents, useRooms } from '@/hooks/useAgents';
import { useChat } from '@/hooks/useChat';

const tagColors: Record<string, string> = {
  pl: 'bg-[rgba(108,92,231,.12)]',
  ar: 'bg-[rgba(162,155,254,.12)]',
  bu: 'bg-[rgba(9,132,227,.12)]',
  te: 'bg-[rgba(0,184,148,.12)]',
  rv: 'bg-[rgba(225,112,85,.12)]',
  dv: 'bg-[rgba(99,110,114,.12)]',
};

export default function RoomDetail() {
  const { selectedRoom, setPage } = useAppStore();
  const { data: rooms, isLoading: roomsLoading } = useRooms();
  const { data: agents, isLoading: agentsLoading } = useAgents();
  const { messages, sendMessage } = useChat(selectedRoom || '');
  const [input, setInput] = useState('');

  const room = rooms?.find((r) => r.id === selectedRoom) || rooms?.[0];
  const roomAgents = room?.agents
    .map((id: string) => agents?.find((a) => a.id === id))
    .filter(Boolean) ?? [];

  const isLoading = roomsLoading || agentsLoading;

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input.trim());
    setInput('');
  };

  if (isLoading || !room) {
    return (
      <div className="px-6 pt-6">
        <div className="h-12 bg-[#181c2e] rounded-lg animate-pulse mb-5" />
        <div className="grid grid-cols-[1fr_340px] gap-5">
          <div className="space-y-3.5">
            {[1, 2].map((i) => (
              <div key={i} className="h-48 bg-[#181c2e] border border-[#2a2e45] rounded-[14px] animate-pulse" />
            ))}
          </div>
          <div className="h-96 bg-[#181c2e] border border-[#2a2e45] rounded-[14px] animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3.5 mb-5 px-6 pt-6">
        <button onClick={() => setPage('office')} className="w-9 h-9 rounded-full bg-[#181c2e] border border-[#2a2e45] text-white flex items-center justify-center text-base hover:bg-[#6c5ce7] hover:border-[#6c5ce7] transition-colors">
          ←
        </button>
        <div className={`w-11 h-11 rounded-[10px] flex items-center justify-center text-[22px] ${tagColors[room.iconClass]}`}>
          {room.icon}
        </div>
        <div>
          <div className="text-xl font-bold">{room.name}</div>
          <div className="text-[11px] text-[#7b7f9e]">{room.dept}</div>
        </div>
        <span className="px-3 py-1 rounded-[10px] text-[10px] font-bold bg-[rgba(0,184,148,.12)] text-[#00b894]">● Active</span>
      </div>

      {/* Grid: agents + chat */}
      <div className="grid grid-cols-[1fr_340px] gap-5 px-6 pb-6">
        {/* Agent cards */}
        <div>
          {roomAgents.map((agent: any) => (
            <div key={agent.id} className="bg-[#181c2e] border border-[#2a2e45] rounded-[14px] p-[18px] mb-3.5 transition-all hover:border-[#6c5ce7]">
              <div className="flex items-center gap-3 mb-3.5">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-lg font-bold text-white" style={{ background: agent.avatar.bg }}>
                  {agent.avatar.letter}
                </div>
                <div>
                  <div className="text-[15px] font-semibold">{agent.name}</div>
                  <div className="text-[11px] text-[#7b7f9e]">{agent.role} — {agent.model}</div>
                </div>
                <span className={`ml-auto px-2.5 py-1 rounded-[10px] text-[10px] font-semibold ${
                  agent.status === 'working' ? 'bg-[rgba(0,184,148,.12)] text-[#00b894]' : 'bg-[rgba(253,203,110,.12)] text-[#fdcb6e]'
                }`}>
                  ● {agent.status === 'working' ? 'Working' : agent.status === 'thinking' ? 'Thinking' : agent.status === 'error' ? 'Error' : 'Idle'}
                </span>
              </div>
              <div className="bg-[rgba(255,255,255,.02)] rounded-lg px-3 py-2.5 mb-2.5">
                <div className="text-[9px] text-[#555878] uppercase tracking-[1px] mb-[3px]">Current Task</div>
                <div className="text-xs font-medium">{agent.task}</div>
              </div>
              <div className="flex gap-3.5">
                {[
                  { label: 'Tasks', value: agent.stats.tasks },
                  { label: 'Success', value: `${agent.stats.success}%` },
                  { label: 'Avg', value: agent.stats.avgTime },
                  { label: 'Tok/m', value: agent.stats.tokPerMin },
                ].map((m) => (
                  <div key={m.label} className="flex-1 text-center">
                    <div className="text-base font-bold text-[#6c5ce7]">{m.value}</div>
                    <div className="text-[9px] text-[#7b7f9e] mt-[2px]">{m.label}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Chat */}
        <div className="bg-[#181c2e] border border-[#2a2e45] rounded-[14px] flex flex-col h-[calc(100vh-180px)] max-h-[560px]">
          <div className="px-4 py-3 border-b border-[#2a2e45] flex items-center gap-2.5">
            <div className="w-[30px] h-[30px] rounded-full bg-[#00b894] flex items-center justify-center text-xs font-bold text-white">
              {roomAgents[0]?.avatar.letter}
            </div>
            <div>
              <div className="text-[13px] font-semibold">Chat with {roomAgents[0]?.name}</div>
              <div className="text-[10px] text-[#00b894]">● Online — Working</div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3.5 flex flex-col gap-2.5">
            {messages.map((msg, i) => (
              <div key={i} className={`max-w-[85%] px-[13px] py-[9px] rounded-[14px] text-xs leading-relaxed ${
                msg.senderType === 'agent'
                  ? 'bg-[rgba(108,92,231,.1)] border border-[rgba(108,92,231,.18)] self-start rounded-bl-[4px]'
                  : 'bg-[#6c5ce7] text-white self-end rounded-br-[4px]'
              }`}>
                {msg.senderType === 'agent' && <div className="text-[9px] text-[#7b7f9e] mb-[3px] font-semibold">🤖 {msg.sender}</div>}
                {msg.content}
              </div>
            ))}
          </div>
          <div className="p-2.5 border-t border-[#2a2e45] flex gap-2">
            <input
              className="flex-1 bg-[#0a0c14] border border-[#2a2e45] rounded-[18px] px-3.5 py-[7px] text-[#e4e6f0] text-xs outline-none focus:border-[#6c5ce7] placeholder:text-[#555878]"
              placeholder="สั่งงาน หรือ สอบถาม agent..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button
              onClick={handleSend}
              className="w-[34px] h-[34px] rounded-full bg-[#6c5ce7] text-white flex items-center justify-center text-sm hover:bg-[#7c6cf0] hover:scale-105 transition-all"
            >
              ↑
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
