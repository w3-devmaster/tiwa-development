import { Injectable, Logger, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiProviderService } from '../ai-provider/ai-provider.service';
import { EventsGateway } from '../events/events.gateway';
import { WorkersService } from '../workers/workers.service';
import { WorkflowsService } from '../workflows/workflows.service';

const ROLE_MAP: Record<string, string[]> = {
  plan: ['planner'],
  design: ['architect'],
  code: ['builder'],
  test: ['tester'],
  review: ['reviewer'],
  deploy: ['devops'],
  fix: ['builder'],
};

export const DEFAULT_SYSTEM_PROMPTS: Record<string, string> = {
  planner: `Role:
You are a senior product planner.

Responsibility:
Break requirement into clear implementation tasks.

Input:
- User requirement
- Business rules

Output:
JSON:
{
  "tasks": [
    {
      "id": "task-1",
      "title": "...",
      "description": "...",
      "target_role": "backend",
      "acceptance_criteria": [],
      "files_expected": []
    }
  ]
}

Rules:
- Do not write code
- Must include edge cases
- Must include acceptance criteria`,

  architect: `Role:
You are a senior system architect.

Responsibility:
Design schema and module structure.

Input:
- Tasks from planner

Output:
{
  "schema": "...",
  "modules": [],
  "api_contract": []
}

Rules:
- Do not implement code
- Focus on structure and design`,

  builder: `Role:
You are a senior full-stack developer (NestJS + React/Next.js).

Responsibility:
Implement backend and frontend code based on given design.

Input:
- Task
- Schema
- API contract
- UI spec (if applicable)

Output:
{
  "status": "done",
  "changed_files": [],
  "summary": "...",
  "next_action": "test"
}

Rules:
- Follow NestJS + Prisma best practices for backend
- Follow React/Next.js best practices for frontend
- Do not change schema unless instructed
- Must handle edge cases
- Must handle loading, error, empty states for UI
- Must follow design system`,

  tester: `Role:
You are a QA engineer.

Responsibility:
Validate functionality using real tests.

Input:
- Codebase
- Acceptance criteria

Output:
{
  "status": "passed" | "failed",
  "issues": [],
  "failed_steps": []
}

Rules:
- Must run real commands (test/build)
- Do not assume correctness
- Report exact failure`,

  reviewer: `Role:
You are a senior code reviewer.

Responsibility:
Check correctness against requirements.

Input:
- Code changes
- Test results
- Acceptance criteria

Output:
{
  "status": "approved" | "needs_revision",
  "issues": [],
  "coverage_score": 0-100
}

Rules:
- Must verify requirement coverage
- Must identify missing logic
- Do not approve incomplete work`,

  devops: `Role:
You are a DevOps engineer.

Responsibility:
Prepare deployment environment.

Input:
- Code
- Environment config

Output:
{
  "status": "ready",
  "docker": "...",
  "commands": []
}

Rules:
- Must ensure reproducibility
- Must validate environment variables`,
};

export interface ExecutionResult {
  taskId: string;
  agentId: string;
  status: 'completed' | 'failed';
  content: string;
  usage?: { inputTokens: number; outputTokens: number };
  error?: string;
}

@Injectable()
export class OrchestratorService {
  private readonly logger = new Logger(OrchestratorService.name);

  constructor(
    private prisma: PrismaService,
    private aiProvider: AiProviderService,
    private events: EventsGateway,
    private workersService: WorkersService,
    @Inject(forwardRef(() => WorkflowsService))
    private workflowsService: WorkflowsService,
  ) {}

