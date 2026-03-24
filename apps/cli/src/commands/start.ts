import { Command } from '@oclif/core';
import { startServices } from '../core/daemon.js';

export default class Start extends Command {
  static override description = 'Start Tiwa backend + frontend services';

  static override examples = ['<%= config.bin %> start'];

  async run(): Promise<void> {
    await this.parse(Start);
    try {
      this.log('🚀 Starting Tiwa services...\n');
      const state = await startServices();

      if (state.backend) {
        this.log(`  ✅ Backend   PID: ${state.backend.pid}  Port: ${state.backend.port}  (0.0.0.0)`);
      }
      if (state.frontend) {
        this.log(`  ✅ Frontend  PID: ${state.frontend.pid}  Port: ${state.frontend.port}`);
      }

      this.log('');
      if (state.frontend) {
        this.log(`  🌐 Opening browser at http://localhost:${state.frontend.port}`);
      }
      this.log(`  📁 Logs: ~/.tiwa/logs/`);
      this.log('');
      this.log('  Run "tiwa status" to check health');
      this.log('  Run "tiwa worker" to start a worker on this or another machine');
      this.log('  Run "tiwa stop" to stop all services');
    } catch (error) {
      this.error(error instanceof Error ? error.message : 'Failed to start services');
    }
  }
}
