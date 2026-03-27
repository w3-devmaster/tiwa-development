'use client';
import { useState } from 'react';
import { useProjects, useProjectMutations } from '@/hooks/useProjects';

interface ProjectForm {
  name: string;
  description: string;
  gitRepo: string;
  productionBranch: string;
  developmentBranch: string;
  workspacePath: string;
}

const emptyForm: ProjectForm = {
  name: '',
  description: '',
  gitRepo: '',
  productionBranch: '',
  developmentBranch: '',
  workspacePath: '',
};

function formToApi(form: ProjectForm) {
  return {
    name: form.name,
    description: form.description || undefined,
    workspacePath: form.workspacePath || undefined,
    gitRepoJson: {
      url: form.gitRepo,
      productionBranch: form.productionBranch || 'main',
      developmentBranch: form.developmentBranch || 'develop',
    },
  };
}

function projectToForm(project: any): ProjectForm {
  const git = project.gitRepoJson || {};
  return {
    name: project.name || '',
    description: project.description || '',
    gitRepo: git.url || '',
    productionBranch: git.productionBranch || '',
    developmentBranch: git.developmentBranch || '',
    workspacePath: project.workspacePath || '',
  };
}

const STATUS_COLORS: Record<string, string> = {
  active: '#00b894',
  paused: '#fdcb6e',
  archived: '#636e72',
};

