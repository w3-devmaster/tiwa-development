const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:6769';

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

// Agents
export const getAgents = (status?: string) =>
  fetchApi<any[]>(`/api/agents${status ? `?status=${status}` : ''}`);
export const getAgent = (id: string) => fetchApi<any>(`/api/agents/${id}`);
export const createAgent = (data: any) =>
  fetchApi<any>('/api/agents', { method: 'POST', body: JSON.stringify(data) });
export const updateAgent = (id: string, data: any) =>
  fetchApi<any>(`/api/agents/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteAgent = (id: string) =>
  fetchApi<any>(`/api/agents/${id}`, { method: 'DELETE' });
export const getAgentStats = () =>
  fetchApi<{ activeAgents: number; totalTasks: number; completedToday: number; errors: number }>(
    '/api/agents/stats',
  );
export const setAgentSkills = (agentId: string, skillIds: string[]) =>
  fetchApi<any>(`/api/agents/${agentId}/skills`, { method: 'PUT', body: JSON.stringify({ skillIds }) });

// Skills
export const getSkills = () => fetchApi<any[]>('/api/skills');
export const getSkill = (id: string) => fetchApi<any>(`/api/skills/${id}`);
export const createSkill = (data: any) =>
  fetchApi<any>('/api/skills', { method: 'POST', body: JSON.stringify(data) });
export const updateSkill = (id: string, data: any) =>
  fetchApi<any>(`/api/skills/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteSkill = (id: string) =>
  fetchApi<any>(`/api/skills/${id}`, { method: 'DELETE' });

// Departments
export const getDepartments = () => fetchApi<any[]>('/api/departments');
export const getDepartment = (id: string) => fetchApi<any>(`/api/departments/${id}`);
export const createDepartment = (data: any) =>
  fetchApi<any>('/api/departments', { method: 'POST', body: JSON.stringify(data) });
export const updateDepartment = (id: string, data: any) =>
  fetchApi<any>(`/api/departments/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteDepartment = (id: string) =>
  fetchApi<any>(`/api/departments/${id}`, { method: 'DELETE' });

// Test Agent
export const testAgentChat = (data: {
  provider: string;
  model: string;
  systemPrompt: string;
  testMessage?: string;
}) =>
  fetchApi<{ success: boolean; response?: string; error?: string; model?: string; provider?: string; usage?: any }>(
    '/api/orchestrator/test-agent',
    { method: 'POST', body: JSON.stringify(data) },
  );

// Tasks
export const getTasks = (filters?: Record<string, string>) => {
  const params = filters ? '?' + new URLSearchParams(filters).toString() : '';
  return fetchApi<any[]>(`/api/tasks${params}`);
};
export const getTaskBoard = () =>
  fetchApi<{ todo: any[]; in_progress: any[]; review: any[]; done: any[] }>('/api/tasks/board');
export const createTask = (data: any) =>
  fetchApi<any>('/api/tasks', { method: 'POST', body: JSON.stringify(data) });
export const updateTask = (id: string, data: any) =>
  fetchApi<any>(`/api/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteTask = (id: string) =>
  fetchApi<any>(`/api/tasks/${id}`, { method: 'DELETE' });

// Projects
export const getProjects = () => fetchApi<any[]>('/api/projects');
export const createProject = (data: any) =>
  fetchApi<any>('/api/projects', { method: 'POST', body: JSON.stringify(data) });
export const updateProject = (id: string, data: any) =>
  fetchApi<any>(`/api/projects/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteProject = (id: string) =>
  fetchApi<any>(`/api/projects/${id}`, { method: 'DELETE' });

// Workflows
export const getWorkflows = () => fetchApi<any[]>('/api/workflows');

// Commands
export const getCommands = (projectId?: string) =>
  fetchApi<any[]>(`/api/commands${projectId ? `?projectId=${projectId}` : ''}`);
export const getCommand = (id: string) => fetchApi<any>(`/api/commands/${id}`);
export const createCommand = (data: { projectId: string; instruction: string }) =>
  fetchApi<any>('/api/commands', { method: 'POST', body: JSON.stringify(data) });
export const analyzeCommand = (id: string) =>
  fetchApi<any>(`/api/commands/${id}/analyze`, { method: 'POST' });
export const approveCommand = (id: string) =>
  fetchApi<any>(`/api/commands/${id}/approve`, { method: 'POST' });
export const updateCommand = (id: string, data: any) =>
  fetchApi<any>(`/api/commands/${id}`, { method: 'PATCH', body: JSON.stringify(data) });

// Logs
export const getLogs = (dept?: string, limit?: number) => {
  const params = new URLSearchParams();
  if (dept) params.set('department', dept);
  if (limit) params.set('limit', limit.toString());
  const qs = params.toString();
  return fetchApi<any[]>(`/api/logs${qs ? '?' + qs : ''}`);
};

// Chat
export const getChatMessages = (roomId: string) =>
  fetchApi<any[]>(`/api/logs/chat/${roomId}`);

// Workers
export const getWorkers = () => fetchApi<any[]>('/api/workers');

// Orchestrator
export const submitTask = (data: {
  title: string;
  description?: string;
  type?: string;
  priority?: string;
  projectId?: string;
}) =>
  fetchApi<any>('/api/orchestrator/submit', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const executeTask = (taskId: string) =>
  fetchApi<any>(`/api/orchestrator/execute/${taskId}`, { method: 'POST' });

export const getOrchestratorStatus = () =>
  fetchApi<{
    agents: { total: number; idle: number; working: number };
    tasks: { pending: number; queued: number; inProgress: number };
    providers: string[];
  }>('/api/orchestrator/status');

// Task detail
export const getTask = (id: string) => fetchApi<any>(`/api/tasks/${id}`);

// Settings
export const getSettings = () => fetchApi<any>('/api/settings');

export const setProviderKey = (provider: string, apiKey: string) =>
  fetchApi<any>(`/api/settings/providers/${provider}/key`, {
    method: 'PUT',
    body: JSON.stringify({ apiKey }),
  });

export const setGeminiServiceAccount = (serviceAccount: Record<string, unknown>) =>
  fetchApi<any>('/api/settings/providers/gemini/service-account', {
    method: 'PUT',
    body: JSON.stringify({ serviceAccount }),
  });

export const setGeminiOAuthCredentials = (clientId: string, clientSecret: string) =>
  fetchApi<any>('/api/settings/providers/gemini/oauth-credentials', {
    method: 'PUT',
    body: JSON.stringify({ clientId, clientSecret }),
  });

export const setSettingsDefaults = (data: { model?: string; maxTokens?: number }) =>
  fetchApi<any>('/api/settings/defaults', {
    method: 'PUT',
    body: JSON.stringify(data),
  });

export const removeProvider = (provider: string) =>
  fetchApi<any>(`/api/settings/providers/${provider}`, { method: 'DELETE' });

export const clearAllSettings = () =>
  fetchApi<any>('/api/settings', { method: 'DELETE' });

export const testProvider = (provider: string) =>
  fetchApi<{ provider: string; connected: boolean }>(`/api/settings/providers/${provider}/status`);

export const getGoogleAuthUrl = (redirectUri: string) =>
  fetchApi<{ url: string }>(`/api/settings/google/auth-url?redirectUri=${encodeURIComponent(redirectUri)}`);

export const handleGoogleCallback = (code: string, redirectUri: string) =>
  fetchApi<{ success: boolean }>(
    `/api/settings/google/callback?code=${encodeURIComponent(code)}&redirectUri=${encodeURIComponent(redirectUri)}`,
  );
