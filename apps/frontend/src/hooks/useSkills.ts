'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSkills, createSkill, updateSkill, deleteSkill } from '@/lib/api';

export function useSkills() {
  return useQuery({
    queryKey: ['skills'],
    queryFn: getSkills,
    staleTime: 30000,
  });
}

export function useSkillMutations() {
  const qc = useQueryClient();
  const create = useMutation({
    mutationFn: (data: any) => createSkill(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['skills'] }),
  });
  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateSkill(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['skills'] }),
  });
  const remove = useMutation({
    mutationFn: (id: string) => deleteSkill(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['skills'] }),
  });
  return { create, update, remove };
}
