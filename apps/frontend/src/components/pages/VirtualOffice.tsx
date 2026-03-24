'use client';
import StatsStrip from '@/components/office/StatsStrip';
import WorkflowPipeline from '@/components/office/WorkflowPipeline';
import Room from '@/components/office/Room';
import { rooms } from '@/data/mockData';
import { useAppStore } from '@/store/useAppStore';

export default function VirtualOffice() {
  const { setPage, setSelectedRoom } = useAppStore();

  return (
    <div className="w-full min-h-full p-6" style={{
      background: 'radial-gradient(ellipse at 30% 40%,rgba(108,92,231,.06) 0%,transparent 60%),radial-gradient(ellipse at 70% 60%,rgba(0,184,148,.04) 0%,transparent 50%),#0a0c14',
    }}>
      <StatsStrip />
      <WorkflowPipeline />
      <div className="grid grid-cols-2 gap-5">
        {rooms.map((room) => (
          <Room
            key={room.id}
            room={room}
            onClick={() => {
              setSelectedRoom(room.id);
              setPage('detail');
            }}
          />
        ))}
      </div>
    </div>
  );
}
