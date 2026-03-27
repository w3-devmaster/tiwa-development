'use client';
import { useState } from 'react';
import { useTaskBoard, useSubmitTask, useTaskMutations } from '@/hooks/useTasks';
import { useAppStore } from '@/store/useAppStore';

const columns = [
  { status: 'todo' as const, title: 'To Do', dotColor: 'bg-[#555878]' },
  { status: 'in_progress' as const, title: 'In Progress', dotColor: 'bg-[#74b9ff]' },
  { status: 'review' as const, title: 'Review', dotColor: 'bg-[#fdcb6e]' },
  { status: 'done' as const, title: 'Done', dotColor: 'bg-[#00b894]' },
];

const tagColors: Record<string, string> = {
  be: 'bg-[rgba(116,185,255,.12)] text-[#74b9ff]',
  fe: 'bg-[rgba(253,203,110,.12)] text-[#fdcb6e]',
  qa: 'bg-[rgba(0,184,148,.12)] text-[#00b894]',
  dv: 'bg-[rgba(108,92,231,.12)] text-[#6c5ce7]',
};

const taskTypes = ['code', 'test', 'review', 'deploy', 'plan', 'fix'];
const priorities = ['low', 'medium', 'high', 'critical'];

export default function TaskBoard() {
  const { data: board, isLoading } = useTaskBoard();
  const submitTask = useSubmitTask();
  const { update, remove } = useTaskMutations();
  const { setPage, setSelectedTaskId } = useAppStore();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', type: 'code', priority: 'medium' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    await submitTask.mutateAsync({
      title: form.title,
      description: form.description || undefined,
      type: form.type,
      priority: form.priority,
    });
    setForm({ title: '', description: '', type: 'code', priority: 'medium' });
    setShowCreate(false);
  };

  const handleTaskClick = (taskId: string) => {
    setSelectedTaskId(taskId);
    setPage('tasks');
  };

  const handleCancel = async (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation();
    await update.mutateAsync({ id: taskId, data: { status: 'cancelled' } });
  };

  const handleDelete = async (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation();
    await remove.mutateAsync(taskId);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-[18px] px-6 pt-6">
        <h2 className="text-lg font-bold">Task Board</h2>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-[7px] rounded-lg text-xs font-medium bg-[#6c5ce7] border-[#6c5ce7] text-white hover:bg-[#7c6cf0] transition-colors"
        >
          + New Task
        </button>
      </div>

      {/* Create Task Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <form
            onSubmit={handleSubmit}
            className="bg-[#181c2e] border border-[#2a2e45] rounded-2xl p-6 w-full max-w-lg mx-4"
          >
            <h3 className="text-base font-bold mb-4">Create & Execute Task</h3>

            <div className="mb-3">
              <label className="text-[10px] text-[#7b7f9e] uppercase tracking-wider block mb-1">Title</label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Create user authentication API"
                className="w-full bg-[#0a0c14] border border-[#2a2e45] rounded-lg px-3 py-2 text-sm text-white placeholder-[#555878] focus:outline-none focus:border-[#6c5ce7]"
                autoFocus
              />
            </div>

            <div className="mb-3">
              <label className="text-[10px] text-[#7b7f9e] uppercase tracking-wider block mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe the task in detail..."
                rows={4}
                className="w-full bg-[#0a0c14] border border-[#2a2e45] rounded-lg px-3 py-2 text-sm text-white placeholder-[#555878] focus:outline-none focus:border-[#6c5ce7] resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 mb-5">
              <div>
                <label className="text-[10px] text-[#7b7f9e] uppercase tracking-wider block mb-1">Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full bg-[#0a0c14] border border-[#2a2e45] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#6c5ce7]"
                >
                  {taskTypes.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-[#7b7f9e] uppercase tracking-wider block mb-1">Priority</label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  className="w-full bg-[#0a0c14] border border-[#2a2e45] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#6c5ce7]"
                >
                  {priorities.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 rounded-lg text-xs text-[#7b7f9e] hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!form.title.trim() || submitTask.isPending}
                className="px-5 py-2 rounded-lg text-xs font-medium bg-[#6c5ce7] text-white hover:bg-[#7c6cf0] transition-colors disabled:opacity-50"
              >
                {submitTask.isPending ? 'Submitting...' : 'Submit & Execute'}
              </button>
            </div>

            {submitTask.isError && (
              <p className="mt-3 text-xs text-[#e17055]">
                Error: {(submitTask.error as Error)?.message || 'Failed to submit'}
              </p>
            )}
          </form>
        </div>
      )}

      {/* Board */}
      <div className="grid grid-cols-4 gap-3.5 px-6 pb-6">
        {columns.map((col) => {
          const colTasks = board?.[col.status] ?? [];
          return (
            <div key={col.status} className="bg-[rgba(255,255,255,.015)] border border-[#2a2e45] rounded-[14px] p-3">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#2a2e45]">
                <div className="text-xs font-semibold flex items-center gap-1.5">
                  <div className={`w-[7px] h-[7px] rounded-full ${col.dotColor}`} />
                  {col.title}
                </div>
                <span className="text-[11px] text-[#7b7f9e]">{colTasks.length}</span>
              </div>
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-16 bg-[#181c2e] border border-[#2a2e45] rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : (
                colTasks.map((task: any) => (
                  <div
                    key={task.id}
                    onClick={() => handleTaskClick(task.id)}
                    className={`bg-[#181c2e] border border-[#2a2e45] rounded-lg p-2.5 mb-2 cursor-pointer transition-all hover:border-[#6c5ce7] hover:-translate-y-[1px] group/task relative ${col.status === 'done' ? 'opacity-50' : ''}`}
                  >
                    <div className="text-xs font-medium mb-1.5">{task.title}</div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[9px] px-[7px] py-[2px] rounded-[6px] font-semibold ${tagColors[task.tagClass]}`}>
                          {task.tag}
                        </span>
                        {task.department && (
                          <span className="text-[9px] px-[6px] py-[1px] rounded-[4px] bg-[rgba(255,255,255,.05)] text-[#7b7f9e]">
                            {task.department}
                          </span>
                        )}
                      </div>
                      <div className="w-5 h-5 rounded-full bg-[#6c5ce7] flex items-center justify-center text-[9px] text-white font-bold">
                        {task.assignee}
                      </div>
                    </div>

                    {/* Action buttons on hover */}
                    <div className="absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover/task:opacity-100 transition-opacity">
                      {col.status !== 'done' && (
                        <button
                          onClick={(e) => handleCancel(e, task.id)}
                          className="w-5 h-5 rounded bg-[#2a2e45] hover:bg-[#e17055] flex items-center justify-center text-[8px] transition-colors"
                          title="Cancel"
                        >
                          ✕
                        </button>
                      )}
                      {col.status === 'done' && (
                        <button
                          onClick={(e) => handleDelete(e, task.id)}
                          className="w-5 h-5 rounded bg-[#2a2e45] hover:bg-[#e17055] flex items-center justify-center text-[8px] transition-colors"
                          title="Delete"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
