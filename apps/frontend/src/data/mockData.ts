export interface AgentData {
  id: string;
  name: string;
  role: string;
  department: 'planner' | 'architect' | 'builder' | 'tester' | 'reviewer' | 'devops';
  status: 'working' | 'thinking' | 'idle' | 'error';
  task: string;
  colorTheme: string;
  hairStyle: string;
  hairColor: string;
  screenType: 'coding' | 'testing' | 'designing' | 'infra' | 'idle' | 'error';
  mouth: 'happy' | 'think' | 'sad' | 'neutral';
  model: string;
  stats: { tasks: number; success: number; avgTime: string; tokPerMin: string };
  avatar: { bg: string; letter: string };
}

export interface TaskData {
  id: string;
  title: string;
  tag: 'Planner' | 'Architect' | 'Builder' | 'Tester' | 'Reviewer' | 'DevOps';
  tagClass: 'pl' | 'ar' | 'bu' | 'te' | 'rv' | 'dv';
  assignee: string;
  department?: string;
  status: 'todo' | 'in_progress' | 'review' | 'done';
}

export interface LogEntry {
  agent: string;
  dept: 'pl' | 'ar' | 'bu' | 'te' | 'rv' | 'dv';
  message: string;
  highlight: string;
}

export const agents: AgentData[] = [
  { id: 'siam', name: 'Siam', role: 'Product Planner', department: 'planner', status: 'working', task: 'Breaking down requirements', colorTheme: 't-purple', hairStyle: 'hair-short', hairColor: 'hair-dark', screenType: 'coding', mouth: 'happy', model: 'claude-sonnet-4.6', stats: { tasks: 24, success: 98, avgTime: '2.3m', tokPerMin: '1.2K' }, avatar: { bg: 'linear-gradient(135deg,#6c5ce7,#a29bfe)', letter: 'S' } },
  { id: 'nara', name: 'Nara', role: 'System Architect', department: 'architect', status: 'thinking', task: 'Designing schema...', colorTheme: 't-blue', hairStyle: 'hair-long', hairColor: 'hair-brown', screenType: 'coding', mouth: 'think', model: 'claude-opus-4.6', stats: { tasks: 18, success: 95, avgTime: '4.1m', tokPerMin: '890' }, avatar: { bg: 'linear-gradient(135deg,#a29bfe,#6c5ce7)', letter: 'N' } },
  { id: 'karn', name: 'Karn', role: 'Backend Builder', department: 'builder', status: 'working', task: 'Implementing API endpoint', colorTheme: 't-orange', hairStyle: 'hair-spiky', hairColor: '', screenType: 'coding', mouth: 'happy', model: 'claude-sonnet-4.6', stats: { tasks: 20, success: 96, avgTime: '3.0m', tokPerMin: '1.1K' }, avatar: { bg: 'linear-gradient(135deg,#fdcb6e,#e17055)', letter: 'K' } },
  { id: 'ploy', name: 'Ploy', role: 'Frontend Builder', department: 'builder', status: 'working', task: 'Building dashboard UI', colorTheme: 't-pink', hairStyle: 'hair-bun', hairColor: 'hair-purple', screenType: 'designing', mouth: 'happy', model: 'claude-sonnet-4.6', stats: { tasks: 15, success: 97, avgTime: '2.8m', tokPerMin: '950' }, avatar: { bg: 'linear-gradient(135deg,#fd79a8,#e84393)', letter: 'P' } },
  { id: 'tawan', name: 'Tawan', role: 'QA Engineer', department: 'tester', status: 'working', task: 'Running unit tests', colorTheme: 't-green', hairStyle: 'hair-short', hairColor: 'hair-green', screenType: 'testing', mouth: 'happy', model: 'claude-haiku-4.5', stats: { tasks: 30, success: 94, avgTime: '1.5m', tokPerMin: '2.0K' }, avatar: { bg: 'linear-gradient(135deg,#00b894,#00cec9)', letter: 'T' } },
  { id: 'mali', name: 'Mali', role: 'Code Reviewer', department: 'reviewer', status: 'working', task: 'Reviewing pull request', colorTheme: 't-red', hairStyle: 'hair-long', hairColor: '', screenType: 'coding', mouth: 'think', model: 'claude-opus-4.6', stats: { tasks: 22, success: 91, avgTime: '3.5m', tokPerMin: '780' }, avatar: { bg: 'linear-gradient(135deg,#e17055,#d63031)', letter: 'M' } },
  { id: 'dao', name: 'Dao', role: 'DevOps Engineer', department: 'devops', status: 'idle', task: 'Awaiting deploy', colorTheme: 't-gray', hairStyle: 'hair-short', hairColor: 'hair-gray', screenType: 'idle', mouth: 'neutral', model: 'claude-sonnet-4.6', stats: { tasks: 16, success: 99, avgTime: '2.0m', tokPerMin: '1.3K' }, avatar: { bg: 'linear-gradient(135deg,#636e72,#2d3436)', letter: 'D' } },
  { id: 'rin', name: 'Rin', role: 'Infra Specialist', department: 'devops', status: 'working', task: 'Docker multi-stage build', colorTheme: 't-teal', hairStyle: 'hair-spiky', hairColor: 'hair-teal', screenType: 'infra', mouth: 'happy', model: 'claude-opus-4.6', stats: { tasks: 12, success: 100, avgTime: '4.5m', tokPerMin: '650' }, avatar: { bg: 'linear-gradient(135deg,#00cec9,#0984e3)', letter: 'R' } },
];

