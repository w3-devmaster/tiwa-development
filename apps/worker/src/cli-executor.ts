import { spawn } from 'node:child_process';

export type CliProvider = 'claude' | 'codex';

export interface CliExecutionOptions {
  provider: CliProvider;
  prompt: string;
  workDir?: string;
  timeout?: number; // ms, default 300_000 (5 min)
}

export interface CliExecutionResult {
  provider: CliProvider;
  content: string;
  error?: string;
  exitCode: number;
  durationMs: number;
}

function buildArgs(provider: CliProvider, prompt: string): { command: string; args: string[] } {
  switch (provider) {
    case 'claude':
      return {
        command: 'claude',
        args: ['-p', prompt, '--output-format', 'text', '--verbose'],
      };
    case 'codex':
      return {
        command: 'codex',
        args: ['-q', prompt, '--full-auto'],
      };
    default:
      throw new Error(`Unknown CLI provider: ${provider}`);
  }
}

export function executeWithCli(opts: CliExecutionOptions): Promise<CliExecutionResult> {
  const timeout = opts.timeout ?? 300_000;
  const { command, args } = buildArgs(opts.provider, opts.prompt);
  const startTime = Date.now();

  return new Promise((resolve, reject) => {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), timeout);

    const child = spawn(command, args, {
      cwd: opts.workDir || process.cwd(),
      env: { ...process.env },
      signal: ac.signal,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];

    child.stdout.on('data', (chunk: Buffer) => stdoutChunks.push(chunk));
    child.stderr.on('data', (chunk: Buffer) => stderrChunks.push(chunk));

    child.on('close', (code) => {
      clearTimeout(timer);
      const durationMs = Date.now() - startTime;
      const content = Buffer.concat(stdoutChunks).toString('utf-8').trim();
      const errorOutput = Buffer.concat(stderrChunks).toString('utf-8').trim();

      resolve({
        provider: opts.provider,
        content,
        error: code !== 0 ? errorOutput || `Process exited with code ${code}` : undefined,
        exitCode: code ?? 1,
        durationMs,
      });
    });

    child.on('error', (err) => {
      clearTimeout(timer);
      const durationMs = Date.now() - startTime;

      if (err.name === 'AbortError') {
        resolve({
          provider: opts.provider,
          content: Buffer.concat(stdoutChunks).toString('utf-8').trim(),
          error: `Timeout after ${timeout}ms`,
          exitCode: 124,
          durationMs,
        });
      } else {
        resolve({
          provider: opts.provider,
          content: '',
          error: `Failed to spawn ${command}: ${err.message}`,
          exitCode: 127,
          durationMs,
        });
      }
    });
  });
}
