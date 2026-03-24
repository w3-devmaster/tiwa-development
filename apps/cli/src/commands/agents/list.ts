import { Command } from '@oclif/core';
import { listAgents } from '../../core/agents.js';

export default class AgentsList extends Command {
  static override description = 'List all agents';

  static override examples = ['<%= config.bin %> agents list'];

  async run(): Promise<void> {
    try {
      const agents = await listAgents();

      if (agents.length === 0) {
        this.log('No agents found');
        return;
      }

      this.log('ID\tName\tRole\tStatus');
      this.log('--\t----\t----\t------');
      for (const agent of agents) {
        this.log(`${agent.id}\t${agent.name}\t${agent.role}\t${agent.status}`);
      }
    } catch (error) {
      this.error(error instanceof Error ? error.message : 'Failed to list agents');
    }
  }
}
