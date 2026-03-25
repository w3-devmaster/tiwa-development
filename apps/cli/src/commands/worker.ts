import { Args, Command, Flags } from '@oclif/core';
import { buildWorker, startWorker, stopWorker, restartWorker } from '../core/daemon.js';

export default class Worker extends Command {
  static override description = 'Start/stop Tiwa worker';

  static override examples = [
    '<%= config.bin %> worker',
    '<%= config.bin %> worker --backend http://192.168.1.10:6769',
    '<%= config.bin %> worker stop',
    '<%= config.bin %> worker status',
  ];

  static override args = {
    action: Args.string({
      description: 'Action: start (default), stop, status, restart',
      default: 'start',
      options: ['start', 'stop', 'status', 'restart'],
    }),
  };

  static override flags = {
    backend: Flags.string({
      char: 'b',
      description: 'Backend URL to connect to (e.g. http://192.168.1.10:6769)',
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Worker);

    if (args.action === 'stop') {
      try {
        this.log('Stopping worker...');
        await stopWorker();
        this.log('✅ Worker stopped');
      } catch (error) {
        this.error(error instanceof Error ? error.message : 'Failed to stop worker');
      }
      return;
    }

    if (args.action === 'status') {
      // Import here to avoid circular deps
      const { getFullStatus } = await import('../core/daemon.js');
      const status = await getFullStatus();
      this.log('=== Worker Status ===\n');
      this.log(`  Worker   ${status.worker.running ? '🟢 Running' : '🔴 Stopped'}${status.worker.pid ? `  PID: ${status.worker.pid}` : ''}  Port: ${status.worker.port}`);
      if (status.connectedWorkers.length > 0) {
        this.log(`\n  Connected Workers: ${status.connectedWorkers.length}`);
        for (const w of status.connectedWorkers) {
          this.log(`    - ${w.id} (${w.host}:${w.port}) ${w.status} — agents: ${w.agents?.length || 0}`);
        }
      }
      return;
    }

    if (args.action === 'restart') {
      try {
        this.log('🔄 Restarting Tiwa worker...\n');
        const state = await restartWorker(flags.backend, (msg) => this.log(`  ${msg}`));
        this.log('  ✅ Build complete\n');
        if (state.worker) {
          this.log(`  ✅ Worker    PID: ${state.worker.pid}  Port: ${state.worker.port}  (0.0.0.0)`);
        }
        this.log(`  🔗 Backend:  ${state.backendUrl}`);
        this.log(`  💓 Heartbeat: every 3s`);
        this.log(`  📁 Logs: ~/.tiwa/logs/`);
      } catch (error) {
        this.error(error instanceof Error ? error.message : 'Failed to restart worker');
      }
      return;
    }

    // Default: start
    try {
      this.log('📦 Building worker...');
      await buildWorker((msg) => this.log(`  ${msg}`));
      this.log('  ✅ Build complete\n');

      this.log('🔧 Starting Tiwa worker...\n');
      const state = await startWorker(flags.backend);

      if (state.worker) {
        this.log(`  ✅ Worker    PID: ${state.worker.pid}  Port: ${state.worker.port}  (0.0.0.0)`);
      }
      this.log(`  🔗 Backend:  ${state.backendUrl}`);
      this.log(`  💓 Heartbeat: every 3s`);
      this.log(`  📁 Logs: ~/.tiwa/logs/`);
      this.log('');
      this.log('  Run "tiwa worker status" to check');
      this.log('  Run "tiwa worker stop" to stop');
    } catch (error) {
      this.error(error instanceof Error ? error.message : 'Failed to start worker');
    }
  }
}
