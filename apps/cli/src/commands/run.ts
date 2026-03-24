import { Args, Flags, Command } from '@oclif/core';
import { loadConfig } from '../core/config.js';

export default class Run extends Command {
  static override description = 'Run a workflow';

  static override examples = [
    '<%= config.bin %> run build',
    '<%= config.bin %> run deploy --project my-app',
  ];

  static override args = {
    workflow: Args.string({
      description: 'Workflow name to execute',
      required: true,
    }),
  };

  static override flags = {
    project: Flags.string({
      char: 'p',
      description: 'Target project',
    }),
    watch: Flags.boolean({
      char: 'w',
      description: 'Watch for workflow progress',
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Run);
    const config = await loadConfig();

    try {
      const res = await fetch(`${config.orchestrator.url}/api/workflows/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflow: args.workflow,
          project: flags.project,
        }),
        signal: AbortSignal.timeout(config.orchestrator.timeout),
      });

      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`API error ${res.status}: ${body || res.statusText}`);
      }

      const result = await res.json() as { id: string };
      this.log(`Workflow "${args.workflow}" started (ID: ${result.id})`);

      if (flags.watch) {
        this.log('Watching for progress... (Ctrl+C to stop)');
      }
    } catch (error) {
      this.error(error instanceof Error ? error.message : 'Failed to run workflow');
    }
  }
}