  async executeTask(taskId: string): Promise<ExecutionResult> {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: { assignedAgent: true, project: true },
    });

    if (!task) throw new NotFoundException(`Task ${taskId} not found`);

    // Select agent if not assigned
    const agent = task.assignedAgent ?? await (async () => {
      const selected = await this.selectAgent(task.type);
      await this.prisma.task.update({
        where: { id: taskId },
        data: { assignedAgentId: selected.id },
      });
      return selected;
    })();

    // Update agent to working status
    await this.prisma.agent.update({
      where: { id: agent.id },
      data: {
        status: 'working',
        task: task.title,
        lastActiveAt: new Date(),
      },
    });
    this.events.emitAgentStatus({
      id: agent.id,
      status: 'working',
      task: task.title,
    });

    // Update task to in_progress
    await this.prisma.task.update({
      where: { id: taskId },
      data: { status: 'in_progress', startedAt: new Date() },
    });
    this.events.emitTaskUpdate({ id: taskId, status: 'in_progress', assignedAgentId: agent.id });

    try {
      // Check if a worker with CLI tools is available
      const worker = this.getAvailableWorker();
      if (worker) {
        this.logger.log(
          `Dispatching task "${task.title}" to worker ${worker.id} (CLI mode)`,
        );
        await this.dispatchToWorker(worker, task, agent);
        return {
          taskId,
          agentId: agent.id,
          status: 'completed',
          content: `Dispatched to worker ${worker.id} for CLI execution`,
        };
      }

      // Fallback: use AI API directly
      const systemPrompt = this.buildSystemPrompt(agent);
      const userMessage = this.buildUserMessage(task);

      this.logger.log(
        `Executing task "${task.title}" with agent ${agent.name} (${agent.model}) via API`,
      );

      const response = await this.aiProvider.chat({
        model: agent.model,
        systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
        maxTokens: 4096,
      });

      // Update task as completed
      const updatedTask = await this.prisma.task.update({
        where: { id: taskId },
        data: {
          status: 'completed',
          completedAt: new Date(),
          resultJson: JSON.stringify({
            content: response.content,
            model: response.model,
            provider: response.provider,
            usage: response.usage,
            finishReason: response.finishReason,
            executionMode: 'api',
          }),
        },
        include: { assignedAgent: true },
      });

      // Update agent back to idle
      await this.prisma.agent.update({
        where: { id: agent.id },
        data: { status: 'idle', task: null, lastActiveAt: new Date() },
      });

      this.events.emitTaskUpdate(updatedTask);
      this.events.emitAgentStatus({ id: agent.id, status: 'idle', task: null });

      this.logger.log(`Task "${task.title}" completed successfully via API`);

      // Advance workflow if task belongs to one
      if (task.workflowId) {
        await this.workflowsService.advanceStep(task.workflowId, response.content);
      }

      return {
        taskId,
        agentId: agent.id,
        status: 'completed',
        content: response.content,
        usage: response.usage,
      };
    } catch (error) {
      const errMsg =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Task "${task.title}" failed: ${errMsg}`);

      // Update task as failed
      const updatedTask = await this.prisma.task.update({
        where: { id: taskId },
        data: {
          status: 'failed',
          error: errMsg,
          completedAt: new Date(),
          retryCount: { increment: 1 },
        },
        include: { assignedAgent: true },
      });

      // Update agent to error then idle
      await this.prisma.agent.update({
        where: { id: agent.id },
        data: { status: 'error', task: `Error: ${errMsg}`, lastActiveAt: new Date() },
      });
      this.events.emitAgentStatus({
        id: agent.id,
        status: 'error',
        task: `Error: ${errMsg}`,
      });

      this.events.emitTaskUpdate(updatedTask);

      // Reset agent to idle after a short delay
      setTimeout(async () => {
        try {
          await this.prisma.agent.update({
            where: { id: agent!.id },
            data: { status: 'idle', task: null },
          });
          this.events.emitAgentStatus({
            id: agent!.id,
            status: 'idle',
            task: null,
          });
        } catch {
          // ignore cleanup errors
        }
      }, 5000);

      return {
        taskId,
        agentId: agent.id,
        status: 'failed',
        content: '',
        error: errMsg,
      };
    }
  }

  async selectAgent(taskType: string): Promise<any> {
    const preferredRoles = ROLE_MAP[taskType] || ['backend'];

    // Try to find an idle agent with a matching role
    for (const role of preferredRoles) {
      const agent = await this.prisma.agent.findFirst({
        where: { role, status: 'idle' },
        orderBy: { lastActiveAt: 'asc' },
      });
      if (agent) return agent;
    }

    // Fallback: any idle agent
    const anyIdle = await this.prisma.agent.findFirst({
      where: { status: 'idle' },
      orderBy: { lastActiveAt: 'asc' },
    });
    if (anyIdle) return anyIdle;

    // Fallback: least recently active agent
    const leastActive = await this.prisma.agent.findFirst({
      where: { status: { not: 'offline' } },
      orderBy: { lastActiveAt: 'asc' },
    });
    if (leastActive) return leastActive;

    throw new Error('No available agents');
  }

  private buildSystemPrompt(agent: any): string {
    const raw = agent.configJson || '{}';
    const config = (typeof raw === 'string' ? JSON.parse(raw) : raw) as Record<string, any>;

    // Department prompt = ALWAYS loaded as base
    const deptKey = (agent.department || agent.role || 'builder').toLowerCase();
    const deptPrompt = DEFAULT_SYSTEM_PROMPTS[deptKey] || DEFAULT_SYSTEM_PROMPTS['builder'];

    // Agent's custom prompt = additional identity (appended if exists)
    const agentPrompt = config.systemPrompt?.trim();
    if (agentPrompt) {
      return `${deptPrompt}\n\n---\n\n## Agent Identity\n${agentPrompt}`;
    }
    return deptPrompt;
  }

  private buildUserMessage(task: any): string {
    const parts: string[] = [];

    parts.push(`## Task: ${task.title}`);
    if (task.description) parts.push(`\n${task.description}`);
    parts.push(`\n**Type:** ${task.type}`);
    parts.push(`**Priority:** ${task.priority}`);

    if (task.project) {
      parts.push(`**Project:** ${task.project.name}`);
      if (task.project.description) {
        parts.push(`**Project Description:** ${task.project.description}`);
      }
    }

    parts.push(
      '\nPlease provide a clear, complete response for this task.',
    );

    return parts.join('\n');
  }

  // ========== Worker CLI Integration ==========

  private getAvailableWorker(): { id: string; host: string; port: number } | null {
    const workers = this.workersService.getWorkers();
    // Find an active/idle worker
    const available = workers.find((w) => w.status === 'idle' || w.status === 'active');
    return available ? { id: available.id, host: available.host, port: available.port } : null;
  }

  private async dispatchToWorker(
    worker: { id: string; host: string; port: number },
    task: any,
    agent: any,
  ): Promise<void> {
    const url = `http://${worker.host}:${worker.port}/agent/assign`;
    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: task.id,
          type: task.type,
          title: task.title,
          description: task.description,
          agentRole: agent.role,
          priority: task.priority,
          projectPath: task.project?.workspacePath,
          gitRepo: (() => { try { return typeof task.project?.gitRepoJson === 'string' ? JSON.parse(task.project.gitRepoJson) : task.project?.gitRepoJson; } catch { return undefined; } })(),
          envFiles: (() => { try { const meta = typeof task.project?.metadataJson === 'string' ? JSON.parse(task.project.metadataJson) : task.project?.metadataJson; return meta?.envFiles; } catch { return undefined; } })(),
        }),
        signal: AbortSignal.timeout(5000),
      });
    } catch (err) {
      this.logger.error(`Failed to dispatch to worker ${worker.id}: ${err}`);
      throw new Error(`Worker dispatch failed: ${(err as Error).message}`);
    }
  }

  async handleWorkerResult(result: {
    workerId: string;
    taskId: string;
    status: 'completed' | 'failed';
    content: string;
    error?: string;
    provider: string;
    durationMs: number;
  }): Promise<{ success: boolean }> {
    const task = await this.prisma.task.findUnique({
      where: { id: result.taskId },
      include: { assignedAgent: true },
    });
    if (!task) {
      this.logger.warn(`Worker result for unknown task: ${result.taskId}`);
      return { success: false };
    }

    if (result.status === 'completed') {
      const updatedTask = await this.prisma.task.update({
        where: { id: result.taskId },
        data: {
          status: 'completed',
          completedAt: new Date(),
          resultJson: JSON.stringify({
            content: result.content,
            provider: result.provider,
            executionMode: 'cli',
            durationMs: result.durationMs,
            workerId: result.workerId,
          }),
        },
        include: { assignedAgent: true },
      });
      this.events.emitTaskUpdate(updatedTask);
      this.logger.log(`Task "${task.title}" completed via worker ${result.workerId} (${result.provider} CLI)`);

      // Advance workflow if task belongs to one
      if (task.workflowId) {
        await this.workflowsService.advanceStep(task.workflowId, result.content);
      }
    } else {
      const updatedTask = await this.prisma.task.update({
        where: { id: result.taskId },
        data: {
          status: 'failed',
          error: result.error,
          completedAt: new Date(),
          retryCount: { increment: 1 },
        },
        include: { assignedAgent: true },
      });
      this.events.emitTaskUpdate(updatedTask);
      this.logger.error(`Task "${task.title}" failed via worker: ${result.error}`);
    }

    // Reset assigned agent to idle
    if (task.assignedAgent) {
      await this.prisma.agent.update({
        where: { id: task.assignedAgent.id },
        data: { status: 'idle', task: null, lastActiveAt: new Date() },
      });
      this.events.emitAgentStatus({
        id: task.assignedAgent.id,
        status: 'idle',
        task: null,
      });
    }

    return { success: true };
  }

  async getStatus() {
    const [totalAgents, idleAgents, workingAgents, pendingTasks, queuedTasks, inProgressTasks] =
      await Promise.all([
        this.prisma.agent.count(),
        this.prisma.agent.count({ where: { status: 'idle' } }),
        this.prisma.agent.count({
          where: { status: { in: ['working', 'thinking', 'busy'] } },
        }),
        this.prisma.task.count({ where: { status: 'pending' } }),
        this.prisma.task.count({ where: { status: 'queued' } }),
        this.prisma.task.count({ where: { status: 'in_progress' } }),
      ]);

    return {
      agents: { total: totalAgents, idle: idleAgents, working: workingAgents },
      tasks: { pending: pendingTasks, queued: queuedTasks, inProgress: inProgressTasks },
      providers: this.aiProvider.getAvailableProviders(),
    };
  }
}
