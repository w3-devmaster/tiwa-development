import { Command } from '@oclif/core';
import { getDaemonStatus } from '../core/daemon.js';

export default class Status extends Command {
  static override description = 'Show Tiwa system status';

  static override examples = ['<%= config.bin %> status'];

  async run(): Promise<void> {
    const status = await getDaemonStatus();

    this.log('=== Tiwa Status ===\n');

    // Daemon
    this.log(`Daemon:       ${status.daemon.running ? 'Running' : 'Stopped'}`);
    if (status.daemon.running) {
      this.log(`  PID:        ${status.daemon.pid}`);
      this.log(`  Port:       ${status.daemon.port}`);
      if (status.daemon.uptime) {
        const seconds = Math.floor(status.daemon.uptime / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        this.log(`  Uptime:     ${hours}h ${minutes % 60}m ${seconds % 60}s`);
      }
    }

    // Orchestrator
    this.log(`\nOrchestrator: ${status.orchestrator.connected ? 'Connected' : 'Disconnected'}`);
    this.log(`  URL:        ${status.orchestrator.url}`);

    // Agents
    this.log(`\nAgents:       ${status.agents.active}/${status.agents.total} active`);
  }
}
