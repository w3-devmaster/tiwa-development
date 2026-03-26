'use client';
import { create } from 'zustand';

export type PageId = 'office' | 'detail' | 'tasks' | 'agents' | 'departments' | 'projects' | 'workflows' | 'testing' | 'logs' | 'settings';

interface AppState {
  currentPage: PageId;
  setPage: (page: PageId) => void;
  selectedRoom: string | null;
  setSelectedRoom: (room: string | null) => void;
  selectedTaskId: string | null;
  setSelectedTaskId: (taskId: string | null) => void;
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
  setConnectionStatus: (status: 'connected' | 'disconnected' | 'reconnecting') => void;
  useMockData: boolean;
  setUseMockData: (val: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentPage: 'office',
  setPage: (page) => set({ currentPage: page }),
  selectedRoom: null,
  setSelectedRoom: (room) => set({ selectedRoom: room }),
  selectedTaskId: null,
  setSelectedTaskId: (taskId) => set({ selectedTaskId: taskId }),
  connectionStatus: 'disconnected',
  setConnectionStatus: (status) => set({ connectionStatus: status }),
  useMockData: false,
  setUseMockData: (val) => set({ useMockData: val }),
}));

export const pageNames: Record<PageId, string> = {
  office: 'Virtual Office',
  detail: 'Room Detail',
  tasks: 'Task Board',
  agents: 'AI Agents',
  departments: 'Departments',
  projects: 'Projects',
  workflows: 'Workflows',
  testing: 'Testing',
  logs: 'Logs',
  settings: 'Settings',
};
