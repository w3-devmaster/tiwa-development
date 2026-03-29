import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { networkInterfaces, homedir } from 'node:os';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { detectCliTools, type CliAvailability } from './cli-detector.js';
import { processTask, type TaskJobData, type TaskResult } from './processor.js';

// Load config from ~/.tiwa/worker.json (lower priority than env vars)
function loadFileConfig(): { backendUrl?: string; port?: number } {
  try {
    const configPath = join(homedir(), '.tiwa', 'worker.json');
    if (existsSync(configPath)) {
      return JSON.parse(readFileSync(configPath, 'utf-8'));
    }
  } catch { /* ignore */ }
  return {};
}

const fileConfig = loadFileConfig();

// Config priority: env vars > config file > defaults
const WORKER_PORT = parseInt(process.env.WORKER_PORT || String(fileConfig.port || 6770), 10);
const WORKER_HOST = process.env.WORKER_HOST || '0.0.0.0';
const BACKEND_URL = process.env.BACKEND_URL || fileConfig.backendUrl || 'http://localhost:6769';
const HEARTBEAT_INTERVAL = parseInt(process.env.HEARTBEAT_INTERVAL || '3000', 10);

const WORKER_ID = `worker-${randomUUID().slice(0, 8)}`;
const startedAt = Date.now();

// Agent registry (managed by backend commands)
const agents: string[] = [];
let status: 'active' | 'idle' | 'error' = 'idle';

// CLI tools availability (detected on startup)
let cliTools: CliAvailability = {
  claude: { available: false },
  codex: { available: false },
};

// ========== Get LAN IP ==========
function getLanIp(): string {
  const nets = networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return '127.0.0.1';
}

const lanIp = getLanIp();

// ========== Result Reporting ==========
async function reportTaskResult(taskId: string, result: TaskResult): Promise<void> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/orchestrator/worker-result`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workerId: WORKER_ID,
        taskId,
        status: result.status,
        content: result.content,
        error: result.error,
        provider: result.provider,
        durationMs: result.durationMs,
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      console.error(`[Report] Failed to report result for task ${taskId}: HTTP ${res.status}`);
    }
  } catch (err) {
    console.error(`[Report] Failed to report result for task ${taskId}:`, (err as Error).message);
  }
}

// ========== Stream Reporting ==========
async function streamChunkToBackend(
  taskId: string,
  chunk: string,
  stream: 'stdout' | 'stderr',
): Promise<void> {
  try {
    await fetch(`${BACKEND_URL}/api/orchestrator/worker-stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workerId: WORKER_ID, taskId, chunk, stream }),
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    // Non-critical — don't block execution
  }
}

// ========== Heartbeat ==========
let heartbeatTimer: ReturnType<typeof setInterval>;

async function sendHeartbeat(): Promise<void> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/workers/heartbeat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workerId: WORKER_ID,
        host: lanIp,
        port: WORKER_PORT,
        agents,
        status,
        uptime: Date.now() - startedAt,
        cliTools,
      }),
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      if (status === 'error') status = 'idle'; // recover
    }
  } catch (err) {
    console.error(`[Heartbeat] Failed to reach backend at ${BACKEND_URL}:`, (err as Error).message);
  }
}

