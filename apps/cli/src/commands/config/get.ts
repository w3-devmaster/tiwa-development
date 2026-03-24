import { Args, Command } from '@oclif/core';
import { getConfigValue } from '../../core/config.js';

export default class ConfigGet extends Command {
  static override description = 'Get a configuration value';

  static override examples = [
    '<%= config.bin %> config get orchestrator.url',
    '<%= config.bin %> config get daemon.port',
  ];

  static override args = {
    key: Args.string({
      description: 'Configuration key (dot notation)',
      required: true,
    }),
  };

  async run(): Promise<void> {
    const { args } = await this.parse(ConfigGet);
    const value = await getConfigValue(args.key);

    if (value === undefined) {
      this.error(`Key "${args.key}" not found`);
    }

    if (typeof value === 'object') {
      this.log(JSON.stringify(value, null, 2));
    } else {
      this.log(String(value));
    }
  }
}
