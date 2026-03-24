import { Command } from '@oclif/core';
import { getFullStatus } from '../core/daemon.js';
import type { ServiceStatus } from '../types/index.js';

function formatService(name: string, svc: ServiceStatus): string {
  const status = svc.running ? '🟢 Running' : '🔴 Stopped';
  let line = `  ${name.padEnd(10)} ${status}`;
  if (svc.running && svc.pid) line += `  PID: ${svc.pid}`;
  if (svc.port) line += `  Port: ${svc.port}`;
  return line;
}

export default class Status extends Command {
  static override description = 'Show Tiwa system status';

  static override examples = ['<%= config.bin %> status'];

  async run(): Promise<void> {
    await this.parse(Status);
    const status = await getFullStatus();

    this.log('=== Tiwa Status ===\n');
    this.log(formatService('Backend', status.backend));
    this.log(formatService('Frontend', status.frontend));
    this.log(formatService('Worker', status.worker));

    if (status.uptime) {
      const seconds = Math.floor(status.uptime / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      this.log(`\n  Uptime:     ${hours}h ${minutes % 60}m ${seconds % 60}s`);
    }

    this.log(`\n  API:        ${status.orchestrator.connected ? '🟢 Connected' : '🔴 Disconnected'} (${status.orchestrator.url})`);

    if (status.connectedWorkers.length > 0) {
      this.log(`\n  Remote Workers: ${status.connectedWorkers.length} connected`);
      for (const w of status.connectedWorkers) {
        this.log(`    - ${w.id} (${w.host}:${w.port}) ${w.status}`);
      }
    }

    this.log(`  Agents:     ${status.agents.active}/${status.agents.total} active`);
  }
}
