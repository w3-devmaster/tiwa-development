'use client';
import { create } from 'zustand';

export type PageId = 'office' | 'detail' | 'tasks' | 'agents' | 'projects' | 'workflows' | 'testing' | 'logs' | 'settings';

interface AppState {
  currentPage: PageId;
  setPage: (page: PageId) => void;
  selectedRoom: string | null;
  setSelectedRoom: (room: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentPage: 'office',
  setPage: (page) => set({ currentPage: page }),
  selectedRoom: null,
  setSelectedRoom: (room) => set({ selectedRoom: room }),
}));

export const pageNames: Record<PageId, string> = {
  office: 'Virtual Office',
  detail: 'Room Detail',
  tasks: 'Task Board',
  agents: 'AI Agents',
  projects: 'Projects',
  workflows: 'Workflows',
  testing: 'Testing',
  logs: 'Logs',
  settings: 'Settings',
};
