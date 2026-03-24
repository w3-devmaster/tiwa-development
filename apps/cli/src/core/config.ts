import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { parse, stringify } from 'yaml';
import { TiwaConfigSchema, type TiwaConfig } from '../types/index.js';

const TIWA_DIR = join(homedir(), '.tiwa');
const CONFIG_PATH = join(TIWA_DIR, 'config.yml');

export function getTiwaDir(): string {
  return TIWA_DIR;
}

export function getConfigPath(): string {
  return CONFIG_PATH;
}

async function ensureTiwaDir(): Promise<void> {
  if (!existsSync(TIWA_DIR)) {
    await mkdir(TIWA_DIR, { recursive: true });
  }
}

export async function loadConfig(): Promise<TiwaConfig> {
  if (!existsSync(CONFIG_PATH)) {
    return TiwaConfigSchema.parse({});
  }

  const raw = await readFile(CONFIG_PATH, 'utf-8');
  const data = parse(raw) ?? {};
  return TiwaConfigSchema.parse(data);
}

export async function saveConfig(config: TiwaConfig): Promise<void> {
  await ensureTiwaDir();
  const content = stringify(config, { indent: 2 });
  await writeFile(CONFIG_PATH, content, 'utf-8');
}

export async function initConfig(): Promise<TiwaConfig> {
  await ensureTiwaDir();

  const logsDir = join(TIWA_DIR, 'logs');
  if (!existsSync(logsDir)) {
    await mkdir(logsDir, { recursive: true });
  }

  const config = TiwaConfigSchema.parse({});
  await saveConfig(config);
  return config;
}

export async function getConfigValue(key: string): Promise<unknown> {
  const config = await loadConfig();
  const parts = key.split('.');
  let current: unknown = config;

  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }

  return current;
}

export async function setConfigValue(key: string, value: string): Promise<TiwaConfig> {
  const config = await loadConfig();
  const parts = key.split('.');
  let current: Record<string, unknown> = config as Record<string, unknown>;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (typeof current[part] !== 'object' || current[part] === null) {
      current[part] = {};
    }
    current = current[part] as Record<string, unknown>;
  }

  const lastKey = parts[parts.length - 1];
  const numValue = Number(value);
  if (!Number.isNaN(numValue) && value.trim() !== '') {
    current[lastKey] = numValue;
  } else if (value === 'true') {
    current[lastKey] = true;
  } else if (value === 'false') {
    current[lastKey] = false;
  } else {
    current[lastKey] = value;
  }

  const validated = TiwaConfigSchema.parse(config);
  await saveConfig(validated);
  return validated;
}
