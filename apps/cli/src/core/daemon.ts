import { readFile, writeFile, rm, mkdir, open } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { spawn, exec } from 'node:child_process';
import { getTiwaDir, loadConfig } from './config.js';
import type { DaemonState, WorkerState, ServiceState, SystemStatus } from '../types/index.js';

const STATE_FILE = 'state.json';
const WORKER_STATE_FILE = 'worker-state.json';
const LOG_DIR = 'logs';

function getStatePath(): string {
  return join(getTiwaDir(), STATE_FILE);
}

function getWorkerStatePath(): string {
  return join(getTiwaDir(), WORKER_STATE_FILE);
}

function getLogDir(): string {
  return join(getTiwaDir(), LOG_DIR);
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
  if (existsSync(path)) await rm(path);
}

async function readWorkerState(): Promise<WorkerState | null> {
  const path = getWorkerStatePath();
  if (!existsSync(path)) return null;
  try {
    const raw = await readFile(path, 'utf-8');
    return JSON.parse(raw) as WorkerState;
  } catch {
    return null;
  }
}

async function writeWorkerState(state: WorkerState): Promise<void> {
  await writeFile(getWorkerStatePath(), JSON.stringify(state, null, 2), 'utf-8');
}

async function clearWorkerState(): Promise<void> {
  const path = getWorkerStatePath();
  if (existsSync(path)) await rm(path);
}

function isProcessRunning(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function findProjectRoot(): string | null {
  let dir = resolve(import.meta.dirname ?? process.cwd(), '..');
  for (let i = 0; i < 10; i++) {
    if (existsSync(join(dir, 'pnpm-workspace.yaml')) || existsSync(join(dir, 'turbo.json'))) {
      return dir;
    }
    dir = resolve(dir, '..');
  }
  return null;
}

function execPromise(cmd: string, opts: { cwd: string }): Promise<void> {
  return new Promise((resolve, reject) => {
    exec(cmd, { cwd: opts.cwd, maxBuffer: 10 * 1024 * 1024 }, (err) => {
      if (err) reject(new Error(`Build failed: ${err.message}`));
      else resolve();
    });
  });
}

export async function buildServices(log?: (msg: string) => void): Promise<void> {
  const projectRoot = findProjectRoot();
  if (!projectRoot) throw new Error('Cannot find Tiwa project root.');
  log?.('Building backend + frontend...');
  await execPromise('pnpm turbo build --filter=backend --filter=frontend', { cwd: projectRoot });
}

export async function buildWorker(log?: (msg: string) => void): Promise<void> {
  const projectRoot = findProjectRoot();
  if (!projectRoot) throw new Error('Cannot find Tiwa project root.');
  log?.('Building worker...');
  await execPromise('pnpm turbo build --filter=worker', { cwd: projectRoot });
}

function openBrowser(url: string): void {
  const cmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
  exec(`${cmd} ${url}`);
}

interface SpawnServiceOptions {
  name: string;
  command: string;
  args: string[];
  cwd: string;
  port: number;
  env?: Record<string, string>;
}

async function ensureLogDir(): Promise<string> {
  const logDir = getLogDir();
  if (!existsSync(logDir)) {
    await mkdir(logDir, { recursive: true });
  }
  return logDir;
}

async function spawnService(opts: SpawnServiceOptions, logDir: string): Promise<ServiceState> {
  const outLogPath = join(logDir, `${opts.name}-stdout.log`);
  const errLogPath = join(logDir, `${opts.name}-stderr.log`);
  const outFd = await open(outLogPath, 'a');
  const errFd = await open(errLogPath, 'a');

  const child = spawn(opts.command, opts.args, {
    cwd: opts.cwd,
    detached: true,
    stdio: ['ignore', outFd.fd, errFd.fd],
    env: { ...process.env, ...opts.env },
  });

  child.unref();
  const pid = child.pid;
  await outFd.close();
  await errFd.close();

  if (!pid) throw new Error(`Failed to start ${opts.name}`);
  return { pid, port: opts.port };
}

function killProcess(pid: number): void {
  try { process.kill(-pid, 'SIGTERM'); return; } catch { /* fallback */ }
  try { process.kill(pid, 'SIGTERM'); } catch { /* dead */ }
}

async function waitForProcessDeath(pid: number, maxWaitMs = 5000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs && isProcessRunning(pid)) {
    await new Promise((r) => setTimeout(r, 300));
  }
  if (isProcessRunning(pid)) {
    try { process.kill(pid, 'SIGKILL'); } catch { /* */ }
  }
}

