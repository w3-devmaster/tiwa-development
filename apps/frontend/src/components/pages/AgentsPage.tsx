'use client';
import { useAgents } from '@/hooks/useAgents';

export default function AgentsPage() {
  const { data: agents, isLoading } = useAgents();

  return (
    <div>
      <div className="flex justify-between items-center mb-[18px] px-6 pt-6">
        <h2 className="text-lg font-bold">🤖 AI Agents</h2>
        <button className="px-4 py-[7px] rounded-lg text-xs font-medium bg-[#6c5ce7] border-[#6c5ce7] text-white hover:bg-[#7c6cf0] transition-colors">
          + Add Agent
        </button>
      </div>
      {isLoading ? (
        <div className="grid grid-cols-4 gap-3.5 px-6 pb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-52 bg-[#181c2e] border border-[#2a2e45] rounded-[14px] animate-pulse" />
          ))}
        </div>
      ) : (
      <div className="grid grid-cols-4 gap-3.5 px-6 pb-6">
        {(agents ?? []).map((agent) => (
          <div key={agent.id} className="bg-[#181c2e] border border-[#2a2e45] rounded-[14px] p-[18px] text-center transition-all duration-300 cursor-pointer hover:border-[#6c5ce7] hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,.3)]">
            <div className="w-14 h-14 rounded-[14px] mx-auto mb-2.5 flex items-center justify-center text-2xl font-bold text-white" style={{ background: agent.avatar.bg }}>
              {agent.avatar.letter}
            </div>
            <div className="text-sm font-semibold mb-[2px]">{agent.name}</div>
            <div className="text-[11px] text-[#7b7f9e] mb-3">{agent.role}</div>
            <div className="flex justify-center gap-4 mb-2.5">
              <div>
                <div className="text-base font-bold text-[#00b894]">{agent.stats.tasks}</div>
                <div className="text-[9px] text-[#7b7f9e]">Tasks</div>
              </div>
              <div>
                <div className="text-base font-bold text-[#6c5ce7]">{agent.stats.success}%</div>
                <div className="text-[9px] text-[#7b7f9e]">Success</div>
              </div>
            </div>
            <span className="inline-block px-[9px] py-[3px] rounded-lg text-[9px] bg-[rgba(108,92,231,.1)] text-[#6c5ce7] font-semibold">
              {agent.model}
            </span>
          </div>
        ))}
      </div>
      )}
    </div>
  );
}
