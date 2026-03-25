import { Command } from '@oclif/core';
import { restartServices } from '../core/daemon.js';

export default class Restart extends Command {
  static override description = 'Build and restart Tiwa backend + frontend services';

  static override examples = ['<%= config.bin %> restart'];

  async run(): Promise<void> {
    await this.parse(Restart);
    try {
      this.log('🔄 Restarting Tiwa services...\n');
      const state = await restartServices((msg) => this.log(`  ${msg}`));
      this.log('  ✅ Build complete\n');

      if (state.backend) {
        this.log(`  ✅ Backend   PID: ${state.backend.pid}  Port: ${state.backend.port}  (0.0.0.0)`);
      }
      if (state.frontend) {
        this.log(`  ✅ Frontend  PID: ${state.frontend.pid}  Port: ${state.frontend.port}`);
      }

      this.log('');
      this.log(`  📁 Logs: ~/.tiwa/logs/`);
      this.log('');
      this.log('  Run "tiwa status" to check health');
      this.log('  Run "tiwa stop" to stop all services');
    } catch (error) {
      this.error(error instanceof Error ? error.message : 'Failed to restart services');
    }
  }
}
