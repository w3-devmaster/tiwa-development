export const QUEUE_NAMES = {
  TASK: 'tiwa:task',
  CODE_EXECUTION: 'tiwa:code-execution',
  TEST_RUNNER: 'tiwa:test-runner',
  CODE_REVIEW: 'tiwa:code-review',
  DEPLOYMENT: 'tiwa:deployment',
  NOTIFICATION: 'tiwa:notification',
} as const;

export const WS_EVENTS = {
  AGENT_STATUS: 'agent:status',
  TASK_UPDATE: 'task:update',
  WORKFLOW_UPDATE: 'workflow:update',
  LOG_ENTRY: 'log:entry',
  CHAT_MESSAGE: 'chat:message',
} as const;

export const DEFAULT_WORKER_CONCURRENCY = 3;
export const DEFAULT_MAX_RETRIES = 3;
export const DEFAULT_JOB_TIMEOUT = 5 * 60 * 1000; // 5 minutes
