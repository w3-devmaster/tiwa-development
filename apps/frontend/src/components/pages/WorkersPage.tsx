'use client';
import { useState } from 'react';
import { useWorkers, useWorkerMutations } from '@/hooks/useWorkers';

const STATUS_INDICATOR: Record<string, { color: string; label: string }> = {
  idle: { color: '#00b894', label: 'Idle' },
  active: { color: '#fdcb6e', label: 'Active' },
  error: { color: '#e17055', label: 'Error' },
};

function formatUptime(ms: number): string {
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${s % 60}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

export default function WorkersPage() {
  const { data: workers, isLoading } = useWorkers();
  const { add, remove } = useWorkerMutations();

  const [showForm, setShowForm] = useState(false);
  const [host, setHost] = useState('');
  const [port, setPort] = useState('6770');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!host.trim()) return;
    await add.mutateAsync({ host: host.trim(), port: parseInt(port) || 6770 });
    setHost('');
    setPort('6770');
    setShowForm(false);
  };

  const handleRemove = async (id: string) => {
    await remove.mutateAsync(id);
    setDeleteConfirm(null);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <span>🖥️</span> Workers
        </h1>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-[#6c5ce7] hover:bg-[#5b4bd5] text-white rounded-lg font-medium transition-colors text-sm"
        >
          + Add Worker
        </button>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-[#181c2e] border border-[#2a2e45] rounded-2xl p-6 animate-pulse h-44" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workers?.map((worker: any) => {
            const si = STATUS_INDICATOR[worker.status] || STATUS_INDICATOR.idle;
            const cliTools = worker.cliTools || {};
            return (
              <div
                key={worker.id}
                className="bg-[#181c2e] border border-[#2a2e45] rounded-2xl p-6 hover:border-[#3a3e55] transition-colors group relative"
              >
                {/* Status stripe */}
                <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl" style={{ backgroundColor: si.color }} />

                {/* Actions */}
                <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setDeleteConfirm(worker.id)}
                    className="w-7 h-7 rounded-lg bg-[#2a2e45] hover:bg-[#e17055] flex items-center justify-center text-xs transition-colors"
                    title="Remove"
                  >
                    🗑️
                  </button>
                </div>

                {/* Worker ID & Status */}
                <div className="flex items-center gap-2 mb-2 mt-1">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: si.color }} />
                  <h3 className="text-sm font-bold text-[#e4e6f0] font-mono truncate">{worker.id}</h3>
                </div>

                {/* Host */}
                <div className="flex items-center gap-1.5 mb-2 text-xs text-[#7b7f9e]">
                  <span>🌐</span>
                  <span className="font-mono">{worker.host}:{worker.port}</span>
                </div>

                {/* Status */}
                <div className="flex items-center gap-1.5 mb-3 text-xs">
                  <span
                    className="px-2 py-0.5 rounded-md font-medium text-[10px] uppercase"
                    style={{ backgroundColor: si.color + '22', color: si.color }}
                  >
                    {si.label}
                  </span>
                  {worker.uptime > 0 && (
                    <span className="text-[#7b7f9e]">uptime: {formatUptime(worker.uptime)}</span>
                  )}
                </div>

                {/* CLI Tools */}
                <div className="flex flex-wrap gap-1.5 mb-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium ${
                    cliTools.claude?.available
                      ? 'bg-[#00b89422] text-[#00b894]'
                      : 'bg-[#636e7222] text-[#636e72]'
                  }`}>
                    claude {cliTools.claude?.available ? '✓' : '✗'}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium ${
                    cliTools.codex?.available
                      ? 'bg-[#00b89422] text-[#00b894]'
                      : 'bg-[#636e7222] text-[#636e72]'
                  }`}>
                    codex {cliTools.codex?.available ? '✓' : '✗'}
                  </span>
                </div>

                {/* Agents */}
                {worker.agents?.length > 0 && (
                  <div className="text-xs text-[#7b7f9e]">
                    Agents: {worker.agents.length}
                  </div>
                )}

                {/* Delete confirmation */}
                {deleteConfirm === worker.id && (
                  <div className="absolute inset-0 bg-[#181c2eee] rounded-2xl flex flex-col items-center justify-center gap-3 p-4">
                    <p className="text-sm text-center text-[#e4e6f0]">
                      Remove worker <strong className="font-mono">{worker.id}</strong>?
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRemove(worker.id)}
                        className="px-3 py-1.5 bg-[#e17055] hover:bg-[#d63031] text-white rounded-lg text-xs font-medium transition-colors"
                      >
                        Remove
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="px-3 py-1.5 bg-[#2a2e45] hover:bg-[#3a3e55] text-[#e4e6f0] rounded-lg text-xs font-medium transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Empty state */}
          {(!workers || workers.length === 0) && (
            <div className="col-span-3 text-center py-16 text-[#7b7f9e]">
              <div className="text-5xl mb-4">🖥️</div>
              <p className="text-lg font-medium mb-2">No workers connected</p>
              <p className="text-sm mb-1">Workers execute tasks using Claude Code or Codex CLI.</p>
              <p className="text-sm mb-4 font-mono text-[#555878]">tiwa worker start</p>
              <button
                onClick={() => setShowForm(true)}
                className="px-4 py-2 bg-[#6c5ce7] hover:bg-[#5b4bd5] text-white rounded-lg font-medium transition-colors text-sm"
              >
                + Add Worker Manually
              </button>
            </div>
          )}
        </div>
      )}

      {/* Add Worker Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowForm(false)}>
          <div className="bg-[#181c2e] border border-[#2a2e45] rounded-2xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-5">Add Worker</h2>

            <label className="block text-xs text-[#7b7f9e] mb-1.5 font-medium">Host / IP Address *</label>
            <input
              type="text"
              value={host}
              onChange={(e) => setHost(e.target.value)}
              placeholder="e.g. 192.168.1.50 or localhost"
              className="w-full bg-[#0a0c14] border border-[#2a2e45] rounded-lg px-3 py-2 text-sm text-[#e4e6f0] mb-4 outline-none focus:border-[#6c5ce7] transition-colors font-mono"
            />

            <label className="block text-xs text-[#7b7f9e] mb-1.5 font-medium">Port</label>
            <input
              type="number"
              value={port}
              onChange={(e) => setPort(e.target.value)}
              placeholder="6770"
              className="w-full bg-[#0a0c14] border border-[#2a2e45] rounded-lg px-3 py-2 text-sm text-[#e4e6f0] mb-6 outline-none focus:border-[#6c5ce7] transition-colors font-mono"
            />

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-[#2a2e45] hover:bg-[#3a3e55] text-[#e4e6f0] rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={!host.trim() || add.isPending}
                className="px-4 py-2 bg-[#6c5ce7] hover:bg-[#5b4bd5] disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
              >
                {add.isPending ? 'Adding...' : 'Add Worker'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
