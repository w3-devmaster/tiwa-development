'use client';
import StatsStrip from '@/components/office/StatsStrip';
import WorkflowPipeline from '@/components/office/WorkflowPipeline';
import Room from '@/components/office/Room';
import AgentDetailPanel from '@/components/office/AgentDetailPanel';
import { useRooms } from '@/hooks/useAgents';
import { useAppStore } from '@/store/useAppStore';

export default function VirtualOffice() {
  const { setPage, setSelectedRoom, selectedAgentId, setSelectedAgentId } = useAppStore();
  const { data: rooms, agents, isLoading } = useRooms();

  return (
    <div className="w-full min-h-full p-6" style={{
      background: 'radial-gradient(ellipse at 30% 40%,rgba(108,92,231,.06) 0%,transparent 60%),radial-gradient(ellipse at 70% 60%,rgba(0,184,148,.04) 0%,transparent 50%),#0a0c14',
    }}>
      <StatsStrip />
      <WorkflowPipeline />
      {isLoading ? (
        <div className="grid grid-cols-2 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-48 bg-[#181c2e] border border-[#2a2e45] rounded-[14px] animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-5">
          {(rooms ?? []).map((room) => (
            <Room
              key={room.id}
              room={room}
              agents={agents}
              onClick={() => {
                setSelectedRoom(room.id);
                setPage('detail');
              }}
              onAgentClick={(agentId) => {
                setSelectedAgentId(agentId);
              }}
            />
          ))}
        </div>
      )}

      {/* Agent Detail Panel */}
      {selectedAgentId && (
        <AgentDetailPanel
          agentId={selectedAgentId}
          onClose={() => setSelectedAgentId(null)}
        />
      )}
    </div>
  );
}
