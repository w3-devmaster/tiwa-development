'use client';
import { useServiceStatus } from '@/hooks/useServiceStatus';
import { useAppStore } from '@/store/useAppStore';
import { restartService } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';

const statusColors: Record<string, string> = {
  online: 'bg-[#00b894]',
  degraded: 'bg-[#fdcb6e]',
  offline: 'bg-[#e17055]',
};

export default function ServiceStatusPanel() {
  const { data: services } = useServiceStatus();
  const setRestarting = useAppStore((s) => s.setRestarting);
  const qc = useQueryClient();

  const handleRestart = async (name: string) => {
    setRestarting(name, 5, 'Starting...');
    try {
      await restartService(name);
    } catch {
      // Progress is driven by WebSocket; fallback handled in overlay
    } finally {
      // Give socket events time, then ensure cleanup
      setTimeout(() => {
        const store = useAppStore.getState();
        if (store.restartingService === name && store.restartProgress < 100) {
          setRestarting(name, 100, 'Complete');
        }
      }, 5000);
      qc.invalidateQueries({ queryKey: ['serviceStatus'] });
    }
  };

  return (
    <div className="border-t border-[#2a2e45] px-3 py-2.5">
      <div className="text-[9px] uppercase tracking-[1.5px] text-[#555878] font-bold mb-2">
        Services
      </div>
      <div className="space-y-[5px]">
        {(services ?? []).map((svc: any) => (
          <div
            key={svc.name}
            className="flex items-center gap-2 group/svc"
          >
            <div
              className={`w-[6px] h-[6px] rounded-full flex-shrink-0 ${statusColors[svc.status] || 'bg-[#555878]'}`}
            />
            <span className="text-[11px] text-[#7b7f9e] flex-1 truncate">
              {svc.label}
            </span>
            {svc.restartable && (
              <button
                onClick={() => handleRestart(svc.name)}
                className="w-[18px] h-[18px] rounded flex items-center justify-center text-[10px] text-[#555878] hover:text-[#6c5ce7] hover:bg-[#2a2e45] transition-colors opacity-0 group-hover/svc:opacity-100"
                title={`Restart ${svc.label}`}
              >
                ↻
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
