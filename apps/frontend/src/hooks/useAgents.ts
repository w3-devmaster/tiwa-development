'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAgents, createAgent, updateAgent, deleteAgent } from '@/lib/api';
import { agentToAgentData, agentsToRooms } from '@/lib/adapters';
import { agents as mockAgents, rooms as mockRooms } from '@/data/mockData';
import { useAppStore } from '@/store/useAppStore';

export function useAgents() {
  const useMock = useAppStore((s) => s.useMockData);
  return useQuery({
    queryKey: ['agents'],
    queryFn: async () => {
      if (useMock) return mockAgents;
      const data = await getAgents();
      return data.map(agentToAgentData);
    },
    staleTime: 3000,
  });
}

export function useRooms() {
  const useMock = useAppStore((s) => s.useMockData);
  const { data: agents } = useAgents();
  return useQuery({
    queryKey: ['rooms'],
    queryFn: async () => {
      if (useMock) return mockRooms;
      if (!agents) return [];
      return agentsToRooms(agents);
    },
    enabled: !!agents,
  });
}

export function useAgentMutations() {
  const qc = useQueryClient();
  const create = useMutation({
    mutationFn: (data: any) => createAgent(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['agents'] }),
  });
  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateAgent(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['agents'] }),
  });
  const remove = useMutation({
    mutationFn: (id: string) => deleteAgent(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['agents'] }),
  });
  return { create, update, remove };
}
