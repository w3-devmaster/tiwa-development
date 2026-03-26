import { exec } from 'node:child_process';

export interface CliToolInfo {
  available: boolean;
  version?: string;
  path?: string;
}

export interface CliAvailability {
  claude: CliToolInfo;
  codex: CliToolInfo;
}

function execAsync(cmd: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(cmd, { timeout: 5000 }, (err, stdout) => {
      if (err) reject(err);
      else resolve(stdout.trim());
    });
  });
}

async function detectTool(name: string): Promise<CliToolInfo> {
  try {
    const path = await execAsync(`which ${name}`);
    let version: string | undefined;
    try {
      const raw = await execAsync(`${name} --version`);
      version = raw.split('\n')[0];
    } catch {
      // version check failed, tool exists but no --version
    }
    return { available: true, version, path };
  } catch {
    return { available: false };
  }
}

export async function detectCliTools(): Promise<CliAvailability> {
  const [claude, codex] = await Promise.all([
    detectTool('claude'),
    detectTool('codex'),
  ]);
  return { claude, codex };
}
