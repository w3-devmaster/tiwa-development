'use client';
import { useState } from 'react';
import { useDepartments, useDepartmentMutations } from '@/hooks/useDepartments';
import { useAgents } from '@/hooks/useAgents';

const PRESET_ICONS = ['📐', '🏗️', '💻', '🧪', '🔍', '🚀', '📦', '🎨', '🛡️', '📊', '🔧', '⚡', '🧠', '🎯', '📝', '🗂️'];
const PRESET_COLORS = ['#6c5ce7', '#a29bfe', '#0984e3', '#00b894', '#e17055', '#636e72', '#fdcb6e', '#fd79a8', '#00cec9', '#d63031', '#e84393', '#2d3436'];

interface DeptForm {
  name: string;
  description: string;
  icon: string;
  color: string;
}

const emptyForm: DeptForm = { name: '', description: '', icon: '📦', color: '#6c5ce7' };

export default function DepartmentsPage() {
  const { data: departments, isLoading } = useDepartments();
  const { data: agents } = useAgents();
  const { create, update, remove } = useDepartmentMutations();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<DeptForm>(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const agentCountByDept = (deptName: string) => {
    if (!agents) return 0;
    return agents.filter((a: any) => a.department === deptName || a.department === deptName.toLowerCase()).length;
  };

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (dept: any) => {
    setForm({ name: dept.name, description: dept.description || '', icon: dept.icon || '📦', color: dept.color || '#6c5ce7' });
    setEditingId(dept.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    if (editingId) {
      await update.mutateAsync({ id: editingId, data: form });
    } else {
      await create.mutateAsync(form);
    }
    setShowForm(false);
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    try {
      await remove.mutateAsync(id);
      setDeleteConfirm(null);
    } catch (e: any) {
      alert(e.message || 'Cannot delete department');
      setDeleteConfirm(null);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <span>🏛️</span> Departments
        </h1>
        <button
          onClick={openCreate}
          className="px-4 py-2 bg-[#6c5ce7] hover:bg-[#5b4bd5] text-white rounded-lg font-medium transition-colors text-sm"
        >
          + Add Department
        </button>
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
          {departments?.map((dept: any) => (
            <div
              key={dept.id}
              className="bg-[#181c2e] border border-[#2a2e45] rounded-2xl p-6 hover:border-[#3a3e55] transition-colors group relative"
            >
              {/* Color stripe top */}
              <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl" style={{ backgroundColor: dept.color }} />

              {/* Actions */}
              <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => openEdit(dept)}
                  className="w-7 h-7 rounded-lg bg-[#2a2e45] hover:bg-[#3a3e55] flex items-center justify-center text-xs transition-colors"
                  title="Edit"
                >
                  ✏️
                </button>
                <button
                  onClick={() => setDeleteConfirm(dept.id)}
                  className="w-7 h-7 rounded-lg bg-[#2a2e45] hover:bg-[#e17055] flex items-center justify-center text-xs transition-colors"
                  title="Delete"
                >
                  🗑️
                </button>
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

              {/* Delete confirmation */}
              {deleteConfirm === dept.id && (
                <div className="absolute inset-0 bg-[#181c2eee] rounded-2xl flex flex-col items-center justify-center gap-3 p-4">
                  <p className="text-sm text-center text-[#e4e6f0]">Delete <strong>{dept.name}</strong>?</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDelete(dept.id)}
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
          ))}

          {/* Empty state */}
          {(!departments || departments.length === 0) && (
            <div className="col-span-3 text-center py-16 text-[#7b7f9e]">
              <div className="text-5xl mb-4">🏛️</div>
              <p className="text-lg font-medium mb-2">No departments yet</p>
              <p className="text-sm mb-4">Create departments to organize your AI agents</p>
              <button
                onClick={openCreate}
                className="px-4 py-2 bg-[#6c5ce7] hover:bg-[#5b4bd5] text-white rounded-lg font-medium transition-colors text-sm"
              >
                + Create First Department
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowForm(false)}>
          <div className="bg-[#181c2e] border border-[#2a2e45] rounded-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-5">
              {editingId ? 'Edit Department' : 'New Department'}
            </h2>

            {/* Name */}
            <label className="block text-xs text-[#7b7f9e] mb-1.5 font-medium">Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Developer, Tester..."
              className="w-full bg-[#0a0c14] border border-[#2a2e45] rounded-lg px-3 py-2 text-sm text-[#e4e6f0] mb-4 outline-none focus:border-[#6c5ce7] transition-colors"
            />

            {/* Description */}
            <label className="block text-xs text-[#7b7f9e] mb-1.5 font-medium">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="What does this department do?"
              rows={2}
              className="w-full bg-[#0a0c14] border border-[#2a2e45] rounded-lg px-3 py-2 text-sm text-[#e4e6f0] mb-4 outline-none focus:border-[#6c5ce7] transition-colors resize-none"
            />

            {/* Icon Selector */}
            <label className="block text-xs text-[#7b7f9e] mb-1.5 font-medium">Icon</label>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {PRESET_ICONS.map((icon) => (
                <button
                  key={icon}
                  onClick={() => setForm({ ...form, icon })}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-colors ${
                    form.icon === icon ? 'bg-[#6c5ce7] ring-2 ring-[#a29bfe]' : 'bg-[#0a0c14] hover:bg-[#2a2e45]'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>

            {/* Color Selector */}
            <label className="block text-xs text-[#7b7f9e] mb-1.5 font-medium">Color</label>
            <div className="flex flex-wrap gap-1.5 mb-6">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setForm({ ...form, color })}
                  className={`w-8 h-8 rounded-lg transition-all ${
                    form.color === color ? 'ring-2 ring-white scale-110' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>

            {/* Preview */}
            <div className="bg-[#0a0c14] rounded-lg p-3 mb-5 flex items-center gap-3 border border-[#2a2e45]">
              <div className="text-2xl">{form.icon}</div>
              <div>
                <div className="font-semibold text-sm" style={{ color: form.color }}>{form.name || 'Department Name'}</div>
                <div className="text-xs text-[#7b7f9e]">{form.description || 'Description'}</div>
              </div>
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