async function killPort(port: number): Promise<void> {
  return new Promise((resolve) => {
    const cmd = process.platform === 'win32'
      ? `for /f "tokens=5" %a in ('netstat -aon ^| findstr :${port}') do taskkill /PID %a /F`
      : `lsof -ti :${port} | xargs kill -9 2>/dev/null`;
    exec(cmd, () => resolve());
  });
}

async function isPortOccupied(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const cmd = process.platform === 'win32'
      ? `netstat -aon | findstr :${port}`
      : `lsof -ti :${port}`;
    exec(cmd, (err, stdout) => {
      resolve(!err && stdout.trim().length > 0);
    });
  });
}

async function verifyPortFree(port: number, maxRetries = 5): Promise<void> {
  for (let i = 0; i < maxRetries; i++) {
    const occupied = await isPortOccupied(port);
    if (!occupied) return;
    await killPort(port);
    await new Promise((r) => setTimeout(r, 500));
  }
  const stillOccupied = await isPortOccupied(port);
  if (stillOccupied) {
    throw new Error(`Port ${port} is still occupied after ${maxRetries} kill attempts. Please close the process manually.`);
  }
}

// ========== tiwa start (backend + frontend) ==========

export async function startServices(): Promise<DaemonState> {
  const config = await loadConfig();

  // Force-kill ports before start (guarantee clean state)
  await killPort(config.backend.port);
  await killPort(config.frontend.port);
  await clearState();

  // Wait briefly for ports to be released
  await new Promise((r) => setTimeout(r, 500));
  const logDir = await ensureLogDir();
  const projectRoot = findProjectRoot();
  if (!projectRoot) throw new Error('Cannot find Tiwa project root.');

  const backendDir = join(projectRoot, 'apps', 'backend');
  const frontendDir = join(projectRoot, 'apps', 'frontend');

  // Auto-init SQLite database if not exists
  const dbPath = join(backendDir, 'data', 'tiwa.db');
  if (!existsSync(dbPath)) {
    await execPromise('npx prisma db push --skip-generate', { cwd: backendDir });
    await execPromise('npx prisma db seed', { cwd: backendDir });
  }

  // Backend
  let backendState: ServiceState | null = null;
  const backendDist = join(backendDir, 'dist', 'main.js');
  backendState = await spawnService({
    name: 'backend',
    command: process.execPath,
    args: [backendDist],
    cwd: backendDir,
    port: config.backend.port,
    env: {
      BACKEND_PORT: String(config.backend.port),
      BACKEND_HOST: config.backend.host,
      FRONTEND_URL: `http://localhost:${config.frontend.port}`,
      NODE_ENV: process.env.NODE_ENV ?? 'development',
    },
  }, logDir);

  // Frontend
  let frontendState: ServiceState | null = null;
  if (existsSync(frontendDir)) {
    const nextDir = join(frontendDir, '.next');
    const useProduction = existsSync(nextDir);
    frontendState = await spawnService({
      name: 'frontend',
      command: 'npx',
      args: useProduction ? ['next', 'start', '-p', String(config.frontend.port)] : ['next', 'dev', '-p', String(config.frontend.port)],
      cwd: frontendDir,
      port: config.frontend.port,
      env: {
        PORT: String(config.frontend.port),
        NEXT_PUBLIC_API_URL: `http://localhost:${config.backend.port}`,
        NODE_ENV: useProduction ? 'production' : 'development',
      },
    }, logDir);
  }

  const state: DaemonState = {
    backend: backendState,
    frontend: frontendState,
    startedAt: new Date().toISOString(),
    version: '0.1.0',
  };

  await writeState(state);

  if (frontendState) {
    setTimeout(() => openBrowser(`http://localhost:${config.frontend.port}`), 2000);
  }

  return state;
}

