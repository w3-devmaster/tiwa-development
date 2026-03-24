import { Args, Command } from '@oclif/core';
import { renameAgent } from '../../core/agents.js';

export default class AgentsRename extends Command {
  static override description = 'Rename an agent';

  static override examples = ['<%= config.bin %> agents rename agent-123 "My Agent"'];

  static override args = {
    id: Args.string({
      description: 'Agent ID',
      required: true,
    }),
    name: Args.string({
      description: 'New agent name',
      required: true,
    }),
  };

  async run(): Promise<void> {
    const { args } = await this.parse(AgentsRename);

    try {
      const agent = await renameAgent(args.id, args.name);
      this.log(`Agent renamed: ${agent.id} -> ${agent.name}`);
    } catch (error) {
      this.error(error instanceof Error ? error.message : 'Failed to rename agent');
    }
  }
}
