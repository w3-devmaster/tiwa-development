'use client';
import { useState, useEffect } from 'react';
import { useAgents, useAgentMutations, useTestAgent } from '@/hooks/useAgents';
import { useDepartments } from '@/hooks/useDepartments';
import { useSettings } from '@/hooks/useSettings';

const MODELS_BY_PROVIDER: Record<string, { value: string; label: string }[]> = {
  anthropic: [
    { value: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4' },
    { value: 'claude-opus-4-20250514', label: 'Claude Opus 4' },
    { value: 'claude-haiku-35-20241022', label: 'Claude Haiku 3.5' },
  ],
  openai: [
    { value: 'gpt-4o', label: 'GPT-4o' },
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
  ],
  gemini: [
    { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
    { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
  ],
};

const PROVIDER_LABELS: Record<string, string> = {
  anthropic: 'Anthropic (Claude)',
  openai: 'OpenAI (GPT)',
  gemini: 'Google (Gemini)',
};

interface AgentForm {
  name: string;
  role: string;
  department: string;
  provider: string;
  model: string;
  systemPrompt: string;
}

const emptyForm: AgentForm = {
  name: '',
  role: '',
  department: '',
  provider: 'anthropic',
  model: 'claude-sonnet-4-20250514',
  systemPrompt: '',
};

export default function AgentsPage() {
  const { data: agents, isLoading } = useAgents();
  const { data: departments } = useDepartments();
  const { data: settings } = useSettings();
  const { create, update, remove } = useAgentMutations();
  const testAgent = useTestAgent();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AgentForm>(emptyForm);
  const [testResult, setTestResult] = useState<{ success: boolean; response?: string; error?: string; provider?: string } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Get available providers from settings
  const availableProviders = (() => {
    if (!settings?.providers) return ['anthropic', 'openai', 'gemini'];
    return Object.entries(settings.providers)
      .filter(([, cfg]: [string, any]) => cfg?.enabled || cfg?.apiKey)
      .map(([name]) => name);
  })();

  // Provider-Model cascade
  useEffect(() => {
    const models = MODELS_BY_PROVIDER[form.provider];
    if (models && !models.some((m) => m.value === form.model)) {
      setForm((prev) => ({ ...prev, model: models[0].value }));
    }
  }, [form.provider]);

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setTestResult(null);
    setShowForm(true);
  };

  const openEdit = (agent: any) => {
    const configJson = agent.configJson || agent.config || {};
    const provider = configJson.provider || detectProvider(agent.model);
    setForm({
      name: agent.name,
      role: agent.role || agent.displayConfig?.role || '',
      department: agent.department || '',
      provider,
      model: agent.model || 'claude-sonnet-4-20250514',
      systemPrompt: configJson.systemPrompt || '',
    });
    setEditingId(agent.id);
    setTestResult(null);
    setShowForm(true);
  };

  const detectProvider = (model: string): string => {
    if (model?.startsWith('claude')) return 'anthropic';
    if (model?.startsWith('gpt') || model?.startsWith('o1') || model?.startsWith('o3') || model?.startsWith('o4')) return 'openai';
    if (model?.startsWith('gemini')) return 'gemini';
    return 'anthropic';
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    const data = {
      name: form.name,
      role: form.role || 'backend',
      model: form.model,
      department: form.department,
      displayConfig: {
        role: form.role,
        avatar: { bg: `linear-gradient(135deg,#6c5ce7,#a29bfe)`, letter: form.name[0]?.toUpperCase() || 'A' },
      },
      configJson: {
        systemPrompt: form.systemPrompt,
        provider: form.provider,
      },
    };

    if (editingId) {
      await update.mutateAsync({ id: editingId, data });
    } else {
      await create.mutateAsync(data);
    }
    setShowForm(false);
    setEditingId(null);
    setTestResult(null);
  };

  const handleTest = async () => {
    setTestResult(null);
    const result = await testAgent.mutateAsync({
      provider: form.provider,
      model: form.model,
      systemPrompt: form.systemPrompt || `You are ${form.name || 'an AI assistant'}. Introduce yourself briefly in Thai.`,
    });
    setTestResult(result);
  };

  const handleDelete = async (id: string) => {
    await remove.mutateAsync(id);
    setDeleteConfirm(null);
  };

  const getAgentAvatar = (agent: any) => {
    const dc = agent.displayConfig || agent.avatar || {};
    if (dc.avatar) return dc.avatar;
    return { bg: 'linear-gradient(135deg,#6c5ce7,#a29bfe)', letter: agent.name?.[0] || '?' };
  };

  const getAgentRole = (agent: any) => {
    return agent.displayConfig?.role || agent.role || 'Agent';
  };

  const getAgentStats = (agent: any) => {
    const s = agent.stats || {};
    return { tasks: s.tasks ?? 0, success: s.success ?? '0%' };
  };

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-[18px] px-6 pt-6">
        <h2 className="text-lg font-bold">🤖 AI Agents</h2>
        <button
          onClick={openCreate}
          className="px-4 py-[7px] rounded-lg text-xs font-medium bg-[#6c5ce7] text-white hover:bg-[#7c6cf0] transition-colors"
        >
          + Add Agent
        </button>
      </div>

      {/* Agent Grid */}
      {isLoading ? (
        <div className="grid grid-cols-4 gap-3.5 px-6 pb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-52 bg-[#181c2e] border border-[#2a2e45] rounded-[14px] animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 px-6 pb-6">
          {(agents ?? []).map((agent: any) => {
            const avatar = getAgentAvatar(agent);
            const role = getAgentRole(agent);
            const stats = getAgentStats(agent);
            return (
              <div
                key={agent.id}
                className="bg-[#181c2e] border border-[#2a2e45] rounded-[14px] p-[18px] text-center transition-all duration-300 hover:border-[#6c5ce7] hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,.3)] group relative"
              >
                {/* Action buttons */}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); openEdit(agent); }}
                    className="w-7 h-7 rounded-lg bg-[#2a2e45] hover:bg-[#6c5ce7] flex items-center justify-center text-xs transition-colors"
                    title="Edit"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteConfirm(agent.id); }}
                    className="w-7 h-7 rounded-lg bg-[#2a2e45] hover:bg-[#e17055] flex items-center justify-center text-xs transition-colors"
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>

                {/* Avatar */}
                <div
                  className="w-14 h-14 rounded-[14px] mx-auto mb-2.5 flex items-center justify-center text-2xl font-bold text-white"
                  style={{ background: avatar.bg }}
                >
                  {avatar.letter}
                </div>

                {/* Info */}
                <div className="text-sm font-semibold mb-[2px]">{agent.name}</div>
                <div className="text-[11px] text-[#7b7f9e] mb-1">{role}</div>
                {agent.department && (
                  <div className="text-[10px] text-[#555878] mb-3">{agent.department}</div>
                )}

                {/* Stats */}
                <div className="flex justify-center gap-4 mb-2.5">
                  <div>
                    <div className="text-base font-bold text-[#00b894]">{stats.tasks}</div>
                    <div className="text-[9px] text-[#7b7f9e]">Tasks</div>
                  </div>
                  <div>
                    <div className="text-base font-bold text-[#6c5ce7]">{stats.success}</div>
                    <div className="text-[9px] text-[#7b7f9e]">Success</div>
                  </div>
                </div>

                {/* Model badge */}
                <span className="inline-block px-[9px] py-[3px] rounded-lg text-[9px] bg-[rgba(108,92,231,.1)] text-[#6c5ce7] font-semibold">
                  {agent.model}
                </span>

                {/* Status indicator */}
                <div className="mt-2">
                  <span className={`inline-block w-2 h-2 rounded-full mr-1 ${
                    agent.status === 'working' || agent.status === 'busy' ? 'bg-[#fdcb6e]' :
                    agent.status === 'error' ? 'bg-[#e17055]' :
                    agent.status === 'idle' ? 'bg-[#00b894]' : 'bg-[#636e72]'
                  }`} />
                  <span className="text-[10px] text-[#7b7f9e] capitalize">{agent.status || 'idle'}</span>
                </div>

                {/* Delete confirmation */}
                {deleteConfirm === agent.id && (
                  <div className="absolute inset-0 bg-[#181c2eee] rounded-[14px] flex flex-col items-center justify-center gap-3 p-4 z-10">
                    <p className="text-xs text-center">Delete <strong>{agent.name}</strong>?</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDelete(agent.id)}
                        className="px-3 py-1.5 bg-[#e17055] hover:bg-[#d63031] text-white rounded-lg text-xs font-medium transition-colors"
                      >
                        Delete
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
          {(!agents || agents.length === 0) && (
            <div className="col-span-4 text-center py-16 text-[#7b7f9e]">
              <div className="text-5xl mb-4">🤖</div>
              <p className="text-lg font-medium mb-2">No agents yet</p>
              <p className="text-sm mb-4">Create your first AI agent to get started</p>
              <button
                onClick={openCreate}
                className="px-4 py-2 bg-[#6c5ce7] hover:bg-[#5b4bd5] text-white rounded-lg font-medium transition-colors text-sm"
              >
                + Create First Agent
              </button>
            </div>
          )}
        </div>
      )}

      {/* Agent Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 overflow-y-auto py-8" onClick={() => { setShowForm(false); setEditingId(null); setTestResult(null); }}>
          <div className="bg-[#181c2e] border border-[#2a2e45] rounded-2xl w-full max-w-lg p-6 my-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-5">
              {editingId ? 'Edit Agent' : 'Create New Agent'}
            </h2>

            {/* Name */}
            <label className="block text-xs text-[#7b7f9e] mb-1.5 font-medium">Agent Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Siam, Karn, Ploy..."
              className="w-full bg-[#0a0c14] border border-[#2a2e45] rounded-lg px-3 py-2 text-sm text-[#e4e6f0] mb-4 outline-none focus:border-[#6c5ce7] transition-colors"
            />

            {/* Role */}
            <label className="block text-xs text-[#7b7f9e] mb-1.5 font-medium">Role / Position</label>
            <input
              type="text"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              placeholder="e.g. Backend Engineer, QA Specialist..."
              className="w-full bg-[#0a0c14] border border-[#2a2e45] rounded-lg px-3 py-2 text-sm text-[#e4e6f0] mb-4 outline-none focus:border-[#6c5ce7] transition-colors"
            />

            {/* Department */}
            <label className="block text-xs text-[#7b7f9e] mb-1.5 font-medium">Department</label>
            <select
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
              className="w-full bg-[#0a0c14] border border-[#2a2e45] rounded-lg px-3 py-2 text-sm text-[#e4e6f0] mb-4 outline-none focus:border-[#6c5ce7] transition-colors"
            >
              <option value="">-- Select Department --</option>
              {(departments ?? []).map((dept: any) => (
                <option key={dept.id} value={dept.name}>
                  {dept.icon} {dept.name}
                </option>
              ))}
            </select>

            {/* Provider + Model (side by side) */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-xs text-[#7b7f9e] mb-1.5 font-medium">AI Provider</label>
                <select
                  value={form.provider}
                  onChange={(e) => setForm({ ...form, provider: e.target.value })}
                  className="w-full bg-[#0a0c14] border border-[#2a2e45] rounded-lg px-3 py-2 text-sm text-[#e4e6f0] outline-none focus:border-[#6c5ce7] transition-colors"
                >
                  {(availableProviders.length > 0 ? availableProviders : ['anthropic', 'openai', 'gemini']).map((p) => (
                    <option key={p} value={p}>{PROVIDER_LABELS[p] || p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-[#7b7f9e] mb-1.5 font-medium">Model</label>
                <select
                  value={form.model}
                  onChange={(e) => setForm({ ...form, model: e.target.value })}
                  className="w-full bg-[#0a0c14] border border-[#2a2e45] rounded-lg px-3 py-2 text-sm text-[#e4e6f0] outline-none focus:border-[#6c5ce7] transition-colors"
                >
                  {(MODELS_BY_PROVIDER[form.provider] || []).map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* System Prompt */}
            <label className="block text-xs text-[#7b7f9e] mb-1.5 font-medium">System Prompt (Identity)</label>
            <textarea
              value={form.systemPrompt}
              onChange={(e) => setForm({ ...form, systemPrompt: e.target.value })}
              placeholder={`You are ${form.name || '[Name]'}, a ${form.role || '[Role]'} at Tiwa. You specialize in...`}
              rows={5}
              className="w-full bg-[#0a0c14] border border-[#2a2e45] rounded-lg px-3 py-2 text-sm text-[#e4e6f0] mb-4 outline-none focus:border-[#6c5ce7] transition-colors resize-none font-mono"
            />

            {/* Test Button */}
            <button
              onClick={handleTest}
              disabled={testAgent.isPending || !form.model}
              className="w-full px-4 py-2.5 mb-3 bg-[#00b894] hover:bg-[#00a381] disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              {testAgent.isPending ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Testing...
                </>
              ) : (
                <>🧪 Test Agent</>
              )}
            </button>

            {/* Test Result */}
            {testResult && (
              <div className={`rounded-lg p-3 mb-4 border text-sm ${
                testResult.success
                  ? 'bg-[#00b89410] border-[#00b89440] text-[#e4e6f0]'
                  : 'bg-[#e1705510] border-[#e1705540] text-[#e17055]'
              }`}>
                {testResult.success ? (
                  <>
                    <div className="text-xs text-[#00b894] font-semibold mb-2 flex items-center gap-1">
                      ✅ Connection Successful — {testResult.provider}/{testResult.response ? 'responded' : 'no response'}
                    </div>
                    <div className="text-[#e4e6f0] whitespace-pre-wrap leading-relaxed text-xs max-h-40 overflow-y-auto">
                      {testResult.response}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-xs font-semibold mb-1">❌ Test Failed</div>
                    <div className="text-xs">{testResult.error}</div>
                  </>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setShowForm(false); setEditingId(null); setTestResult(null); }}
                className="px-4 py-2 bg-[#2a2e45] hover:bg-[#3a3e55] text-[#e4e6f0] rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!form.name.trim() || create.isPending || update.isPending}
                className="px-4 py-2 bg-[#6c5ce7] hover:bg-[#5b4bd5] disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
              >
                {create.isPending || update.isPending ? 'Saving...' : editingId ? 'Update Agent' : 'Create Agent'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