export async function stopServices(): Promise<void> {
  const state = await readState();
  const config = await loadConfig();

  // 1. Kill by PID (if state exists)
  const pids: number[] = [];
  if (state?.backend && isProcessRunning(state.backend.pid)) { killProcess(state.backend.pid); pids.push(state.backend.pid); }
  if (state?.frontend && isProcessRunning(state.frontend.pid)) { killProcess(state.frontend.pid); pids.push(state.frontend.pid); }
  if (pids.length) await Promise.all(pids.map((pid) => waitForProcessDeath(pid)));

  // 2. Kill by port (guarantee — handles orphan processes)
  await killPort(config.backend.port);
  await killPort(config.frontend.port);

  // 3. Verify ports are actually free
  await verifyPortFree(config.backend.port);
  await verifyPortFree(config.frontend.port);

  await clearState();
}

// ========== tiwa worker ==========

export async function startWorker(backendUrl?: string): Promise<WorkerState> {
  const config = await loadConfig();

  // Force-kill port before start (guarantee clean state)
  await killPort(config.worker.port);
  await clearWorkerState();
  await new Promise((r) => setTimeout(r, 500));
  const resolvedBackendUrl = backendUrl || config.worker.backendUrl;
  const logDir = await ensureLogDir();
  const projectRoot = findProjectRoot();
  if (!projectRoot) throw new Error('Cannot find Tiwa project root.');

  const workerDir = join(projectRoot, 'apps', 'worker');
  if (!existsSync(workerDir)) throw new Error('Worker directory not found.');

  const workerDist = join(workerDir, 'dist', 'main.js');
  const useCompiled = existsSync(workerDist);

  const workerState = await spawnService({
    name: 'worker',
    command: useCompiled ? process.execPath : 'npx',
    args: useCompiled ? [workerDist] : ['tsx', 'src/main.ts'],
    cwd: workerDir,
    port: config.worker.port,
    env: {
      WORKER_PORT: String(config.worker.port),
      WORKER_HOST: config.worker.host,
      BACKEND_URL: resolvedBackendUrl,
      HEARTBEAT_INTERVAL: String(config.worker.heartbeatInterval),
      DEFAULT_CLI_PROVIDER: config.worker.cliProvider || 'claude',
      CLI_TIMEOUT: String(config.worker.cliTimeout || 300000),
      CLI_WORK_DIR: config.worker.cliWorkDir || '',
      NODE_ENV: process.env.NODE_ENV ?? 'development',
    },
  }, logDir);

  const state: WorkerState = {
    worker: workerState,
    backendUrl: resolvedBackendUrl,
    startedAt: new Date().toISOString(),
    version: '0.1.0',
  };

  await writeWorkerState(state);
  return state;
}

export async function stopWorker(): Promise<void> {
  const state = await readWorkerState();
  const config = await loadConfig();

  // 1. Kill by PID
  if (state?.worker && isProcessRunning(state.worker.pid)) {
    killProcess(state.worker.pid);
    await waitForProcessDeath(state.worker.pid);
  }

  // 2. Kill by port (guarantee)
  await killPort(config.worker.port);

  // 3. Verify port is actually free
  await verifyPortFree(config.worker.port);

  await clearWorkerState();
}

// ========== tiwa stop (all) ==========

