export enum TaskStatus {
  PENDING = 'pending',
  QUEUED = 'queued',
  IN_PROGRESS = 'in_progress',
  REVIEW = 'review',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum TaskType {
  CODE = 'code',
  TEST = 'test',
  REVIEW = 'review',
  DEPLOY = 'deploy',
  PLAN = 'plan',
  FIX = 'fix',
}

export interface Task {
  id: string;
  projectId: string;
  workflowId?: string;
  title: string;
  description?: string;
  type: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  assignedAgentId?: string;
  parentTaskId?: string;
  branch?: string;
  retryCount: number;
  maxRetries: number;
  result?: Record<string, unknown>;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
