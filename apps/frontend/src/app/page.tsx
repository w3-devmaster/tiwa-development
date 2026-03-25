'use client';

import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import BottomPanel from '@/components/BottomPanel';
import VirtualOffice from '@/components/pages/VirtualOffice';
import RoomDetail from '@/components/pages/RoomDetail';
import TaskBoard from '@/components/pages/TaskBoard';
import TaskDetail from '@/components/pages/TaskDetail';
import AgentsPage from '@/components/pages/AgentsPage';
import SettingsPage from '@/components/pages/SettingsPage';
import PlaceholderPage from '@/components/pages/PlaceholderPage';
import { useAppStore } from '@/store/useAppStore';

const placeholders: Record<string, { icon: string; title: string }> = {
  projects: { icon: '📁', title: 'Projects' },
  workflows: { icon: '🔄', title: 'Workflows' },
  testing: { icon: '🧪', title: 'Testing' },
  logs: { icon: '📊', title: 'Logs' },
};

export default function Home() {
  const { currentPage, selectedTaskId } = useAppStore();

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar />
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {currentPage === 'office' && <VirtualOffice />}
          {currentPage === 'detail' && <RoomDetail />}
          {currentPage === 'tasks' && (
            selectedTaskId ? <TaskDetail /> : <TaskBoard />
          )}
          {currentPage === 'agents' && <AgentsPage />}
          {currentPage === 'settings' && <SettingsPage />}
          {placeholders[currentPage] && (
            <PlaceholderPage
              icon={placeholders[currentPage].icon}
              title={placeholders[currentPage].title}
            />
          )}
        </div>
        <BottomPanel />
      </div>
    </div>
  );
}
