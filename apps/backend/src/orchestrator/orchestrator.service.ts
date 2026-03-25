import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiProviderService } from '../ai-provider/ai-provider.service';
import { EventsGateway } from '../events/events.gateway';

const ROLE_MAP: Record<string, string[]> = {
  code: ['backend', 'frontend'],
  test: ['qa'],
  review: ['reviewer', 'qa'],
  deploy: ['devops'],
  plan: ['planner', 'backend'],
  fix: ['backend', 'frontend'],
};

const DEFAULT_SYSTEM_PROMPTS: Record<string, string> = {
  planner:
    'You are an AI project planner. You analyze requirements and break them down into concrete, actionable tasks. Output structured plans with clear steps, dependencies, and estimated complexity.',
  backend:
    'You are an expert backend engineer specializing in Node.js, NestJS, TypeScript, databases, and APIs. Write clean, well-structured code. Explain your approach briefly before writing code.',
  frontend:
    'You are an expert frontend engineer specializing in React, Next.js, TypeScript, and modern CSS. Write clean, accessible, and performant UI code. Explain your approach briefly.',
  qa: 'You are a QA engineer. Write thorough test cases, identify edge cases, and create test plans. When reviewing code, look for bugs, security issues, and performance problems.',
  devops:
    'You are a DevOps engineer specializing in CI/CD, Docker, Kubernetes, and cloud infrastructure. Provide deployment strategies, configuration files, and infrastructure code.',
  reviewer:
    'You are a senior code reviewer. Review code for correctness, security, performance, and maintainability. Provide specific, actionable feedback with code suggestions.',
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
      // Build prompt
      const systemPrompt = this.buildSystemPrompt(agent);
      const userMessage = this.buildUserMessage(task);

      this.logger.log(
        `Executing task "${task.title}" with agent ${agent.name} (${agent.model})`,
      );

      // Call AI
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
          resultJson: {
            content: response.content,
            model: response.model,
            provider: response.provider,
            usage: response.usage,
            finishReason: response.finishReason,
          },
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

      this.logger.log(`Task "${task.title}" completed successfully`);

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
    const config = (agent.configJson || {}) as Record<string, any>;
    if (config.systemPrompt) return config.systemPrompt;
    return (
      DEFAULT_SYSTEM_PROMPTS[agent.role] ||
      DEFAULT_SYSTEM_PROMPTS['backend']
    );
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
