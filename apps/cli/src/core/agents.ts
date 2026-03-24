import type { Agent } from '@tiwa/shared';
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

export async function listAgents(): Promise<Agent[]> {
  return apiRequest<Agent[]>('/api/agents');
}

export async function renameAgent(id: string, name: string): Promise<Agent> {
  return apiRequest<Agent>(`/api/agents/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ name }),
  });
}

export async function getAgentLogs(id: string, lines = 100): Promise<string[]> {
  return apiRequest<string[]>(`/api/agents/${id}/logs?lines=${lines}`);
}
