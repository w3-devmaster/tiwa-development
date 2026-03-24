import { Args, Command } from '@oclif/core';
import { setConfigValue } from '../../core/config.js';

export default class ConfigSet extends Command {
  static override description = 'Set a configuration value';

  static override examples = [
    '<%= config.bin %> config set orchestrator.url http://localhost:6769',
    '<%= config.bin %> config set backend.port 6769',
  ];

  static override args = {
    key: Args.string({
      description: 'Configuration key (dot notation)',
      required: true,
    }),
    value: Args.string({
      description: 'Value to set',
      required: true,
    }),
  };

  async run(): Promise<void> {
    const { args } = await this.parse(ConfigSet);
    await setConfigValue(args.key, args.value);
    this.log(`Set ${args.key} = ${args.value}`);
  }
}
