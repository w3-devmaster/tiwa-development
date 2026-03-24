import type { Project } from '@tiwa/shared';
import { loadConfig } from './config.js';

async function apiRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const config = await loadConfig();
  const url = `${config.orchestrator.url}${path}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    signal: AbortSignal.timeout(config.orchestrator.timeout),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`API error ${res.status}: ${body || res.statusText}`);
  }

  return res.json() as Promise<T>;
}

export async function listProjects(): Promise<Project[]> {
  return apiRequest<Project[]>('/api/projects');
}

export async function createProject(name: string, description?: string): Promise<Project> {
  return apiRequest<Project>('/api/projects', {
    method: 'POST',
    body: JSON.stringify({ name, description }),
  });
}

export async function cloneProject(repoUrl: string): Promise<Project> {
  return apiRequest<Project>('/api/projects/clone', {
    method: 'POST',
    body: JSON.stringify({ repoUrl }),
  });
}
