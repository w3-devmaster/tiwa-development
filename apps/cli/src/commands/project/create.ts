import { Args, Flags, Command } from '@oclif/core';
import { createProject } from '../../core/project.js';

export default class ProjectCreate extends Command {
  static override description = 'Create a new project';

  static override examples = [
    '<%= config.bin %> project create my-app',
    '<%= config.bin %> project create my-app --description "My new app"',
  ];

  static override args = {
    name: Args.string({
      description: 'Project name',
      required: true,
    }),
  };

  static override flags = {
    description: Flags.string({
      char: 'd',
      description: 'Project description',
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ProjectCreate);

    try {
      const project = await createProject(args.name, flags.description);
      this.log(`Project created: ${project.name} (${project.id})`);
    } catch (error) {
      this.error(error instanceof Error ? error.message : 'Failed to create project');
    }
  }
}
