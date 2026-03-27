'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCommand, createCommand, analyzeCommand, approveCommand, updateCommand } from '@/lib/api';

export function useCommand(id: string | null) {
  return useQuery({
    queryKey: ['command', id],
    queryFn: () => getCommand(id!),
    enabled: !!id,
    refetchInterval: 5000,
  });
}

export function useCommandMutations() {
  const qc = useQueryClient();

  const create = useMutation({
    mutationFn: (data: { projectId: string; instruction: string }) => createCommand(data),
  });

  const analyze = useMutation({
    mutationFn: (id: string) => analyzeCommand(id),
    onSuccess: (_, id) => qc.invalidateQueries({ queryKey: ['command', id] }),
  });

  const approve = useMutation({
    mutationFn: (id: string) => approveCommand(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['taskBoard'] });
    },
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateCommand(id, data),
    onSuccess: (_, { id }) => qc.invalidateQueries({ queryKey: ['command', id] }),
  });

  return { create, analyze, approve, update };
}
