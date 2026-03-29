'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getWorkers, addWorker, removeWorker } from '@/lib/api';

export function useWorkers() {
  return useQuery({
    queryKey: ['workers'],
    queryFn: getWorkers,
    refetchInterval: 5000, // refresh every 5s
    staleTime: 3000,
  });
}

export function useWorkerMutations() {
  const qc = useQueryClient();
  const add = useMutation({
    mutationFn: (data: { host: string; port: number }) => addWorker(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workers'] }),
  });
  const remove = useMutation({
    mutationFn: (id: string) => removeWorker(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workers'] }),
  });
  return { add, remove };
}
