import { Args, Flags, Command } from '@oclif/core';
import { getAgentLogs } from '../../core/agents.js';

export default class AgentsLogs extends Command {
  static override description = 'View agent logs';

  static override examples = [
    '<%= config.bin %> agents logs agent-123',
    '<%= config.bin %> agents logs agent-123 --lines 50',
  ];

  static override args = {
    id: Args.string({
      description: 'Agent ID',
      required: true,
    }),
  };

  static override flags = {
    lines: Flags.integer({
      char: 'n',
      description: 'Number of log lines to show',
      default: 100,
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(AgentsLogs);

    try {
      const logs = await getAgentLogs(args.id, flags.lines);

      if (logs.length === 0) {
        this.log('No logs found');
        return;
      }

      for (const line of logs) {
        this.log(line);
      }
    } catch (error) {
      this.error(error instanceof Error ? error.message : 'Failed to get agent logs');
    }
  }
}
