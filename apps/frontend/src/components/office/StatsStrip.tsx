'use client';

const stats = [
  { label: 'Active Agents', value: '6', color: 'text-[#00b894]', note: '↑ 2 from yesterday', noteColor: 'text-[#00b894]' },
  { label: 'Tasks In Progress', value: '12', color: 'text-[#74b9ff]', note: '3 pending review', noteColor: 'text-[#00b894]' },
  { label: 'Completed Today', value: '28', color: 'text-[#6c5ce7]', note: '↑ 15% vs avg', noteColor: 'text-[#00b894]' },
  { label: 'Errors', value: '2', color: 'text-[#e17055]', note: '↑ 1 new', noteColor: 'text-[#e17055]' },
];

export default function StatsStrip() {
  return (
    <div className="flex gap-3 mb-5">
      {stats.map((s) => (
        <div key={s.label} className="flex-1 bg-[#181c2e] border border-[#2a2e45] rounded-[14px] px-4 py-3 transition-all duration-300 hover:border-[#6c5ce7] hover:-translate-y-0.5">
          <div className="text-[10px] text-[#7b7f9e] uppercase tracking-[1px] mb-1">{s.label}</div>
          <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
          <div className={`text-[10px] mt-0.5 ${s.noteColor}`}>{s.note}</div>
        </div>
      ))}
    </div>
  );
}
