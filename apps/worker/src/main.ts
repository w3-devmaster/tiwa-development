import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { networkInterfaces } from 'node:os';
import { processJob, type TaskJobData } from './processor.js';

// Config from env
const WORKER_PORT = parseInt(process.env.WORKER_PORT || '6770', 10);
const WORKER_HOST = process.env.WORKER_HOST || '0.0.0.0';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:6769';
const HEARTBEAT_INTERVAL = parseInt(process.env.HEARTBEAT_INTERVAL || '3000', 10);

const WORKER_ID = `worker-${randomUUID().slice(0, 8)}`;
const startedAt = Date.now();

// Agent registry (managed by backend commands)
const agents: string[] = [];
let status: 'active' | 'idle' | 'error' = 'idle';

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
      });
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

      // Process the task asynchronously
      const jobData: TaskJobData = {
        taskId: body.taskId || randomUUID(),
        type: body.type || 'code',
        payload: body.payload || {},
      };

      processJob({ data: jobData, id: jobData.taskId } as any)
        .then((result) => console.log(`[Task] ${jobData.taskId} completed:`, result))
        .catch((err) => console.error(`[Task] ${jobData.taskId} failed:`, err));

      return sendJson(res, 200, { success: true, taskId: jobData.taskId, message: 'Task queued' });
    }

    // 404
    sendJson(res, 404, { error: 'Not found' });
  } catch (err) {
    console.error(`[HTTP] Error:`, err);
    sendJson(res, 500, { error: 'Internal server error' });
  }
});

// ========== Start ==========
server.listen(WORKER_PORT, WORKER_HOST, () => {
  console.log(`Tiwa Worker ${WORKER_ID} running on http://${WORKER_HOST}:${WORKER_PORT}`);
  console.log(`  LAN IP: ${lanIp}`);
  console.log(`  Backend: ${BACKEND_URL}`);
  console.log(`  Heartbeat: every ${HEARTBEAT_INTERVAL}ms`);

  // Start heartbeat
  sendHeartbeat(); // immediate first beat
  heartbeatTimer = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);
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
