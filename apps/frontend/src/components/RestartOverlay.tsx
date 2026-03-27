'use client';
import { useEffect, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useQueryClient } from '@tanstack/react-query';

export default function RestartOverlay() {
  const { restartingService, restartProgress, restartPhase, setRestarting } =
    useAppStore();
  const qc = useQueryClient();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fallback: if no WebSocket progress arrives, increment slowly
  useEffect(() => {
    if (!restartingService) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      const { restartProgress: p, restartingService: s } =
        useAppStore.getState();
      if (!s) return;
      if (p < 90) {
        setRestarting(s, Math.min(p + 8, 90), 'Processing...');
      }
    }, 400);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [restartingService, setRestarting]);

  // Auto-dismiss when progress reaches 100
  useEffect(() => {
    if (restartProgress >= 100 && restartingService) {
      const timeout = setTimeout(() => {
        setRestarting(null);
        qc.invalidateQueries({ queryKey: ['serviceStatus'] });
      }, 600);
      return () => clearTimeout(timeout);
    }
  }, [restartProgress, restartingService, setRestarting, qc]);

  if (!restartingService) return null;

  const serviceLabels: Record<string, string> = {
    database: 'Database',
    websocket: 'WebSocket',
    ai_provider: 'AI Provider',
    workers: 'Workers',
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-[#0a0c14]/90 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-[#181c2e] border border-[#2a2e45] rounded-2xl p-8 w-full max-w-sm mx-4 text-center">
        {/* Spinning icon */}
        <div className="w-12 h-12 border-[3px] border-[#2a2e45] border-t-[#6c5ce7] rounded-full animate-spin mx-auto mb-5" />

        <h3 className="text-base font-bold mb-1">
          Restarting {serviceLabels[restartingService] || restartingService}
        </h3>
        <p className="text-xs text-[#7b7f9e] mb-5">
          {restartPhase || 'Please wait...'}
        </p>

        {/* Progress bar */}
        <div className="h-2 bg-[#2a2e45] rounded-full overflow-hidden mb-2">
          <div
            className="h-full bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe] rounded-full transition-all duration-300 ease-out"
            style={{ width: `${Math.min(restartProgress, 100)}%` }}
          />
        </div>
        <p className="text-[10px] text-[#555878]">
          {Math.min(restartProgress, 100)}%
        </p>
      </div>
    </div>
  );
}
