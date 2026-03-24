import { z } from 'zod';

export const TiwaConfigSchema = z.object({
  orchestrator: z.object({
    url: z.string().url().default('http://localhost:4000'),
    timeout: z.number().default(30000),
  }).default({}),
  daemon: z.object({
    port: z.number().default(4000),
    logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  }).default({}),
  projects: z.object({
    defaultPath: z.string().default('~/tiwa-projects'),
  }).default({}),
});

export type TiwaConfig = z.infer<typeof TiwaConfigSchema>;

export interface DaemonState {
  pid: number;
  port: number;
  startedAt: string;
  version: string;
}

export interface SystemStatus {
  daemon: {
    running: boolean;
    pid?: number;
    port?: number;
    uptime?: number;
  };
  orchestrator: {
    connected: boolean;
    url: string;
  };
  agents: {
    total: number;
    active: number;
  };
}
