export enum ProjectStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  ARCHIVED = 'archived',
}

export interface GitHubRepo {
  owner: string;
  name: string;
  fullName: string;
  url: string;
  defaultBranch: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  githubRepo?: GitHubRepo;
  workspacePath: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}
