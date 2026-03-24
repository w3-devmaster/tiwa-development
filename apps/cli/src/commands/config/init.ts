import { Command } from '@oclif/core';
import { initConfig, getConfigPath } from '../../core/config.js';

export default class ConfigInit extends Command {
  static override description = 'Initialize Tiwa configuration';

  static override examples = ['<%= config.bin %> config init'];

  async run(): Promise<void> {
    const config = await initConfig();
    this.log(`Configuration initialized at ${getConfigPath()}`);
    this.log(JSON.stringify(config, null, 2));
  }
}
