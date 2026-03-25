'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTaskBoard, getTask, createTask, updateTask, submitTask, executeTask } from '@/lib/api';
import { taskToTaskData } from '@/lib/adapters';
import { tasks as mockTasks } from '@/data/mockData';
import { useAppStore } from '@/store/useAppStore';

export function useTaskBoard() {
  const useMock = useAppStore((s) => s.useMockData);
  return useQuery({
    queryKey: ['taskBoard'],
    queryFn: async () => {
      if (useMock) {
        return {
          todo: mockTasks.filter((t) => t.status === 'todo'),
          in_progress: mockTasks.filter((t) => t.status === 'in_progress'),
          review: mockTasks.filter((t) => t.status === 'review'),
          done: mockTasks.filter((t) => t.status === 'done'),
        };
      }
      const board = await getTaskBoard();
      return {
        todo: board.todo.map(taskToTaskData),
        in_progress: board.in_progress.map(taskToTaskData),
        review: board.review.map(taskToTaskData),
        done: board.done.map(taskToTaskData),
      };
    },
  });
}

export function useTaskDetail(taskId: string | null) {
  const useMock = useAppStore((s) => s.useMockData);
  return useQuery({
    queryKey: ['task', taskId],
    queryFn: async () => {
      if (!taskId) return null;
      if (useMock) return null;
      return getTask(taskId);
    },
    enabled: !!taskId && !useMock,
    refetchInterval: 3000,
  });
}

export function useTaskMutations() {
  const qc = useQueryClient();
  const create = useMutation({
    mutationFn: (data: any) => createTask(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['taskBoard'] }),
  });
  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateTask(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['taskBoard'] }),
  });
  return { create, update };
}

export function useSubmitTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { title: string; description?: string; type?: string; priority?: string; projectId?: string }) =>
      submitTask(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['taskBoard'] });
      qc.invalidateQueries({ queryKey: ['stats'] });
      qc.invalidateQueries({ queryKey: ['orchestratorStatus'] });
    },
  });
}

export function useExecuteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) => executeTask(taskId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['taskBoard'] });
      qc.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}
