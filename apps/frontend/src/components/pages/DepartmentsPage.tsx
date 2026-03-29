'use client';
import { useDepartments } from '@/hooks/useDepartments';
import { useAgents } from '@/hooks/useAgents';

export default function DepartmentsPage() {
  const { data: departments, isLoading } = useDepartments();
  const { data: agents } = useAgents();

  const agentCountByDept = (deptName: string) => {
    if (!agents) return 0;
    return agents.filter((a: any) => a.department === deptName || a.department === deptName.toLowerCase()).length;
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <span>🏛️</span> Departments
        </h1>
        <span className="text-xs text-[#7b7f9e] bg-[#181c2e] border border-[#2a2e45] px-3 py-1.5 rounded-lg">
          Fixed workflow: Planner → Architect → Builder → Tester → Reviewer → DevOps
        </span>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-[#181c2e] border border-[#2a2e45] rounded-2xl p-6 animate-pulse h-48" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments?.map((dept: any, index: number) => (
            <div
              key={dept.id}
              className="bg-[#181c2e] border border-[#2a2e45] rounded-2xl p-6 relative"
            >
              {/* Color stripe top */}
              <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl" style={{ backgroundColor: dept.color }} />

              {/* Step number */}
              <div className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: dept.color + '33', color: dept.color }}>
                {index + 1}
              </div>

              {/* Icon */}
              <div className="text-4xl mb-3 mt-1">{dept.icon}</div>

              {/* Name */}
              <h3 className="text-lg font-bold text-[#e4e6f0] mb-1">{dept.name}</h3>

              {/* Description */}
              <p className="text-sm text-[#7b7f9e] mb-4 line-clamp-2">
                {dept.description || 'No description'}
              </p>

              {/* Agent count */}
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-1 rounded-lg font-medium" style={{ backgroundColor: dept.color + '22', color: dept.color }}>
                  {agentCountByDept(dept.name)} Agents
                </span>
              </div>

              {/* Flow arrow (except last) */}
              {index < (departments?.length || 0) - 1 && (
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 text-[#7b7f9e] text-lg z-10">
                  ↓
                </div>
              )}
            </div>
          ))}

          {/* Empty state */}
          {(!departments || departments.length === 0) && (
            <div className="col-span-3 text-center py-16 text-[#7b7f9e]">
              <div className="text-5xl mb-4">🏛️</div>
              <p className="text-lg font-medium mb-2">No departments found</p>
              <p className="text-sm">Run database seed to create default departments</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
