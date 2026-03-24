import { Command } from '@oclif/core';
import { stopAll } from '../core/daemon.js';

export default class Stop extends Command {
  static override description = 'Stop all Tiwa services (backend, frontend, worker)';

  static override examples = ['<%= config.bin %> stop'];

  async run(): Promise<void> {
    await this.parse(Stop);
    try {
      this.log('Stopping all Tiwa services...');
      await stopAll();
      this.log('✅ All services stopped');
    } catch (error) {
      this.error(error instanceof Error ? error.message : 'Failed to stop services');
    }
  }
}
