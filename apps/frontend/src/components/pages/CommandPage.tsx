'use client';
import { useState, useRef } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useProjects } from '@/hooks/useProjects';
import { useCommandMutations } from '@/hooks/useCommands';

type Phase = 'edit' | 'analyzing' | 'review' | 'approved';

export default function CommandPage() {
  const { data: projects } = useProjects();
  const { create, analyze, approve } = useCommandMutations();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [projectId, setProjectId] = useState('');
  const [instruction, setInstruction] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [phase, setPhase] = useState<Phase>('edit');
  const [commandId, setCommandId] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      setInstruction((prev) => prev ? prev + '\n\n' + content : content);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSubmit = async () => {
    if (!projectId || !instruction.trim()) return;
    setError(null);
    setPhase('analyzing');

    try {
      const cmd = await create.mutateAsync({ projectId, instruction });
      setCommandId(cmd.id);

      const result = await analyze.mutateAsync(cmd.id);
      setAnalysis(result.analysisJson);
      setPhase('review');
    } catch (err: any) {
      setError(err.message || 'Analysis failed');
      setPhase('edit');
    }
  };

  const handleApprove = async () => {
    if (!commandId) return;
    setError(null);
    try {
      await approve.mutateAsync(commandId);
      setPhase('approved');
    } catch (err: any) {
      setError(err.message || 'Approval failed');
    }
  };

  const handleEdit = () => {
    setPhase('edit');
    setAnalysis(null);
    setCommandId(null);
  };

  const handleReset = () => {
    setPhase('edit');
    setProjectId('');
    setInstruction('');
    setAnalysis(null);
    setCommandId(null);
    setError(null);
    setShowPreview(false);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold flex items-center gap-2 mb-6">
        <span>⚡</span> Command
      </h1>

      {/* Project selector */}
      <div className="mb-4">
        <label className="block text-xs text-[#7b7f9e] mb-1.5 font-medium">Project *</label>
        <select
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          disabled={phase !== 'edit'}
          className="w-full bg-[#0a0c14] border border-[#2a2e45] rounded-lg px-3 py-2 text-sm text-[#e4e6f0] outline-none focus:border-[#6c5ce7] transition-colors disabled:opacity-50"
        >
          <option value="">-- Select Project --</option>
          {(projects ?? []).map((p: any) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {/* Instruction editor */}
      {phase === 'edit' && (
        <>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-xs text-[#7b7f9e] font-medium">Instruction *</label>
            <div className="flex gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 bg-[#2a2e45] hover:bg-[#3a3e55] text-[#e4e6f0] rounded-lg text-xs font-medium transition-colors"
              >
                📎 Upload .md
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".md,.txt,.markdown"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => setShowPreview(!showPreview)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  showPreview
                    ? 'bg-[#6c5ce7] text-white'
                    : 'bg-[#2a2e45] hover:bg-[#3a3e55] text-[#e4e6f0]'
                }`}
              >
                {showPreview ? '✏️ Editor' : '👁️ Preview'}
              </button>
            </div>
          </div>

          {showPreview ? (
            <div className="bg-[#181c2e] border border-[#2a2e45] rounded-xl p-4 mb-4 min-h-[300px] prose prose-invert prose-sm max-w-none overflow-y-auto">
              <Markdown remarkPlugins={[remarkGfm]}>
                {instruction || '*No instruction yet*'}
              </Markdown>
            </div>
          ) : (
            <textarea
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="Describe what you want the AI agents to do...&#10;&#10;You can write in Markdown format or upload a .md file."
              rows={12}
              className="w-full bg-[#0a0c14] border border-[#2a2e45] rounded-xl px-4 py-3 text-sm text-[#e4e6f0] outline-none focus:border-[#6c5ce7] transition-colors resize-none font-mono leading-relaxed mb-4"
            />
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!projectId || !instruction.trim() || create.isPending || analyze.isPending}
            className="px-6 py-2.5 bg-[#6c5ce7] hover:bg-[#5b4bd5] disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
          >
            🚀 Submit & Analyze
          </button>
        </>
      )}

      {/* Analyzing state */}
      {phase === 'analyzing' && (
        <div className="bg-[#181c2e] border border-[#2a2e45] rounded-xl p-8 text-center">
          <div className="w-10 h-10 border-3 border-[#2a2e45] border-t-[#6c5ce7] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-[#7b7f9e]">Planner agent is analyzing your instruction...</p>
        </div>
      )}

      {/* Review phase - show analysis */}
      {phase === 'review' && analysis && (
        <>
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-[#7b7f9e] font-medium uppercase tracking-wider">Instruction</label>
            </div>
            <div className="bg-[#0a0c14] border border-[#2a2e45] rounded-xl p-4 text-sm text-[#7b7f9e] max-h-[150px] overflow-y-auto whitespace-pre-wrap">
              {instruction}
            </div>
          </div>

          <div className="bg-[#181c2e] border border-[#2a2e45] rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs text-[#7b7f9e] uppercase tracking-wider font-semibold">
                🧠 Planner Analysis
              </div>
              {analysis.usage && (
                <div className="text-[10px] text-[#555878]">
                  {(analysis.usage.inputTokens || 0) + (analysis.usage.outputTokens || 0)} tokens
                </div>
              )}
            </div>
            <div className="prose prose-invert prose-sm max-w-none max-h-[400px] overflow-y-auto">
              <Markdown remarkPlugins={[remarkGfm]}>
                {analysis.content || analysis.error || 'No analysis available'}
              </Markdown>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleApprove}
              disabled={approve.isPending}
              className="px-6 py-2.5 bg-[#00b894] hover:bg-[#00a381] disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {approve.isPending ? 'Approving...' : '✅ Approve & Dispatch'}
            </button>
            <button
              onClick={handleEdit}
              className="px-6 py-2.5 bg-[#2a2e45] hover:bg-[#3a3e55] text-[#e4e6f0] rounded-lg text-sm font-medium transition-colors"
            >
              ✏️ Edit Instruction
            </button>
          </div>
        </>
      )}

      {/* Approved state */}
      {phase === 'approved' && (
        <div className="bg-[rgba(0,184,148,.08)] border border-[rgba(0,184,148,.3)] rounded-xl p-6 text-center">
          <div className="text-4xl mb-3">✅</div>
          <p className="text-lg font-semibold text-[#00b894] mb-2">Command Approved & Dispatched</p>
          <p className="text-sm text-[#7b7f9e] mb-4">Tasks have been created and queued for execution. Check the Task Board for progress.</p>
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-[#6c5ce7] hover:bg-[#5b4bd5] text-white rounded-lg text-sm font-medium transition-colors"
          >
            + New Command
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-4 bg-[rgba(225,112,85,.08)] border border-[rgba(225,112,85,.3)] rounded-xl p-4">
          <p className="text-sm text-[#e17055]">❌ {error}</p>
        </div>
      )}
    </div>
  );
}
