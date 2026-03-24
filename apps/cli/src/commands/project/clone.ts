import { Args, Command } from '@oclif/core';
import { cloneProject } from '../../core/project.js';

export default class ProjectClone extends Command {
  static override description = 'Clone a project from a Git repository';

  static override examples = [
    '<%= config.bin %> project clone https://github.com/user/repo.git',
  ];

  static override args = {
    url: Args.string({
      description: 'Git repository URL',
      required: true,
    }),
  };

  async run(): Promise<void> {
    const { args } = await this.parse(ProjectClone);

    try {
      const project = await cloneProject(args.url);
      this.log(`Project cloned: ${project.name} (${project.id})`);
    } catch (error) {
      this.error(error instanceof Error ? error.message : 'Failed to clone project');
    }
  }
}
