import { Injectable } from '@nestjs/common';

export interface WorkerInfo {
  id: string;
  host: string;
  port: number;
  agents: string[];
  status: 'active' | 'idle' | 'error';
  lastHeartbeat: Date;
  startedAt: Date;
  uptime: number;
}

export interface HeartbeatDto {
  workerId: string;
  host: string;
  port: number;
  agents: string[];
  status: 'active' | 'idle' | 'error';
  uptime: number;
}

@Injectable()
export class WorkersService {
  private workers = new Map<string, WorkerInfo>();
  private readonly TIMEOUT_MS = 10000; // 10 seconds without heartbeat = offline

  constructor() {
    // Cleanup stale workers every 5 seconds
    setInterval(() => this.cleanupStaleWorkers(), 5000);
  }

  handleHeartbeat(dto: HeartbeatDto): WorkerInfo {
    const worker: WorkerInfo = {
      id: dto.workerId,
      host: dto.host,
      port: dto.port,
      agents: dto.agents || [],
      status: dto.status || 'active',
      lastHeartbeat: new Date(),
      startedAt: this.workers.get(dto.workerId)?.startedAt || new Date(),
      uptime: dto.uptime || 0,
    };
    this.workers.set(dto.workerId, worker);
    return worker;
  }

  getWorkers(): WorkerInfo[] {
    this.cleanupStaleWorkers();
    return Array.from(this.workers.values());
  }

  getWorker(id: string): WorkerInfo | undefined {
    return this.workers.get(id);
  }

  async sendCommandToWorker(workerId: string, endpoint: string, body: any): Promise<any> {
    const worker = this.workers.get(workerId);
    if (!worker) throw new Error(`Worker ${workerId} not found`);

    const url = `http://${worker.host}:${worker.port}${endpoint}`;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(5000),
      });
      return res.json();
    } catch (error) {
      throw new Error(`Failed to reach worker ${workerId} at ${url}`);
    }
  }

  async broadcastToWorkers(endpoint: string, body: any): Promise<any[]> {
    const results = [];
    for (const worker of this.workers.values()) {
      try {
        const result = await this.sendCommandToWorker(worker.id, endpoint, body);
        results.push({ workerId: worker.id, success: true, result });
      } catch (error) {
        results.push({ workerId: worker.id, success: false, error: String(error) });
      }
    }
    return results;
  }

  private cleanupStaleWorkers(): void {
    const now = Date.now();
    for (const [id, worker] of this.workers) {
      if (now - worker.lastHeartbeat.getTime() > this.TIMEOUT_MS) {
        this.workers.delete(id);
      }
    }
  }
}
