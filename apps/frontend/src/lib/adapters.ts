import type { AgentData, TaskData, LogEntry } from '@/data/mockData';

// ---------------------------------------------------------------------------
// Agent adapters
// ---------------------------------------------------------------------------

function mapStatus(status: string): 'working' | 'thinking' | 'idle' | 'error' {
  switch (status) {
    case 'working':
    case 'busy':
      return 'working';
    case 'thinking':
      return 'thinking';
    case 'error':
    case 'offline':
      return 'error';
    default:
      return 'idle';
  }
}

/** Map backend agent response to the frontend AgentData shape. */
export function agentToAgentData(agent: any): AgentData {
  const display = agent.displayConfig || {};
  const stats = agent.stats || { tasks: 0, success: 0, avgTime: '0m', tokPerMin: '0' };
  return {
    id: agent.id,
    name: agent.name,
    role: display.role || agent.role || '',
    department: agent.department || 'backend',
    status: mapStatus(agent.status),
    task: agent.task || '',
    colorTheme: display.colorTheme || 't-blue',
    hairStyle: display.hairStyle || 'hair-short',
    hairColor: display.hairColor || 'hair-dark',
    screenType: display.screenType || 'coding',
    mouth: display.mouth || 'neutral',
    model: agent.model || 'unknown',
    stats,
    avatar: display.avatar || {
      bg: 'linear-gradient(135deg,#6c5ce7,#a29bfe)',
      letter: agent.name?.[0] || '?',
    },
  };
}

// ---------------------------------------------------------------------------
// Task adapters
// ---------------------------------------------------------------------------

function mapTaskStatus(status: string): 'todo' | 'in_progress' | 'review' | 'done' {
  switch (status) {
    case 'pending':
    case 'queued':
      return 'todo';
    case 'in_progress':
      return 'in_progress';
    case 'review':
      return 'review';
    default:
      return 'done';
  }
}

/** Map backend task response to the frontend TaskData shape. */
export function taskToTaskData(task: any): TaskData {
  const deptMap: Record<string, { tag: TaskData['tag']; tagClass: TaskData['tagClass'] }> = {
    code: { tag: 'Backend', tagClass: 'be' },
    test: { tag: 'QA', tagClass: 'qa' },
    review: { tag: 'QA', tagClass: 'qa' },
    deploy: { tag: 'DevOps', tagClass: 'dv' },
    plan: { tag: 'Backend', tagClass: 'be' },
    fix: { tag: 'Frontend', tagClass: 'fe' },
  };
  const dept = deptMap[task.type] || { tag: 'Backend', tagClass: 'be' };
  return {
    id: task.id,
    title: task.title,
    tag: dept.tag,
    tagClass: dept.tagClass,
    assignee: task.assignedAgent?.name?.[0] || '?',
    department: task.assignedAgent?.department || undefined,
    status: mapTaskStatus(task.status),
  };
}

// ---------------------------------------------------------------------------
// Log adapters
// ---------------------------------------------------------------------------

/** Map backend log response to the frontend LogEntry shape. */
export function apiLogToLogEntry(log: any): LogEntry {
  const deptClass: Record<string, LogEntry['dept']> = {
    backend: 'be',
    frontend: 'fe',
    qa: 'qa',
    devops: 'dv',
  };
  return {
    agent: log.agentName || log.agent || '',
    dept: deptClass[log.department] || 'be',
    message: log.message || '',
    highlight: log.highlight || '',
  };
}

// ---------------------------------------------------------------------------
// Room adapters
// ---------------------------------------------------------------------------

interface RoomData {
  id: string;
  name: string;
  icon: string;
  iconClass: string;
  dept: string;
  agents: string[];
  footer: Record<string, any>;
  progress: number;
}

const deptConfig: Record<
  string,
  { name: string; icon: string; iconClass: string; dept: string }
> = {
  backend: {
    name: 'Backend Engineering',
    icon: '\u2699\uFE0F',
    iconClass: 'be',
    dept: 'API / Database / Services',
  },
  frontend: {
    name: 'Frontend Engineering',
    icon: '\uD83C\uDFA8',
    iconClass: 'fe',
    dept: 'UI / Components / Pages',
  },
  qa: {
    name: 'Quality Assurance',
    icon: '\uD83E\uDDEA',
    iconClass: 'qa',
    dept: 'Testing / Review / QA',
  },
  devops: {
    name: 'DevOps & Infrastructure',
    icon: '\uD83D\uDE80',
    iconClass: 'dv',
    dept: 'CI/CD / Cloud / Monitoring',
  },
};

/** Group a list of AgentData into department-based rooms.
 *  taskBoard is optional — when provided, progress is computed from real task completion data.
 */
export function agentsToRooms(
  agents: AgentData[],
  taskBoard?: { todo: any[]; in_progress: any[]; review: any[]; done: any[] },
): RoomData[] {
  const grouped = agents.reduce(
    (acc, agent) => {
      const dept = agent.department;
      if (!acc[dept]) acc[dept] = [];
      acc[dept].push(agent);
      return acc;
    },
    {} as Record<string, AgentData[]>,
  );

  // Compute per-department task completion if taskBoard is available
  const deptProgress: Record<string, { done: number; total: number }> = {};
  if (taskBoard) {
    const allTasks = [
      ...taskBoard.todo,
      ...taskBoard.in_progress,
      ...taskBoard.review,
      ...taskBoard.done,
    ];
    for (const task of allTasks) {
      const dept = task.department || 'unknown';
      if (!deptProgress[dept]) deptProgress[dept] = { done: 0, total: 0 };
      deptProgress[dept].total++;
      if (task.status === 'done') deptProgress[dept].done++;
    }
  }

  return Object.entries(grouped).map(([dept, deptAgents]) => {
    const config = deptConfig[dept] || {
      name: dept,
      icon: '\uD83D\uDCE6',
      iconClass: 'be',
      dept: '',
    };
    const active = deptAgents.filter(
      (a) => a.status === 'working' || a.status === 'thinking',
    ).length;

    // Use real task data if available, otherwise compute from agent stats
    let done: number;
    let totalTasks: number;
    const dp = deptProgress[dept];
    if (dp && dp.total > 0) {
      done = dp.done;
      totalTasks = dp.total;
    } else {
      totalTasks = deptAgents.reduce(
        (s, a) =>
          s +
          (typeof a.stats.tasks === 'number'
            ? a.stats.tasks
            : parseInt(String(a.stats.tasks)) || 0),
        0,
      );
      done = totalTasks > 0 ? Math.floor(totalTasks * 0.6) : 0;
    }

    const progress = totalTasks > 0 ? Math.round((done / totalTasks) * 100) : 0;
    return {
      id: dept,
      name: config.name,
      icon: config.icon,
      iconClass: config.iconClass,
      dept: config.dept,
      agents: deptAgents.map((a) => a.id),
      footer: { done, active, queue: totalTasks - done - active },
      progress,
    };
  });
}
