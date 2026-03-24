export interface AgentData {
  id: string;
  name: string;
  role: string;
  department: 'backend' | 'frontend' | 'qa' | 'devops';
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
  tag: 'Backend' | 'Frontend' | 'QA' | 'DevOps';
  tagClass: 'be' | 'fe' | 'qa' | 'dv';
  assignee: string;
  status: 'todo' | 'in_progress' | 'review' | 'done';
}

export interface LogEntry {
  agent: string;
  dept: 'be' | 'fe' | 'qa' | 'dv';
  message: string;
  highlight: string;
}

export const agents: AgentData[] = [
  { id: 'siam', name: 'Siam', role: 'Backend Engineer', department: 'backend', status: 'working', task: 'POST /api/users endpoint', colorTheme: 't-blue', hairStyle: 'hair-short', hairColor: 'hair-dark', screenType: 'coding', mouth: 'happy', model: 'claude-sonnet-4.6', stats: { tasks: 24, success: 98, avgTime: '2.3m', tokPerMin: '1.2K' }, avatar: { bg: 'linear-gradient(135deg,#74b9ff,#0984e3)', letter: 'S' } },
  { id: 'nara', name: 'Nara', role: 'DB Architect', department: 'backend', status: 'thinking', task: 'Analyzing user schema...', colorTheme: 't-purple', hairStyle: 'hair-long', hairColor: 'hair-brown', screenType: 'coding', mouth: 'think', model: 'claude-opus-4.6', stats: { tasks: 18, success: 95, avgTime: '4.1m', tokPerMin: '890' }, avatar: { bg: 'linear-gradient(135deg,#a29bfe,#6c5ce7)', letter: 'N' } },
  { id: 'karn', name: 'Karn', role: 'Frontend Engineer', department: 'frontend', status: 'working', task: 'Building dashboard UI', colorTheme: 't-orange', hairStyle: 'hair-spiky', hairColor: '', screenType: 'designing', mouth: 'happy', model: 'claude-sonnet-4.6', stats: { tasks: 20, success: 96, avgTime: '3.0m', tokPerMin: '1.1K' }, avatar: { bg: 'linear-gradient(135deg,#fdcb6e,#e17055)', letter: 'K' } },
  { id: 'ploy', name: 'Ploy', role: 'UI/UX Specialist', department: 'frontend', status: 'working', task: 'Styling components', colorTheme: 't-pink', hairStyle: 'hair-bun', hairColor: 'hair-purple', screenType: 'designing', mouth: 'happy', model: 'claude-sonnet-4.6', stats: { tasks: 15, success: 97, avgTime: '2.8m', tokPerMin: '950' }, avatar: { bg: 'linear-gradient(135deg,#fd79a8,#e84393)', letter: 'P' } },
  { id: 'tawan', name: 'Tawan', role: 'QA Engineer', department: 'qa', status: 'working', task: 'Running unit tests', colorTheme: 't-green', hairStyle: 'hair-short', hairColor: 'hair-green', screenType: 'testing', mouth: 'happy', model: 'claude-haiku-4.5', stats: { tasks: 30, success: 94, avgTime: '1.5m', tokPerMin: '2.0K' }, avatar: { bg: 'linear-gradient(135deg,#00b894,#00cec9)', letter: 'T' } },
  { id: 'mali', name: 'Mali', role: 'QA Reviewer', department: 'qa', status: 'error', task: 'Test failure detected', colorTheme: 't-red', hairStyle: 'hair-long', hairColor: '', screenType: 'error', mouth: 'sad', model: 'claude-opus-4.6', stats: { tasks: 22, success: 91, avgTime: '3.5m', tokPerMin: '780' }, avatar: { bg: 'linear-gradient(135deg,#e17055,#d63031)', letter: 'M' } },
  { id: 'dao', name: 'Dao', role: 'DevOps Engineer', department: 'devops', status: 'idle', task: 'Awaiting deploy', colorTheme: 't-gray', hairStyle: 'hair-short', hairColor: 'hair-gray', screenType: 'idle', mouth: 'neutral', model: 'claude-sonnet-4.6', stats: { tasks: 16, success: 99, avgTime: '2.0m', tokPerMin: '1.3K' }, avatar: { bg: 'linear-gradient(135deg,#636e72,#2d3436)', letter: 'D' } },
  { id: 'rin', name: 'Rin', role: 'Infra Specialist', department: 'devops', status: 'working', task: 'Docker multi-stage build', colorTheme: 't-teal', hairStyle: 'hair-spiky', hairColor: 'hair-teal', screenType: 'infra', mouth: 'happy', model: 'claude-opus-4.6', stats: { tasks: 12, success: 100, avgTime: '4.5m', tokPerMin: '650' }, avatar: { bg: 'linear-gradient(135deg,#00cec9,#0984e3)', letter: 'R' } },
];

