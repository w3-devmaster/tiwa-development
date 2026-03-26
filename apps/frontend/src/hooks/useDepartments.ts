'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDepartments, createDepartment, updateDepartment, deleteDepartment } from '@/lib/api';

export function useDepartments() {
  return useQuery({
    queryKey: ['departments'],
    queryFn: getDepartments,
    staleTime: 30000,
  });
}

export function useDepartmentMutations() {
  const qc = useQueryClient();
  const create = useMutation({
    mutationFn: (data: any) => createDepartment(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['departments'] }),
  });
  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateDepartment(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['departments'] }),
  });
  const remove = useMutation({
    mutationFn: (id: string) => deleteDepartment(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['departments'] }),
  });
  return { create, update, remove };
}
