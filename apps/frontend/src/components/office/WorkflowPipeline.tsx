'use client';
import { useWorkflows } from '@/hooks/useWorkflows';

const stepStyles: Record<string, string> = {
  done: 'border-[#6c5ce7] bg-[rgba(108,92,231,.08)] text-[#6c5ce7]',
  now: 'border-[#00b894] bg-[rgba(0,184,148,.1)] text-[#00b894] shadow-[0_0_12px_rgba(0,184,148,.2)]',
  wait: 'border-[#2a2e45] text-[#7b7f9e]',
  error: 'border-[#e17055] bg-[rgba(225,112,85,.1)] text-[#e17055]',
};

function getStepStatus(
  stepIndex: number,
  currentIndex: number,
  workflowStatus: string,
): string {
  if (workflowStatus === 'completed') return 'done';
  if (workflowStatus === 'failed' && stepIndex === currentIndex) return 'error';
  if (stepIndex < currentIndex) return 'done';
  if (stepIndex === currentIndex) return 'now';
  return 'wait';
}

export default function WorkflowPipeline() {
  const { data: workflows, isLoading } = useWorkflows();

  // Find the latest active workflow, or the most recent one
  const active = workflows?.find(
    (w: any) => w.status === 'running' || w.status === 'pending',
  );
  const workflow = active || workflows?.[0];

  if (isLoading) {
    return (
      <div className="mb-5 bg-[#181c2e] border border-[#2a2e45] rounded-[14px] px-5 py-3.5">
        <div className="text-[13px] font-semibold mb-2.5 flex items-center gap-2">
          ⚡ Current Pipeline
        </div>
        <div className="h-8 bg-[#2a2e45] rounded animate-pulse" />
      </div>
    );
  }

  if (!workflow || !workflow.stepsJson?.length) {
    return (
      <div className="mb-5 bg-[#181c2e] border border-[#2a2e45] rounded-[14px] px-5 py-3.5">
        <div className="text-[13px] font-semibold mb-2.5 flex items-center gap-2">
          ⚡ Current Pipeline
        </div>
        <div className="text-xs text-[#555878] py-1">
          No active pipeline
        </div>
      </div>
    );
  }

  const steps = workflow.stepsJson as { name?: string; label?: string }[];
  const currentIndex = workflow.currentStepIndex ?? 0;

  return (
    <div className="mb-5 bg-[#181c2e] border border-[#2a2e45] rounded-[14px] px-5 py-3.5">
      <div className="text-[13px] font-semibold mb-2.5 flex items-center gap-2">
        ⚡ {workflow.name || 'Current Pipeline'}
      </div>
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {steps.map((step, i) => {
          const status = getStepStatus(i, currentIndex, workflow.status);
          return (
            <div key={i} className="flex items-center gap-1.5">
              <div
                className={`px-3.5 py-[7px] rounded-lg text-[11px] font-medium whitespace-nowrap border text-center min-w-[90px] ${stepStyles[status] || stepStyles.wait}`}
              >
                {step.label || step.name || `Step ${i + 1}`}
              </div>
              {i < steps.length - 1 && (
                <span className="text-[#555878] text-sm">→</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