export const rooms = [
  { id: 'backend', name: 'Backend Engineering', dept: 'API / Database / Services', icon: '⚙️', iconClass: 'be', agents: ['siam', 'nara'], footer: { done: 8, active: 3, queue: 2 }, progress: 68 },
  { id: 'frontend', name: 'Frontend Engineering', dept: 'UI / Components / Pages', icon: '🎨', iconClass: 'fe', agents: ['karn', 'ploy'], footer: { done: 6, active: 4, queue: 3 }, progress: 54 },
  { id: 'qa', name: 'Quality Assurance', dept: 'Testing / Review / Validation', icon: '🧪', iconClass: 'qa', agents: ['tawan', 'mali'], footer: { pass: 12, fail: 2, pending: 4 }, progress: 82 },
  { id: 'devops', name: 'DevOps & Infrastructure', dept: 'CI/CD / Deploy / Docker', icon: '🚀', iconClass: 'dv', agents: ['dao', 'rin'], footer: { pipeline: 'OK', containers: 3, deploy: 2 }, progress: 100 },
];

export const tasks: TaskData[] = [
  { id: '1', title: 'Setup WebSocket real-time', tag: 'Backend', tagClass: 'be', assignee: 'S', status: 'todo' },
  { id: '2', title: 'Design notification UI', tag: 'Frontend', tagClass: 'fe', assignee: 'K', status: 'todo' },
  { id: '3', title: 'E2E tests for auth', tag: 'QA', tagClass: 'qa', assignee: 'T', status: 'todo' },
  { id: '4', title: 'POST /api/users endpoint', tag: 'Backend', tagClass: 'be', assignee: 'S', status: 'in_progress' },
  { id: '5', title: 'Dashboard layout', tag: 'Frontend', tagClass: 'fe', assignee: 'K', status: 'in_progress' },
  { id: '6', title: 'User management schema', tag: 'Backend', tagClass: 'be', assignee: 'N', status: 'in_progress' },
  { id: '7', title: 'Docker multi-stage', tag: 'DevOps', tagClass: 'dv', assignee: 'R', status: 'in_progress' },
  { id: '8', title: 'Auth middleware JWT', tag: 'Backend', tagClass: 'be', assignee: 'S', status: 'review' },
  { id: '9', title: 'Login page validation', tag: 'Frontend', tagClass: 'fe', assignee: 'P', status: 'review' },
  { id: '10', title: 'Project scaffolding', tag: 'DevOps', tagClass: 'dv', assignee: 'D', status: 'done' },
  { id: '11', title: 'PostgreSQL + Prisma', tag: 'Backend', tagClass: 'be', assignee: 'N', status: 'done' },
  { id: '12', title: 'CI GitHub Actions', tag: 'DevOps', tagClass: 'dv', assignee: 'R', status: 'done' },
];

export const logEntries: LogEntry[] = [
  { agent: 'Siam', dept: 'be', message: 'Writing POST /api/users endpoint', highlight: 'POST /api/users' },
  { agent: 'Nara', dept: 'be', message: 'Analyzing relationships for user_management', highlight: 'user_management' },
  { agent: 'Karn', dept: 'fe', message: 'Rendering DashboardLayout component', highlight: 'DashboardLayout' },
  { agent: 'Ploy', dept: 'fe', message: 'Styling UserCard with Tailwind', highlight: 'UserCard' },
  { agent: 'Tawan', dept: 'qa', message: 'auth.service.test.ts — 12/12 passed ✅', highlight: 'auth.service.test.ts' },
  { agent: 'Mali', dept: 'qa', message: '⚠ Failure in payment.service.test.ts', highlight: 'payment.service.test.ts' },
  { agent: 'Dao', dept: 'dv', message: 'Idle — awaiting deployment trigger', highlight: '' },
  { agent: 'Rin', dept: 'dv', message: 'Building Dockerfile multi-stage', highlight: 'Dockerfile' },
  { agent: 'Siam', dept: 'be', message: 'Rate limiter: 100 req/min per IP added', highlight: '100 req/min' },
  { agent: 'Karn', dept: 'fe', message: 'Integrating recharts analytics', highlight: 'recharts' },
  { agent: 'Nara', dept: 'be', message: 'Migration: create_users_table', highlight: 'create_users_table' },
  { agent: 'Tawan', dept: 'qa', message: 'E2E: Login flow screenshot ✅', highlight: 'Login flow' },
  { agent: 'Siam', dept: 'be', message: 'Commit to feature/user-api — 3 files', highlight: 'feature/user-api' },
  { agent: 'Rin', dept: 'dv', message: 'Image: tiwa:0.2.1 — 142MB built', highlight: 'tiwa:0.2.1' },
];

export const chatMessages = [
  { sender: 'agent', name: 'Siam', text: 'เริ่มทำ POST /api/users แล้วครับ กำลังเขียน validation ด้วย Zod' },
  { sender: 'user', name: '', text: 'เพิ่ม rate limiting ด้วยนะ' },
  { sender: 'agent', name: 'Siam', text: 'ได้ครับ จะเพิ่ม rate limiter 100 req/min ต่อ IP ใช้ Redis store ครับ' },
  { sender: 'user', name: '', text: 'ดีเลย ส่ง PR มาเมื่อเสร็จ' },
  { sender: 'agent', name: 'Siam', text: 'รับทราบครับ จะ commit + push + create PR อัตโนมัติเมื่อผ่าน lint ครับ' },
];