export const rooms = [
  { id: 'planner', name: 'Planner', dept: 'Planning / Requirements', icon: '📐', iconClass: 'pl', agents: ['siam'], footer: { done: 8, active: 1, queue: 2 }, progress: 68 },
  { id: 'architect', name: 'Architect', dept: 'Schema / Design', icon: '🏗️', iconClass: 'ar', agents: ['nara'], footer: { done: 6, active: 1, queue: 1 }, progress: 54 },
  { id: 'builder', name: 'Builder', dept: 'Implementation / Code', icon: '💻', iconClass: 'bu', agents: ['karn', 'ploy'], footer: { done: 10, active: 4, queue: 3 }, progress: 60 },
  { id: 'tester', name: 'Tester', dept: 'Testing / QA', icon: '🧪', iconClass: 'te', agents: ['tawan'], footer: { pass: 12, fail: 2, pending: 4 }, progress: 82 },
  { id: 'reviewer', name: 'Reviewer', dept: 'Code Review', icon: '🔍', iconClass: 'rv', agents: ['mali'], footer: { done: 5, active: 1, queue: 2 }, progress: 70 },
  { id: 'devops', name: 'DevOps', dept: 'CI/CD / Deploy', icon: '🚀', iconClass: 'dv', agents: ['dao', 'rin'], footer: { pipeline: 'OK', containers: 3, deploy: 2 }, progress: 100 },
];

export const tasks: TaskData[] = [
  { id: '1', title: 'Break down user management feature', tag: 'Planner', tagClass: 'pl', assignee: 'S', status: 'todo' },
  { id: '2', title: 'Design user schema & API contract', tag: 'Architect', tagClass: 'ar', assignee: 'N', status: 'todo' },
  { id: '3', title: 'Implement POST /api/users endpoint', tag: 'Builder', tagClass: 'bu', assignee: 'K', status: 'in_progress' },
  { id: '4', title: 'Build dashboard layout', tag: 'Builder', tagClass: 'bu', assignee: 'P', status: 'in_progress' },
  { id: '5', title: 'E2E tests for auth flow', tag: 'Tester', tagClass: 'te', assignee: 'T', status: 'in_progress' },
  { id: '6', title: 'Review auth middleware PR', tag: 'Reviewer', tagClass: 'rv', assignee: 'M', status: 'review' },
  { id: '7', title: 'Docker multi-stage build', tag: 'DevOps', tagClass: 'dv', assignee: 'R', status: 'in_progress' },
  { id: '8', title: 'Project scaffolding', tag: 'DevOps', tagClass: 'dv', assignee: 'D', status: 'done' },
  { id: '9', title: 'PostgreSQL + Prisma setup', tag: 'Builder', tagClass: 'bu', assignee: 'K', status: 'done' },
  { id: '10', title: 'CI GitHub Actions', tag: 'DevOps', tagClass: 'dv', assignee: 'R', status: 'done' },
];

export const logEntries: LogEntry[] = [
  { agent: 'Siam', dept: 'pl', message: 'Breaking down user management requirements', highlight: 'user management' },
  { agent: 'Nara', dept: 'ar', message: 'Designing schema for user_management module', highlight: 'user_management' },
  { agent: 'Karn', dept: 'bu', message: 'Writing POST /api/users endpoint', highlight: 'POST /api/users' },
  { agent: 'Ploy', dept: 'bu', message: 'Building DashboardLayout component', highlight: 'DashboardLayout' },
  { agent: 'Tawan', dept: 'te', message: 'auth.service.test.ts — 12/12 passed', highlight: 'auth.service.test.ts' },
  { agent: 'Mali', dept: 'rv', message: 'Reviewing auth middleware for security issues', highlight: 'auth middleware' },
  { agent: 'Dao', dept: 'dv', message: 'Idle — awaiting deployment trigger', highlight: '' },
  { agent: 'Rin', dept: 'dv', message: 'Building Dockerfile multi-stage', highlight: 'Dockerfile' },
];

export const chatMessages = [
  { sender: 'agent', name: 'Siam', text: 'Analyzed requirements — created 5 tasks with acceptance criteria' },
  { sender: 'user', name: '', text: 'Add rate limiting to the API' },
  { sender: 'agent', name: 'Karn', text: 'Added rate limiter 100 req/min per IP using Redis store' },
  { sender: 'user', name: '', text: 'Great, send PR when done' },
  { sender: 'agent', name: 'Karn', text: 'Will commit + push + create PR automatically after lint passes' },
];