export default function ProjectsPage() {
  const { data: projects, isLoading } = useProjects();
  const { create, update, remove } = useProjectMutations();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProjectForm>(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (project: any) => {
    setForm(projectToForm(project));
    setEditingId(project.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    const data = formToApi(form);
    if (editingId) {
      await update.mutateAsync({ id: editingId, data });
    } else {
      await create.mutateAsync(data);
    }
    setShowForm(false);
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    try {
      await remove.mutateAsync(id);
      setDeleteConfirm(null);
    } catch (e: any) {
      alert(e.message || 'Cannot delete project');
      setDeleteConfirm(null);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <span>📁</span> Projects
        </h1>
        <button
          onClick={openCreate}
          className="px-4 py-2 bg-[#6c5ce7] hover:bg-[#5b4bd5] text-white rounded-lg font-medium transition-colors text-sm"
        >
          + New Project
        </button>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-[#181c2e] border border-[#2a2e45] rounded-2xl p-6 animate-pulse h-56" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects?.map((project: any) => {
            const git = project.gitRepoJson || {};
            const statusColor = STATUS_COLORS[project.status] || STATUS_COLORS.active;
            return (
              <div
                key={project.id}
                className="bg-[#181c2e] border border-[#2a2e45] rounded-2xl p-6 hover:border-[#3a3e55] transition-colors group relative"
              >
                {/* Status stripe */}
                <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl" style={{ backgroundColor: statusColor }} />

                {/* Actions */}
                <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEdit(project)}
                    className="w-7 h-7 rounded-lg bg-[#2a2e45] hover:bg-[#3a3e55] flex items-center justify-center text-xs transition-colors"
                    title="Edit"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(project.id)}
                    className="w-7 h-7 rounded-lg bg-[#2a2e45] hover:bg-[#e17055] flex items-center justify-center text-xs transition-colors"
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>

                {/* Name & Status */}
                <div className="flex items-center gap-2 mb-1 mt-1">
                  <h3 className="text-lg font-bold text-[#e4e6f0]">{project.name}</h3>
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded-md font-medium uppercase"
                    style={{ backgroundColor: statusColor + '22', color: statusColor }}
                  >
                    {project.status}
                  </span>
                </div>

                {/* Description */}
                <p className="text-sm text-[#7b7f9e] mb-3 line-clamp-2">
                  {project.description || 'No description'}
                </p>

                {/* Git Repo */}
                {git.url && (
                  <div className="flex items-center gap-1.5 mb-2 text-xs text-[#7b7f9e]">
                    <span>🔗</span>
                    <span className="truncate">{git.url}</span>
                  </div>
                )}

                {/* Branches */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {git.productionBranch && (
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#00b89422] text-[#00b894] font-medium">
                      prod: {git.productionBranch}
                    </span>
                  )}
                  {git.developmentBranch && (
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#0984e322] text-[#0984e3] font-medium">
                      dev: {git.developmentBranch}
                    </span>
                  )}
                </div>

                {/* Workspace */}
                {project.workspacePath && (
                  <div className="flex items-center gap-1.5 mb-3 text-xs text-[#7b7f9e]">
                    <span>📂</span>
                    <span className="font-mono">./workspace/{project.workspacePath}</span>
                  </div>
                )}

                {/* Counts */}
                <div className="flex items-center gap-2">
                  {project._count && (
                    <>
                      <span className="text-xs px-2 py-1 rounded-lg bg-[#6c5ce722] text-[#a29bfe] font-medium">
                        {project._count.tasks ?? 0} Tasks
                      </span>
                      <span className="text-xs px-2 py-1 rounded-lg bg-[#0984e322] text-[#0984e3] font-medium">
                        {project._count.workflows ?? 0} Workflows
                      </span>
                    </>
                  )}
                </div>

                {/* Delete confirmation */}
                {deleteConfirm === project.id && (
                  <div className="absolute inset-0 bg-[#181c2eee] rounded-2xl flex flex-col items-center justify-center gap-3 p-4">
                    <p className="text-sm text-center text-[#e4e6f0]">Delete <strong>{project.name}</strong>?</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDelete(project.id)}
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
          {(!projects || projects.length === 0) && (
            <div className="col-span-3 text-center py-16 text-[#7b7f9e]">
              <div className="text-5xl mb-4">📁</div>
              <p className="text-lg font-medium mb-2">No projects yet</p>
              <p className="text-sm mb-4">Create a project to organize your tasks and workflows</p>
              <button
                onClick={openCreate}
                className="px-4 py-2 bg-[#6c5ce7] hover:bg-[#5b4bd5] text-white rounded-lg font-medium transition-colors text-sm"
              >
                + Create First Project
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowForm(false)}>
          <div className="bg-[#181c2e] border border-[#2a2e45] rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-5">
              {editingId ? 'Edit Project' : 'New Project'}
            </h2>

            {/* Name */}
            <label className="block text-xs text-[#7b7f9e] mb-1.5 font-medium">Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. My App"
              className="w-full bg-[#0a0c14] border border-[#2a2e45] rounded-lg px-3 py-2 text-sm text-[#e4e6f0] mb-4 outline-none focus:border-[#6c5ce7] transition-colors"
            />

            {/* Description */}
            <label className="block text-xs text-[#7b7f9e] mb-1.5 font-medium">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="What is this project about?"
              rows={2}
              className="w-full bg-[#0a0c14] border border-[#2a2e45] rounded-lg px-3 py-2 text-sm text-[#e4e6f0] mb-4 outline-none focus:border-[#6c5ce7] transition-colors resize-none"
            />

            {/* Git Repo */}
            <label className="block text-xs text-[#7b7f9e] mb-1.5 font-medium">Git Repository</label>
            <input
              type="text"
              value={form.gitRepo}
              onChange={(e) => setForm({ ...form, gitRepo: e.target.value })}
              placeholder="https://github.com/user/repo.git"
              className="w-full bg-[#0a0c14] border border-[#2a2e45] rounded-lg px-3 py-2 text-sm text-[#e4e6f0] mb-4 outline-none focus:border-[#6c5ce7] transition-colors"
            />

            {/* Branches */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-xs text-[#7b7f9e] mb-1.5 font-medium">Production Branch</label>
                <input
                  type="text"
                  value={form.productionBranch}
                  onChange={(e) => setForm({ ...form, productionBranch: e.target.value })}
                  placeholder="main"
                  className="w-full bg-[#0a0c14] border border-[#2a2e45] rounded-lg px-3 py-2 text-sm text-[#e4e6f0] outline-none focus:border-[#6c5ce7] transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs text-[#7b7f9e] mb-1.5 font-medium">Development Branch</label>
                <input
                  type="text"
                  value={form.developmentBranch}
                  onChange={(e) => setForm({ ...form, developmentBranch: e.target.value })}
                  placeholder="develop"
                  className="w-full bg-[#0a0c14] border border-[#2a2e45] rounded-lg px-3 py-2 text-sm text-[#e4e6f0] outline-none focus:border-[#6c5ce7] transition-colors"
                />
              </div>
            </div>

            {/* Workspace Dir */}
            <label className="block text-xs text-[#7b7f9e] mb-1.5 font-medium">Workspace Directory</label>
            <div className="flex items-center gap-0 mb-6">
              <span className="bg-[#0a0c14] border border-r-0 border-[#2a2e45] rounded-l-lg px-3 py-2 text-sm text-[#7b7f9e] font-mono">./workspace/</span>
              <input
                type="text"
                value={form.workspacePath}
                onChange={(e) => setForm({ ...form, workspacePath: e.target.value })}
                placeholder="e.g. jingseng"
                className="flex-1 bg-[#0a0c14] border border-[#2a2e45] rounded-r-lg px-3 py-2 text-sm text-[#e4e6f0] outline-none focus:border-[#6c5ce7] transition-colors"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setShowForm(false); setEditingId(null); }}
                className="px-4 py-2 bg-[#2a2e45] hover:bg-[#3a3e55] text-[#e4e6f0] rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!form.name.trim() || create.isPending || update.isPending}
                className="px-4 py-2 bg-[#6c5ce7] hover:bg-[#5b4bd5] disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
              >
                {create.isPending || update.isPending ? 'Saving...' : editingId ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