// ========== HTTP Server ==========
function parseBody(req: http.IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res: http.ServerResponse, statusCode: number, data: unknown): void {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  const url = req.url || '/';
  const method = req.method || 'GET';

  try {
    // Health check
    if (method === 'GET' && url === '/health') {
      return sendJson(res, 200, {
        status: 'ok',
        service: 'tiwa-worker',
        workerId: WORKER_ID,
        timestamp: new Date().toISOString(),
      });
    }

    // Worker status
    if (method === 'GET' && url === '/status') {
      return sendJson(res, 200, {
        workerId: WORKER_ID,
        host: lanIp,
        port: WORKER_PORT,
        backendUrl: BACKEND_URL,
        agents,
        status,
        uptime: Date.now() - startedAt,
        cliTools,
      });
    }

    // CLI tools info
    if (method === 'GET' && url === '/cli-tools') {
      return sendJson(res, 200, cliTools);
    }

    // Agent update (from backend)
    if (method === 'POST' && url === '/agent/update') {
      const body = await parseBody(req);
      console.log(`[Agent] Update received:`, body);

      if (body.action === 'assign' && body.agentId) {
        if (!agents.includes(body.agentId)) {
          agents.push(body.agentId);
        }
        status = 'active';
        return sendJson(res, 200, { success: true, agents });
      }

      if (body.action === 'remove' && body.agentId) {
        const idx = agents.indexOf(body.agentId);
        if (idx !== -1) agents.splice(idx, 1);
        if (agents.length === 0) status = 'idle';
        return sendJson(res, 200, { success: true, agents });
      }

      if (body.action === 'config' && body.agentId && body.config) {
        console.log(`[Agent] Config update for ${body.agentId}:`, body.config);
        return sendJson(res, 200, { success: true, agentId: body.agentId });
      }

      return sendJson(res, 200, { success: true, message: 'Agent update acknowledged' });
    }

    // Agent assign task (from backend)
    if (method === 'POST' && url === '/agent/assign') {
      const body = await parseBody(req);
      console.log(`[Task] Assignment received:`, body);
      status = 'active';

      const jobData: TaskJobData = {
        taskId: body.taskId || randomUUID(),
        type: body.type || 'code',
        title: body.title || body.taskId || 'Untitled Task',
        description: body.description,
        projectPath: body.projectPath,
        provider: body.provider,
        agentRole: body.agentRole,
        priority: body.priority,
        gitRepo: body.gitRepo,
        envFiles: body.envFiles,
      };

      // Stream callback — sends CLI output chunks to backend in realtime
      const onOutput = (chunk: string, stream: 'stdout' | 'stderr') => {
        streamChunkToBackend(jobData.taskId, chunk, stream);
      };

      // Process async — respond immediately, report result later
      processTask(jobData, cliTools, onOutput)
        .then(async (result) => {
          console.log(`[Task] ${jobData.taskId} ${result.status} (${result.provider}, ${result.durationMs}ms)`);
          await reportTaskResult(jobData.taskId, result);
          status = 'idle';
        })
        .catch(async (err) => {
          console.error(`[Task] ${jobData.taskId} error:`, err);
          await reportTaskResult(jobData.taskId, {
            taskId: jobData.taskId,
            status: 'failed',
            content: '',
            error: err instanceof Error ? err.message : String(err),
            provider: jobData.provider || 'claude',
            durationMs: 0,
          });
          status = 'idle';
        });

      return sendJson(res, 200, {
        success: true,
        taskId: jobData.taskId,
        provider: jobData.provider || process.env.DEFAULT_CLI_PROVIDER || 'claude',
        message: 'Task accepted, processing with CLI',
      });
    }

    // 404
    sendJson(res, 404, { error: 'Not found' });
  } catch (err) {
    console.error(`[HTTP] Error:`, err);
    sendJson(res, 500, { error: 'Internal server error' });
  }
});

// ========== Start ==========
async function start() {
  // Detect CLI tools
  cliTools = await detectCliTools();
  console.log(`CLI Tools detected:`);
  console.log(`  claude: ${cliTools.claude.available ? `✓ ${cliTools.claude.version || 'available'}` : '✗ not found'}`);
  console.log(`  codex:  ${cliTools.codex.available ? `✓ ${cliTools.codex.version || 'available'}` : '✗ not found'}`);

  if (!cliTools.claude.available && !cliTools.codex.available) {
    console.warn('⚠ No CLI tools found. Install Claude Code CLI or Codex CLI for task execution.');
  }

  server.listen(WORKER_PORT, WORKER_HOST, () => {
    console.log(`\nTiwa Worker ${WORKER_ID} running on http://${WORKER_HOST}:${WORKER_PORT}`);
    console.log(`  LAN IP: ${lanIp}`);
    console.log(`  Backend: ${BACKEND_URL}`);
    console.log(`  Heartbeat: every ${HEARTBEAT_INTERVAL}ms`);
    console.log(`  Default provider: ${process.env.DEFAULT_CLI_PROVIDER || 'claude'}`);

    // Start heartbeat
    sendHeartbeat();
    heartbeatTimer = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);
  });
}

start().catch((err) => {
  console.error('Failed to start worker:', err);
  process.exit(1);
});

// ========== Shutdown ==========
async function shutdown() {
  console.log('Shutting down worker...');
  clearInterval(heartbeatTimer);
  server.close();
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
