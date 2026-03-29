#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { createInterface } from 'node:readline';

const CONFIG_DIR = join(homedir(), '.tiwa');
const CONFIG_FILE = join(CONFIG_DIR, 'worker.json');

interface WorkerConfig {
  backendUrl: string;
  port: number;
}

const DEFAULT_CONFIG: WorkerConfig = {
  backendUrl: 'http://localhost:6769',
  port: 6770,
};

function loadConfig(): WorkerConfig {
  try {
    if (existsSync(CONFIG_FILE)) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(readFileSync(CONFIG_FILE, 'utf-8')) };
    }
  } catch {
    // ignore parse errors
  }
  return { ...DEFAULT_CONFIG };
}

function saveConfig(config: WorkerConfig): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
  console.log(`\x1b[32m✓\x1b[0m Config saved to ${CONFIG_FILE}`);
}

function prompt(question: string, defaultValue?: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const suffix = defaultValue ? ` (${defaultValue})` : '';
  return new Promise((resolve) => {
    rl.question(`? ${question}${suffix}: `, (answer) => {
      rl.close();
      resolve(answer.trim() || defaultValue || '');
    });
  });
}

async function configInteractive(): Promise<void> {
  const current = loadConfig();
  console.log('\n\x1b[1mTiwa Worker Configuration\x1b[0m\n');

  const backendUrl = await prompt('Backend URL', current.backendUrl);
  const portStr = await prompt('Worker Port', String(current.port));
  const port = parseInt(portStr) || current.port;

  saveConfig({ backendUrl, port });
}

function configFromFlags(args: string[]): void {
  const config = loadConfig();
  let changed = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--backend-url' && args[i + 1]) {
      config.backendUrl = args[++i];
      changed = true;
    }
    if (args[i] === '--port' && args[i + 1]) {
      config.port = parseInt(args[++i]) || config.port;
      changed = true;
    }
  }

  if (changed) {
    saveConfig(config);
  } else {
    console.log('No flags provided. Use --backend-url URL or --port PORT');
    process.exit(1);
  }
}

function configList(): void {
  const config = loadConfig();
  console.log('\n\x1b[1mTiwa Worker Config\x1b[0m');
  console.log(`  File: ${CONFIG_FILE}`);
  console.log(`  backend-url: ${config.backendUrl}`);
  console.log(`  port: ${config.port}`);
  console.log('');
}

function printUsage(): void {
  console.log(`
\x1b[1mTiwa Worker CLI\x1b[0m

Usage:
  tiwa worker config              Interactive configuration
  tiwa worker config --list       Show current config
  tiwa worker config --backend-url URL --port PORT
                                  Set config via flags
  tiwa worker start               Start worker with saved config

Environment variables (override config file):
  BACKEND_URL    Backend server URL
  WORKER_PORT    Worker listen port
`);
}

// ========== Main ==========
const args = process.argv.slice(2);
const command = args[0];
const subcommand = args[1];

if (command === 'worker' || command === undefined) {
  const sub = command === 'worker' ? subcommand : command;
  const flagArgs = command === 'worker' ? args.slice(2) : args.slice(1);

  if (sub === 'config') {
    if (flagArgs.includes('--list')) {
      configList();
    } else if (flagArgs.some((a) => a.startsWith('--'))) {
      configFromFlags(flagArgs);
    } else {
      configInteractive();
    }
  } else if (sub === 'start') {
    // Set env from config and import main
    const config = loadConfig();
    if (!process.env.BACKEND_URL) process.env.BACKEND_URL = config.backendUrl;
    if (!process.env.WORKER_PORT) process.env.WORKER_PORT = String(config.port);
    console.log(`Starting worker with config from ${CONFIG_FILE}`);
    console.log(`  Backend: ${process.env.BACKEND_URL}`);
    console.log(`  Port: ${process.env.WORKER_PORT}`);
    import('./main.js');
  } else {
    printUsage();
  }
} else if (command === 'config') {
  // Allow `tiwa config` shorthand
  const flagArgs = args.slice(1);
  if (flagArgs.includes('--list')) {
    configList();
  } else if (flagArgs.some((a) => a.startsWith('--'))) {
    configFromFlags(flagArgs);
  } else {
    configInteractive();
  }
} else if (command === 'start') {
  const config = loadConfig();
  if (!process.env.BACKEND_URL) process.env.BACKEND_URL = config.backendUrl;
  if (!process.env.WORKER_PORT) process.env.WORKER_PORT = String(config.port);
  console.log(`Starting worker with config from ${CONFIG_FILE}`);
  import('./main.js');
} else {
  printUsage();
}
