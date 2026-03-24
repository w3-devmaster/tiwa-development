'use client';

const steps = [
  { label: '📝 Requirement', status: 'done' },
  { label: '🧠 Planning', status: 'done' },
  { label: '💻 Development', status: 'now' },
  { label: '🧪 Testing', status: 'wait' },
  { label: '🔍 Review', status: 'wait' },
  { label: '🚀 Deploy', status: 'wait' },
];

const stepStyles: Record<string, string> = {
  done: 'border-[#6c5ce7] bg-[rgba(108,92,231,.08)] text-[#6c5ce7]',
  now: 'border-[#00b894] bg-[rgba(0,184,148,.1)] text-[#00b894] shadow-[0_0_12px_rgba(0,184,148,.2)]',
  wait: 'border-[#2a2e45] text-[#7b7f9e]',
};

export default function WorkflowPipeline() {
  return (
    <div className="mb-5 bg-[#181c2e] border border-[#2a2e45] rounded-[14px] px-5 py-3.5">
      <div className="text-[13px] font-semibold mb-2.5 flex items-center gap-2">⚡ Current Pipeline</div>
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {steps.map((step, i) => (
          <div key={step.label} className="flex items-center gap-1.5">
            <div className={`px-3.5 py-[7px] rounded-lg text-[11px] font-medium whitespace-nowrap border text-center min-w-[90px] ${stepStyles[step.status]}`}>
              {step.label}
            </div>
            {i < steps.length - 1 && <span className="text-[#555878] text-sm">→</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
