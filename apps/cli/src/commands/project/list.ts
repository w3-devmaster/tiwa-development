import { Command } from '@oclif/core';
import { listProjects } from '../../core/project.js';

export default class ProjectList extends Command {
  static override description = 'List all projects';

  static override examples = ['<%= config.bin %> project list'];

  async run(): Promise<void> {
    try {
      const projects = await listProjects();

      if (projects.length === 0) {
        this.log('No projects found');
        return;
      }

      this.log('ID\tName\tStatus\tPath');
      this.log('--\t----\t------\t----');
      for (const project of projects) {
        this.log(`${project.id}\t${project.name}\t${project.status}\t${project.workspacePath}`);
      }
    } catch (error) {
      this.error(error instanceof Error ? error.message : 'Failed to list projects');
    }
  }
}
