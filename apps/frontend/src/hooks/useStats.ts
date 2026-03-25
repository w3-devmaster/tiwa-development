'use client';
import { useQuery } from '@tanstack/react-query';
import { getAgentStats, getOrchestratorStatus } from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';

export function useStats() {
  const useMock = useAppStore((s) => s.useMockData);
  return useQuery({
    queryKey: ['stats'],
    queryFn: async () => {
      if (useMock)
        return { activeAgents: 6, totalTasks: 12, completedToday: 28, errors: 2 };
      return getAgentStats();
    },
    refetchInterval: 5000,
  });
}

export function useOrchestratorStatus() {
  const useMock = useAppStore((s) => s.useMockData);
  return useQuery({
    queryKey: ['orchestratorStatus'],
    queryFn: async () => {
      if (useMock)
        return {
          agents: { total: 8, idle: 2, working: 6 },
          tasks: { pending: 3, queued: 0, inProgress: 4 },
          providers: ['anthropic'],
        };
      return getOrchestratorStatus();
    },
    refetchInterval: 5000,
  });
}
