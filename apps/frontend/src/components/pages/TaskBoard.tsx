'use client';
import { tasks } from '@/data/mockData';

const columns = [
  { status: 'todo', title: 'To Do', dotColor: 'bg-[#555878]' },
  { status: 'in_progress', title: 'In Progress', dotColor: 'bg-[#74b9ff]' },
  { status: 'review', title: 'Review', dotColor: 'bg-[#fdcb6e]' },
  { status: 'done', title: 'Done', dotColor: 'bg-[#00b894]' },
];

const tagColors: Record<string, string> = {
  be: 'bg-[rgba(116,185,255,.12)] text-[#74b9ff]',
  fe: 'bg-[rgba(253,203,110,.12)] text-[#fdcb6e]',
  qa: 'bg-[rgba(0,184,148,.12)] text-[#00b894]',
  dv: 'bg-[rgba(108,92,231,.12)] text-[#6c5ce7]',
};

export default function TaskBoard() {
  return (
    <div>
      <div className="flex justify-between items-center mb-[18px] px-6 pt-6">
        <h2 className="text-lg font-bold">📋 Task Board</h2>
        <button className="px-4 py-[7px] rounded-lg text-xs font-medium bg-[#6c5ce7] border-[#6c5ce7] text-white hover:bg-[#7c6cf0] transition-colors">
          + New Task
        </button>
      </div>
      <div className="grid grid-cols-4 gap-3.5 px-6 pb-6">
        {columns.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.status);
          return (
            <div key={col.status} className="bg-[rgba(255,255,255,.015)] border border-[#2a2e45] rounded-[14px] p-3">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#2a2e45]">
                <div className="text-xs font-semibold flex items-center gap-1.5">
                  <div className={`w-[7px] h-[7px] rounded-full ${col.dotColor}`} />
                  {col.title}
                </div>
                <span className="text-[11px] text-[#7b7f9e]">{colTasks.length}</span>
              </div>
              {colTasks.map((task) => (
                <div key={task.id} className={`bg-[#181c2e] border border-[#2a2e45] rounded-lg p-2.5 mb-2 cursor-pointer transition-all hover:border-[#6c5ce7] hover:-translate-y-[1px] ${col.status === 'done' ? 'opacity-50' : ''}`}>
                  <div className="text-xs font-medium mb-1.5">{task.title}</div>
                  <div className="flex items-center justify-between">
                    <span className={`text-[9px] px-[7px] py-[2px] rounded-[6px] font-semibold ${tagColors[task.tagClass]}`}>
                      {task.tag}
                    </span>
                    <div className="w-5 h-5 rounded-full bg-[#6c5ce7] flex items-center justify-center text-[9px] text-white font-bold">
                      {task.assignee}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
