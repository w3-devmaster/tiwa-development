'use client';
import { useQuery } from '@tanstack/react-query';
import { getWorkflows } from '@/lib/api';

export function useWorkflows() {
  return useQuery({
    queryKey: ['workflows'],
    queryFn: getWorkflows,
    refetchInterval: 10000,
  });
}
