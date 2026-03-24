import { Command } from '@oclif/core';
import { loadConfig } from '../core/config.js';

export default class Monitor extends Command {
  static override description = 'Open Tiwa monitor UI in the browser';

  static override examples = ['<%= config.bin %> monitor'];

  async run(): Promise<void> {
    const config = await loadConfig();
    const url = config.orchestrator.url.replace(':4000', ':3000');

    this.log(`Opening Tiwa Monitor: ${url}`);

    const { execa } = await import('execa');
    const platform = process.platform;

    try {
      if (platform === 'darwin') {
        await execa('open', [url]);
      } else if (platform === 'win32') {
        await execa('cmd', ['/c', 'start', url]);
      } else {
        await execa('xdg-open', [url]);
      }
    } catch {
      this.log(`Could not open browser. Visit: ${url}`);
    }
  }
}
