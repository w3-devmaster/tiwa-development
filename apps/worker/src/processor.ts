import { existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join } from 'node:path';
import { executeWithCli, type CliProvider, type CliExecutionResult } from './cli-executor.js';
import type { CliAvailability } from './cli-detector.js';

export interface TaskJobData {
  taskId: string;
  type: string;
  title: string;
  description?: string;
  projectPath?: string;
  provider?: CliProvider;
  agentRole?: string;
  priority?: string;
  gitRepo?: { url?: string; productionBranch?: string; developmentBranch?: string };
  envFiles?: Record<string, string>;
}

export interface TaskResult {
  taskId: string;
  status: 'completed' | 'failed';
  content: string;
  error?: string;
  provider: CliProvider;
  durationMs: number;
}

// Role-specific prompt prefixes
const ROLE_PROMPTS: Record<string, string> = {
  planner: 'You are an AI project planner. Analyze requirements and create actionable plans.',
  backend: 'You are an expert backend engineer (Node.js, NestJS, TypeScript, databases).',
  frontend: 'You are an expert frontend engineer (React, Next.js, TypeScript, CSS).',
  qa: 'You are a QA engineer. Write thorough tests and identify edge cases.',
  devops: 'You are a DevOps engineer (CI/CD, Docker, Kubernetes, cloud infrastructure).',
  reviewer: 'You are a senior code reviewer. Review for correctness, security, and performance.',
};

// Task-type prompt templates
const TASK_PROMPTS: Record<string, (title: string, desc?: string) => string> = {
  code: (t, d) => `Implement the following:\n\n## ${t}${d ? `\n\n${d}` : ''}\n\nProvide complete, working code.`,
  test: (t, d) => `Write comprehensive tests for:\n\n## ${t}${d ? `\n\n${d}` : ''}\n\nCover edge cases and error scenarios.`,
  review: (t, d) => `Review the following code/feature:\n\n## ${t}${d ? `\n\n${d}` : ''}\n\nProvide specific, actionable feedback.`,
  plan: (t, d) => `Create a detailed implementation plan for:\n\n## ${t}${d ? `\n\n${d}` : ''}\n\nInclude steps, dependencies, and complexity estimates.`,
  fix: (t, d) => `Fix the following issue:\n\n## ${t}${d ? `\n\n${d}` : ''}\n\nDiagnose the root cause and provide a fix.`,
  deploy: (t, d) => `Create deployment configuration for:\n\n## ${t}${d ? `\n\n${d}` : ''}\n\nProvide complete configuration files.`,
};

function buildPrompt(data: TaskJobData): string {
  const parts: string[] = [];

  // Add role context
  if (data.agentRole && ROLE_PROMPTS[data.agentRole]) {
    parts.push(ROLE_PROMPTS[data.agentRole]);
    parts.push('');
  }

  // Add task-specific prompt
  const template = TASK_PROMPTS[data.type] || TASK_PROMPTS['code'];
  parts.push(template(data.title, data.description));

  if (data.priority && data.priority !== 'medium') {
    parts.push(`\nPriority: ${data.priority}`);
  }

  return parts.join('\n');
}

function selectProvider(
  requested?: CliProvider,
  defaultProvider?: string,
  cliTools?: CliAvailability,
): CliProvider {
  // 1. Use explicitly requested provider
  if (requested === 'claude' || requested === 'codex') return requested;

  // 2. Use default from config
  if (defaultProvider === 'claude' || defaultProvider === 'codex') return defaultProvider as CliProvider;

  // 3. Auto-detect: prefer claude, fallback to codex
  if (cliTools) {
    if (cliTools.claude.available) return 'claude';
    if (cliTools.codex.available) return 'codex';
  }

  // 4. Default to claude
  return 'claude';
}

async function setupWorkspace(data: TaskJobData): Promise<string> {
  const workDir = data.projectPath || process.env.CLI_WORK_DIR || process.cwd();

  if (!existsSync(workDir) && data.gitRepo?.url) {
    console.log(`[Workspace] Cloning ${data.gitRepo.url} → ${workDir}`);
    mkdirSync(workDir, { recursive: true });
    execSync(`git clone ${data.gitRepo.url} .`, { cwd: workDir, stdio: 'inherit' });
    const branch = data.gitRepo.developmentBranch || data.gitRepo.productionBranch || 'main';
    try {
      execSync(`git checkout ${branch}`, { cwd: workDir, stdio: 'inherit' });
    } catch {
      console.warn(`[Workspace] Branch "${branch}" not found, staying on default`);
    }
  }

  // Write env files
  if (data.envFiles && existsSync(workDir)) {
    for (const [filename, content] of Object.entries(data.envFiles)) {
      if (content) {
        writeFileSync(join(workDir, filename), content, 'utf-8');
        console.log(`[Workspace] Wrote ${filename}`);
      }
    }
  }

  return workDir;
}

export async function processTask(
  data: TaskJobData,
  cliTools?: CliAvailability,
  onOutput?: (chunk: string, stream: 'stdout' | 'stderr') => void,
): Promise<TaskResult> {
  const defaultProvider = process.env.DEFAULT_CLI_PROVIDER;
  const timeout = parseInt(process.env.CLI_TIMEOUT || '300000', 10);
  const workDir = await setupWorkspace(data);

  const provider = selectProvider(data.provider, defaultProvider, cliTools);
  const prompt = buildPrompt(data);

  console.log(`[Task ${data.taskId}] Executing with ${provider} CLI (type: ${data.type})`);
  console.log(`[Task ${data.taskId}] Work dir: ${workDir}`);

  const result: CliExecutionResult = await executeWithCli({
    provider,
    prompt,
    workDir,
    timeout,
    onOutput,
  });

  console.log(`[Task ${data.taskId}] Finished in ${result.durationMs}ms (exit: ${result.exitCode})`);

  if (result.exitCode !== 0 || result.error) {
    return {
      taskId: data.taskId,
      status: 'failed',
      content: result.content,
      error: result.error || `CLI exited with code ${result.exitCode}`,
      provider,
      durationMs: result.durationMs,
    };
  }

  return {
    taskId: data.taskId,
    status: 'completed',
    content: result.content,
    provider,
    durationMs: result.durationMs,
  };
}
