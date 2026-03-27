'use client';
import { useState } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useSkills, useSkillMutations } from '@/hooks/useSkills';

export default function SkillsPage() {
  const { data: skills, isLoading } = useSkills();
  const { create, update, remove } = useSkillMutations();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editContent, setEditContent] = useState('');
  const [isNew, setIsNew] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const handleSelect = (skill: any) => {
    setSelectedId(skill.id);
    setEditName(skill.name);
    setEditContent(skill.content || '');
    setIsNew(false);
    setDeleteConfirm(false);
  };

  const handleNew = () => {
    setSelectedId(null);
    setEditName('');
    setEditContent('');
    setIsNew(true);
    setDeleteConfirm(false);
  };

  const handleSave = async () => {
    if (!editName.trim()) return;
    if (isNew) {
      const created = await create.mutateAsync({ name: editName, content: editContent });
      setSelectedId(created.id);
      setIsNew(false);
    } else if (selectedId) {
      await update.mutateAsync({ id: selectedId, data: { name: editName, content: editContent } });
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    await remove.mutateAsync(selectedId);
    setSelectedId(null);
    setEditName('');
    setEditContent('');
    setDeleteConfirm(false);
  };

  return (
    <div className="flex h-full">
      {/* Left sidebar - skill list */}
      <div className="w-[250px] min-w-[250px] border-r border-[#2a2e45] flex flex-col bg-[#111422]">
        <div className="p-4 border-b border-[#2a2e45]">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <span>📝</span> Skills
          </h2>
          <button
            onClick={handleNew}
            className="w-full px-3 py-2 bg-[#6c5ce7] hover:bg-[#5b4bd5] text-white rounded-lg text-sm font-medium transition-colors"
          >
            + New Skill
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {isLoading ? (
            <div className="space-y-2 p-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 bg-[#181c2e] rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            (skills ?? []).map((skill: any) => (
              <button
                key={skill.id}
                onClick={() => handleSelect(skill)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm mb-1 transition-colors ${
                  selectedId === skill.id
                    ? 'bg-[rgba(108,92,231,.14)] text-[#6c5ce7] font-semibold'
                    : 'text-[#7b7f9e] hover:bg-[#181c2e] hover:text-[#e4e6f0]'
                }`}
              >
                {skill.name}
              </button>
            ))
          )}
          {!isLoading && (!skills || skills.length === 0) && !isNew && (
            <div className="text-center py-8 text-[#7b7f9e] text-sm">
              No skills yet
            </div>
          )}
        </div>
      </div>

      {/* Right panel - editor + preview */}
      <div className="flex-1 flex flex-col">
        {(selectedId || isNew) ? (
          <>
            {/* Skill name */}
            <div className="p-4 border-b border-[#2a2e45] flex items-center gap-3">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Skill name..."
                className="flex-1 bg-[#0a0c14] border border-[#2a2e45] rounded-lg px-3 py-2 text-sm text-[#e4e6f0] outline-none focus:border-[#6c5ce7] transition-colors"
              />
              <div className="flex gap-2">
                {!isNew && (
                  deleteConfirm ? (
                    <>
                      <button
                        onClick={handleDelete}
                        className="px-3 py-2 bg-[#e17055] hover:bg-[#d63031] text-white rounded-lg text-xs font-medium transition-colors"
                      >
                        Confirm Delete
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(false)}
                        className="px-3 py-2 bg-[#2a2e45] hover:bg-[#3a3e55] text-[#e4e6f0] rounded-lg text-xs font-medium transition-colors"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(true)}
                      className="px-3 py-2 bg-[#2a2e45] hover:bg-[#e17055] text-[#e4e6f0] rounded-lg text-xs font-medium transition-colors"
                    >
                      🗑️ Delete
                    </button>
                  )
                )}
                <button
                  onClick={handleSave}
                  disabled={!editName.trim() || create.isPending || update.isPending}
                  className="px-4 py-2 bg-[#6c5ce7] hover:bg-[#5b4bd5] disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  {create.isPending || update.isPending ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>

            {/* Editor + Preview split */}
            <div className="flex-1 flex overflow-hidden">
              {/* Editor */}
              <div className="flex-1 flex flex-col border-r border-[#2a2e45]">
                <div className="px-4 py-2 text-[10px] text-[#7b7f9e] uppercase tracking-wider font-semibold border-b border-[#2a2e45]">
                  Editor (Markdown)
                </div>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  placeholder="Write skill content in Markdown..."
                  className="flex-1 bg-[#0a0c14] p-4 text-sm text-[#e4e6f0] outline-none resize-none font-mono leading-relaxed"
                />
              </div>

              {/* Preview */}
              <div className="flex-1 flex flex-col">
                <div className="px-4 py-2 text-[10px] text-[#7b7f9e] uppercase tracking-wider font-semibold border-b border-[#2a2e45]">
                  Preview
                </div>
                <div className="flex-1 overflow-y-auto p-4 prose prose-invert prose-sm max-w-none">
                  <Markdown remarkPlugins={[remarkGfm]}>
                    {editContent || '*No content yet*'}
                  </Markdown>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-[#7b7f9e]">
            <div className="text-center">
              <div className="text-5xl mb-4">📝</div>
              <p className="text-lg font-medium mb-2">Select a skill or create a new one</p>
              <p className="text-sm">Skills are Markdown documents that define agent capabilities</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
