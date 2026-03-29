'use client';
import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAgents, getTaskBoard, createAgent, updateAgent, deleteAgent, testAgentChat } from '@/lib/api';
import { agentToAgentData, agentsToRooms, taskToTaskData } from '@/lib/adapters';
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

/** Returns raw API agent data (not adapted to AgentData shape). */
export function useRawAgents() {
  const useMock = useAppStore((s) => s.useMockData);
  return useQuery({
    queryKey: ['agents', 'raw'],
    queryFn: async () => {
      if (useMock) return mockAgents;
      return getAgents();
    },
    staleTime: 3000,
  });
}

export function useRooms() {
  const useMock = useAppStore((s) => s.useMockData);
  const { data: agents, isLoading } = useAgents();
  const { data: taskBoard } = useQuery({
    queryKey: ['taskBoard', 'forRooms'],
    queryFn: async () => {
      if (useMock) return undefined;
      const board = await getTaskBoard();
      return {
        todo: board.todo.map(taskToTaskData),
        in_progress: board.in_progress.map(taskToTaskData),
        review: board.review.map(taskToTaskData),
        done: board.done.map(taskToTaskData),
      };
    },
    staleTime: 5000,
  });

  const rooms = useMemo(() => {
    if (useMock) return mockRooms;
    if (!agents) return undefined;
    return agentsToRooms(agents, taskBoard);
  }, [useMock, agents, taskBoard]);

  return { data: rooms, agents, isLoading };
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

export function useTestAgent() {
  return useMutation({
    mutationFn: (data: { provider: string; model: string; systemPrompt?: string; department?: string; testMessage?: string }) =>
      testAgentChat(data),
  });
}
