export enum WorkflowStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export interface WorkflowStep {
  id: string;
  name: string;
  taskType: string;
  agentRole: string;
  dependsOn: string[];
  config?: Record<string, unknown>;
}

export interface Workflow {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  status: WorkflowStatus;
  steps: WorkflowStep[];
  currentStepIndex: number;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
