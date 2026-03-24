import { Command } from '@oclif/core';
import { startDaemon } from '../core/daemon.js';

export default class Start extends Command {
  static override description = 'Start Tiwa daemon';

  static override examples = ['<%= config.bin %> start'];

  async run(): Promise<void> {
    try {
      const state = await startDaemon();
      this.log(`Tiwa daemon started (PID: ${state.pid}, Port: ${state.port})`);
    } catch (error) {
      this.error(error instanceof Error ? error.message : 'Failed to start daemon');
    }
  }
}
