import { z } from 'zod';

export const TiwaConfigSchema = z.object({
  orchestrator: z.object({
    url: z.string().url().default('http://localhost:6769'),
    timeout: z.number().default(30000),
  }).default({}),
  backend: z.object({
    port: z.number().default(6769),
    host: z.string().default('0.0.0.0'),
    logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  }).default({}),
  frontend: z.object({
    port: z.number().default(6768),
  }).default({}),
  worker: z.object({
    port: z.number().default(6770),
    host: z.string().default('0.0.0.0'),
    backendUrl: z.string().default('http://localhost:6769'),
    heartbeatInterval: z.number().default(3000),
    cliProvider: z.enum(['claude', 'codex']).default('claude'),
    cliTimeout: z.number().default(300000),
    cliWorkDir: z.string().default(''),
  }).default({}),
  projects: z.object({
    defaultPath: z.string().default('~/tiwa-projects'),
  }).default({}),
});

export type TiwaConfig = z.infer<typeof TiwaConfigSchema>;

export interface ServiceState {
  pid: number;
  port: number;
}

// State for tiwa start (backend + frontend)
export interface DaemonState {
  backend: ServiceState | null;
  frontend: ServiceState | null;
  startedAt: string;
  version: string;
}

// State for tiwa worker
export interface WorkerState {
  worker: ServiceState | null;
  backendUrl: string;
  startedAt: string;
  version: string;
}

export interface ServiceStatus {
  running: boolean;
  pid?: number;
  port?: number;
}

export interface WorkerInfo {
  id: string;
  host: string;
  port: number;
  agents: string[];
  status: 'active' | 'idle' | 'error';
  lastHeartbeat: string;
  uptime: number;
}

export interface SystemStatus {
  backend: ServiceStatus;
  frontend: ServiceStatus;
  worker: ServiceStatus;
  orchestrator: {
    connected: boolean;
    url: string;
  };
  connectedWorkers: WorkerInfo[];
  uptime?: number;
  agents: {
    total: number;
    active: number;
  };
}
