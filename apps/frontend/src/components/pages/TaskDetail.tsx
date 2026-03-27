'use client';
import { useTaskDetail, useExecuteTask, useTaskMutations } from '@/hooks/useTasks';
import { useAppStore } from '@/store/useAppStore';

const statusStyles: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: 'bg-[rgba(85,88,120,.2)]', text: 'text-[#7b7f9e]', label: 'Pending' },
  queued: { bg: 'bg-[rgba(108,92,231,.2)]', text: 'text-[#a29bfe]', label: 'Queued' },
  in_progress: { bg: 'bg-[rgba(116,185,255,.2)]', text: 'text-[#74b9ff]', label: 'In Progress' },
  review: { bg: 'bg-[rgba(253,203,110,.2)]', text: 'text-[#fdcb6e]', label: 'Review' },
  completed: { bg: 'bg-[rgba(0,184,148,.2)]', text: 'text-[#00b894]', label: 'Completed' },
  failed: { bg: 'bg-[rgba(225,112,85,.2)]', text: 'text-[#e17055]', label: 'Failed' },
  cancelled: { bg: 'bg-[rgba(85,88,120,.2)]', text: 'text-[#7b7f9e]', label: 'Cancelled' },
};

export default function TaskDetail() {
  const { selectedTaskId, setSelectedTaskId, setPage } = useAppStore();
  const { data: task, isLoading } = useTaskDetail(selectedTaskId);
  const executeMutation = useExecuteTask();
  const { update, remove } = useTaskMutations();

  const handleCancel = async () => {
    if (!selectedTaskId) return;
    await update.mutateAsync({ id: selectedTaskId, data: { status: 'cancelled' } });
  };

  const handleDelete = async () => {
    if (!selectedTaskId) return;
    await remove.mutateAsync(selectedTaskId);
    setSelectedTaskId(null);
    setPage('tasks');
  };

  if (!selectedTaskId) {
    return (
      <div className="flex items-center justify-center h-full text-[#7b7f9e]">
        Select a task to view details
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 bg-[#181c2e] rounded animate-pulse" />
        <div className="h-4 bg-[#181c2e] rounded animate-pulse w-2/3" />
        <div className="h-32 bg-[#181c2e] rounded animate-pulse" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex items-center justify-center h-full text-[#7b7f9e]">
        Task not found
      </div>
    );
  }

  const status = statusStyles[task.status] || statusStyles.pending;
  const result = task.resultJson as any;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => {
            setSelectedTaskId(null);
            setPage('tasks');
          }}
          className="text-[#7b7f9e] hover:text-white transition-colors text-sm"
        >
          &larr; Back
        </button>
        <div className="flex-1" />
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${status.bg} ${status.text}`}>
          {status.label}
        </span>
      </div>

      {/* Title */}
      <h1 className="text-xl font-bold mb-2">{task.title}</h1>

      {/* Meta */}
      <div className="flex gap-4 mb-6 text-xs text-[#7b7f9e]">
        <span>Type: <span className="text-white">{task.type}</span></span>
        <span>Priority: <span className="text-white">{task.priority}</span></span>
        {task.assignedAgent && (
          <span>
            Agent:{' '}
            <span className="text-white">
              {task.assignedAgent.name} ({task.assignedAgent.role})
            </span>
          </span>
        )}
      </div>

      {/* Description */}
      {task.description && (
        <div className="bg-[#181c2e] border border-[#2a2e45] rounded-xl p-4 mb-4">
          <div className="text-[10px] text-[#7b7f9e] uppercase tracking-wider mb-2">Description</div>
          <p className="text-sm text-[#c8cad8] whitespace-pre-wrap">{task.description}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 mb-4">
        {task.status === 'pending' && (
          <button
            onClick={() => executeMutation.mutate(task.id)}
            disabled={executeMutation.isPending}
            className="px-5 py-2 rounded-lg text-sm font-medium bg-[#6c5ce7] text-white hover:bg-[#7c6cf0] transition-colors disabled:opacity-50"
          >
            {executeMutation.isPending ? 'Executing...' : 'Execute Task'}
          </button>
        )}
        {!['completed', 'cancelled', 'failed'].includes(task.status) && (
          <button
            onClick={handleCancel}
            disabled={update.isPending}
            className="px-5 py-2 rounded-lg text-sm font-medium bg-[#2a2e45] text-[#e17055] hover:bg-[#e17055] hover:text-white transition-colors disabled:opacity-50"
          >
            {update.isPending ? 'Cancelling...' : 'Cancel Task'}
          </button>
        )}
        {['completed', 'cancelled', 'failed'].includes(task.status) && (
          <button
            onClick={handleDelete}
            disabled={remove.isPending}
            className="px-5 py-2 rounded-lg text-sm font-medium bg-[#2a2e45] text-[#e17055] hover:bg-[#e17055] hover:text-white transition-colors disabled:opacity-50"
          >
            {remove.isPending ? 'Deleting...' : 'Delete Task'}
          </button>
        )}
      </div>

      {/* Timeline */}
      <div className="bg-[#181c2e] border border-[#2a2e45] rounded-xl p-4 mb-4">
        <div className="text-[10px] text-[#7b7f9e] uppercase tracking-wider mb-3">Timeline</div>
        <div className="space-y-2 text-xs">
          <div className="flex gap-3">
            <span className="text-[#7b7f9e] w-20">Created</span>
            <span className="text-[#c8cad8]">{new Date(task.createdAt).toLocaleString()}</span>
          </div>
          {task.startedAt && (
            <div className="flex gap-3">
              <span className="text-[#74b9ff] w-20">Started</span>
              <span className="text-[#c8cad8]">{new Date(task.startedAt).toLocaleString()}</span>
            </div>
          )}
          {task.completedAt && (
            <div className="flex gap-3">
              <span className={task.status === 'completed' ? 'text-[#00b894] w-20' : 'text-[#e17055] w-20'}>
                {task.status === 'completed' ? 'Completed' : 'Finished'}
              </span>
              <span className="text-[#c8cad8]">{new Date(task.completedAt).toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>

      {/* Error */}
      {task.error && (
        <div className="bg-[rgba(225,112,85,.08)] border border-[rgba(225,112,85,.3)] rounded-xl p-4 mb-4">
          <div className="text-[10px] text-[#e17055] uppercase tracking-wider mb-2">Error</div>
          <p className="text-sm text-[#e17055] font-mono">{task.error}</p>
        </div>
      )}

      {/* AI Result */}
      {result?.content && (
        <div className="bg-[#181c2e] border border-[#2a2e45] rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[10px] text-[#7b7f9e] uppercase tracking-wider">AI Response</div>
            {result.usage && (
              <div className="text-[10px] text-[#555878]">
                {result.usage.inputTokens + result.usage.outputTokens} tokens
                ({result.provider} / {result.model})
              </div>
            )}
          </div>
          <div className="text-sm text-[#c8cad8] whitespace-pre-wrap font-mono leading-relaxed max-h-[500px] overflow-y-auto">
            {result.content}
          </div>
        </div>
      )}
    </div>
  );
}
