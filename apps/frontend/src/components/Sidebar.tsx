'use client';
import { useAppStore, type PageId } from '@/store/useAppStore';
import { useStats } from '@/hooks/useStats';
import { useAgents } from '@/hooks/useAgents';

export default function Sidebar() {
  const { currentPage, setPage, connectionStatus } = useAppStore();
  const { data: stats } = useStats();
  const { data: agents } = useAgents();

  const agentCount = agents?.length ?? 8;
  const taskCount = stats?.totalTasks ?? 12;
  const errorCount = stats?.errors ?? 2;
  const isLive = connectionStatus === 'connected';

  const navSections = [
    {
      title: 'Monitor',
      items: [
        { id: 'office' as PageId, icon: '🏢', label: 'Virtual Office', badge: isLive ? 'Live' : undefined, badgeClass: 'bg-[#00b894]' },
        { id: 'tasks' as PageId, icon: '📋', label: 'Task Board', badge: String(taskCount), badgeClass: 'bg-[#6c5ce7]' },
        { id: 'agents' as PageId, icon: '🤖', label: 'AI Agents', badge: String(agentCount), badgeClass: 'bg-[#6c5ce7]' },
      ],
    },
    {
      title: 'Workspace',
      items: [
        { id: 'departments' as PageId, icon: '🏛️', label: 'Departments' },
        { id: 'projects' as PageId, icon: '📁', label: 'Projects' },
        { id: 'workflows' as PageId, icon: '🔄', label: 'Workflows' },
        { id: 'testing' as PageId, icon: '🧪', label: 'Testing', badge: errorCount ? String(errorCount) : undefined, badgeClass: 'bg-[#e17055]' },
      ],
    },
    {
      title: 'System',
      items: [
        { id: 'logs' as PageId, icon: '📊', label: 'Logs' },
        { id: 'settings' as PageId, icon: '⚙️', label: 'Settings' },
      ],
    },
  ];

  return (
    <aside className="w-[250px] min-w-[250px] bg-[#111422] border-r border-[#2a2e45] flex flex-col z-[100]">
      {/* Header */}
      <div className="px-5 py-[18px] border-b border-[#2a2e45] flex items-center gap-3">
        <div className="w-[42px] h-[42px] bg-gradient-to-br from-[#6c5ce7] to-[#a29bfe] rounded-xl flex items-center justify-center text-[22px] font-extrabold text-white shadow-[0_0_24px_rgba(108,92,231,.35)]">
          T
        </div>
        <div>
          <div className="text-lg font-bold tracking-wide">Tiwa</div>
          <div className="text-[10px] text-[#7b7f9e] tracking-wide">AI Orchestrator System</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2.5 overflow-y-auto">
        {navSections.map((section) => (
          <div key={section.title} className="mb-4">
            <div className="text-[9px] uppercase tracking-[1.8px] text-[#555878] px-3 py-2 font-bold">
              {section.title}
            </div>
            {section.items.map((item) => (
              <button
                key={item.id}
                onClick={() => setPage(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-[9px] rounded-[10px] text-[13px] transition-colors cursor-pointer ${
                  currentPage === item.id
                    ? 'bg-[rgba(108,92,231,.14)] text-[#6c5ce7] font-semibold'
                    : 'text-[#7b7f9e] hover:bg-[#181c2e] hover:text-[#e4e6f0]'
                }`}
              >
                <span className="text-base w-[22px] text-center">{item.icon}</span>
                <span>{item.label}</span>
                {item.badge && (
                  <span className={`ml-auto text-[9px] px-[7px] py-[2px] rounded-[10px] font-bold text-white ${item.badgeClass}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-[18px] py-[14px] border-t border-[#2a2e45] flex items-center gap-2.5">
        <div className="w-[34px] h-[34px] rounded-full bg-gradient-to-br from-[#6c5ce7] to-[#fd79a8] flex items-center justify-center text-[13px] font-bold text-white">
          A
        </div>
        <div>
          <div className="text-[13px] font-medium">Apichat K.</div>
          <div className="text-[10px] text-[#7b7f9e]">Admin / Orchestrator</div>
        </div>
      </div>
    </aside>
  );
}
