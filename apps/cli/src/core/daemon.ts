import { readFile, writeFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { getTiwaDir, loadConfig } from './config.js';
import type { DaemonState, SystemStatus } from '../types/index.js';

const STATE_FILE = 'state.json';

function getStatePath(): string {
  return join(getTiwaDir(), STATE_FILE);
}

async function readState(): Promise<DaemonState | null> {
  const path = getStatePath();
  if (!existsSync(path)) return null;

  try {
    const raw = await readFile(path, 'utf-8');
    return JSON.parse(raw) as DaemonState;
  } catch {
    return null;
  }
}

async function writeState(state: DaemonState): Promise<void> {
  await writeFile(getStatePath(), JSON.stringify(state, null, 2), 'utf-8');
}

async function clearState(): Promise<void> {
  const path = getStatePath();
  if (existsSync(path)) {
    await rm(path);
  }
}

function isProcessRunning(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

export async function startDaemon(): Promise<DaemonState> {
  const existing = await readState();
  if (existing && isProcessRunning(existing.pid)) {
    throw new Error(`Daemon already running (PID: ${existing.pid})`);
  }

  const config = await loadConfig();
  const port = config.daemon.port;

  // TODO: spawn actual orchestrator backend process
  // For now, record that the daemon "started" with current process info
  const state: DaemonState = {
    pid: process.pid,
    port,
    startedAt: new Date().toISOString(),
    version: '0.1.0',
  };

  await writeState(state);
  return state;
}

export async function stopDaemon(): Promise<void> {
  const state = await readState();
  if (!state) {
    throw new Error('Daemon is not running');
  }

  if (isProcessRunning(state.pid)) {
    try {
      process.kill(state.pid, 'SIGTERM');
    } catch {
      // Process may have already exited
    }
  }

  await clearState();
}

export async function getDaemonStatus(): Promise<SystemStatus> {
  const config = await loadConfig();
  const state = await readState();
  const running = state !== null && isProcessRunning(state.pid);

  let orchestratorConnected = false;
  try {
    const res = await fetch(`${config.orchestrator.url}/health`, {
      signal: AbortSignal.timeout(3000),
    });
    orchestratorConnected = res.ok;
  } catch {
    // Not connected
  }

  return {
    daemon: {
      running,
      pid: running ? state?.pid : undefined,
      port: running ? state?.port : undefined,
      uptime: running && state ? Date.now() - new Date(state.startedAt).getTime() : undefined,
    },
    orchestrator: {
      connected: orchestratorConnected,
      url: config.orchestrator.url,
    },
    agents: {
      total: 0,
      active: 0,
    },
  };
}