export async function stopAll(): Promise<void> {
  const state = await readState();
  const workerState = await readWorkerState();
  const config = await loadConfig();

  // 1. Kill by PID
  const pids: number[] = [];
  if (state?.backend && isProcessRunning(state.backend.pid)) { killProcess(state.backend.pid); pids.push(state.backend.pid); }
  if (state?.frontend && isProcessRunning(state.frontend.pid)) { killProcess(state.frontend.pid); pids.push(state.frontend.pid); }
  if (workerState?.worker && isProcessRunning(workerState.worker.pid)) { killProcess(workerState.worker.pid); pids.push(workerState.worker.pid); }
  if (pids.length) await Promise.all(pids.map((pid) => waitForProcessDeath(pid)));

  // 2. Kill by port (guarantee — handles orphan processes)
  await Promise.all([
    killPort(config.backend.port),
    killPort(config.frontend.port),
    killPort(config.worker.port),
  ]);

  // 3. Verify ALL ports are actually free
  await verifyPortFree(config.backend.port);
  await verifyPortFree(config.frontend.port);
  await verifyPortFree(config.worker.port);

  // 4. Always clear state (unconditional)
  await clearState();
  await clearWorkerState();
}

// ========== Restart ==========

export async function restartServices(log?: (msg: string) => void): Promise<DaemonState> {
  try { await stopServices(); } catch { /* not running */ }
  await buildServices(log);
  return startServices();
}

export async function restartWorker(backendUrl?: string, log?: (msg: string) => void): Promise<WorkerState> {
  try { await stopWorker(); } catch { /* not running */ }
  await buildWorker(log);
  return startWorker(backendUrl);
}

// ========== Status ==========

export async function getFullStatus(): Promise<SystemStatus> {
  const config = await loadConfig();
  const state = await readState();
  const workerState = await readWorkerState();

  const backendRunning = state?.backend ? isProcessRunning(state.backend.pid) : false;
  const frontendRunning = state?.frontend ? isProcessRunning(state.frontend.pid) : false;
  const workerRunning = workerState?.worker ? isProcessRunning(workerState.worker.pid) : false;

  if (state && !backendRunning && !frontendRunning) await clearState();
  if (workerState && !workerRunning) await clearWorkerState();

  let orchestratorConnected = false;
  let connectedWorkers: any[] = [];
  try {
    const res = await fetch(`${config.orchestrator.url}/health`, { signal: AbortSignal.timeout(3000) });
    orchestratorConnected = res.ok;
  } catch { /* */ }

  // Try to get connected workers from backend
  try {
    const res = await fetch(`${config.orchestrator.url}/api/workers`, { signal: AbortSignal.timeout(3000) });
    if (res.ok) connectedWorkers = await res.json() as any[];
  } catch { /* */ }

  const uptime = state && (backendRunning || frontendRunning)
    ? Date.now() - new Date(state.startedAt).getTime()
    : undefined;

  return {
    backend: { running: backendRunning, pid: backendRunning ? state?.backend?.pid : undefined, port: backendRunning ? state?.backend?.port : config.backend.port },
    frontend: { running: frontendRunning, pid: frontendRunning ? state?.frontend?.pid : undefined, port: frontendRunning ? state?.frontend?.port : config.frontend.port },
    worker: { running: workerRunning, pid: workerRunning ? workerState?.worker?.pid : undefined, port: workerRunning ? workerState?.worker?.port : config.worker.port },
    orchestrator: { connected: orchestratorConnected, url: config.orchestrator.url },
    connectedWorkers,
    uptime,
    agents: { total: 0, active: 0 },
  };
}

export async function getDaemonLogs(service = 'backend', lines = 50): Promise<string> {
  const logDir = getLogDir();
  const outLog = join(logDir, `${service}-stdout.log`);
  const errLog = join(logDir, `${service}-stderr.log`);
  let output = '';
  if (existsSync(outLog)) {
    const content = await readFile(outLog, 'utf-8');
    output += `=== ${service} stdout ===\n${content.split('\n').slice(-lines).join('\n')}\n`;
  }
  if (existsSync(errLog)) {
    const content = await readFile(errLog, 'utf-8');
    output += `=== ${service} stderr ===\n${content.split('\n').slice(-lines).join('\n')}\n`;
  }
  return output || `No logs found for ${service}`;
}
