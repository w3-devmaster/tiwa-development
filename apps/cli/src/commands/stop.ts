import { Command } from '@oclif/core';
import { stopDaemon } from '../core/daemon.js';

export default class Stop extends Command {
  static override description = 'Stop Tiwa daemon';

  static override examples = ['<%= config.bin %> stop'];

  async run(): Promise<void> {
    try {
      await stopDaemon();
      this.log('Tiwa daemon stopped');
    } catch (error) {
      this.error(error instanceof Error ? error.message : 'Failed to stop daemon');
    }
  }
}
