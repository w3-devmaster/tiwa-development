export enum AgentRole {
  PLANNER = 'planner',
  BACKEND = 'backend',
  FRONTEND = 'frontend',
  QA = 'qa',
  DEVOPS = 'devops',
  REVIEWER = 'reviewer',
}

export enum AgentStatus {
  IDLE = 'idle',
  WORKING = 'working',
  THINKING = 'thinking',
  ERROR = 'error',
  BLOCKED = 'blocked',
  OFFLINE = 'offline',
}

export interface AgentConfig {
  id: string;
  name: string;
  role: AgentRole;
  model: string;
  promptTemplate?: string;
  tools: string[];
  maxConcurrency: number;
}

export interface Agent {
  id: string;
  name: string;
  role: AgentRole;
  status: AgentStatus;
  config: AgentConfig;
  currentTaskId?: string;
  lastActiveAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
