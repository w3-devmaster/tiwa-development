'use client';

import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import BottomPanel from '@/components/BottomPanel';
import VirtualOffice from '@/components/pages/VirtualOffice';
import RoomDetail from '@/components/pages/RoomDetail';
import TaskBoard from '@/components/pages/TaskBoard';
import AgentsPage from '@/components/pages/AgentsPage';
import PlaceholderPage from '@/components/pages/PlaceholderPage';
import { useAppStore } from '@/store/useAppStore';

const placeholders: Record<string, { icon: string; title: string }> = {
  projects: { icon: '📁', title: 'Projects' },
  workflows: { icon: '🔄', title: 'Workflows' },
  testing: { icon: '🧪', title: 'Testing' },
  logs: { icon: '📊', title: 'Logs' },
  settings: { icon: '⚙️', title: 'Settings' },
};

export default function Home() {
  const { currentPage } = useAppStore();

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar />
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {currentPage === 'office' && <VirtualOffice />}
          {currentPage === 'detail' && <RoomDetail />}
          {currentPage === 'tasks' && <TaskBoard />}
          {currentPage === 'agents' && <AgentsPage />}
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
