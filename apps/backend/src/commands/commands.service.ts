import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiProviderService } from '../ai-provider/ai-provider.service';
import { EventsGateway } from '../events/events.gateway';
import { CreateCommandDto } from './dto/create-command.dto';
import { UpdateCommandDto } from './dto/update-command.dto';

@Injectable()
export class CommandsService {
  private readonly logger = new Logger(CommandsService.name);

  constructor(
    private prisma: PrismaService,
    private aiProvider: AiProviderService,
    private events: EventsGateway,
  ) {}

  private parseJson(command: any) {
    if (!command) return command;
    try {
      if (typeof command.analysisJson === 'string') {
        command = { ...command, analysisJson: JSON.parse(command.analysisJson) };
      }
    } catch { /* keep as-is */ }
    return command;
  }

  async findAll(projectId?: string) {
    const where = projectId ? { projectId } : {};
    const commands = await this.prisma.command.findMany({
      where,
      include: { project: true },
      orderBy: { updatedAt: 'desc' },
    });
    return commands.map((c) => this.parseJson(c));
  }

  async findOne(id: string) {
    const command = await this.prisma.command.findUnique({
      where: { id },
      include: { project: true },
    });
    if (!command) throw new NotFoundException(`Command ${id} not found`);
    return this.parseJson(command);
  }

  async create(dto: CreateCommandDto) {
    // Verify project exists
    const project = await this.prisma.project.findUnique({ where: { id: dto.projectId } });
    if (!project) throw new NotFoundException(`Project ${dto.projectId} not found`);

    return this.prisma.command.create({
      data: {
        projectId: dto.projectId,
        instruction: dto.instruction,
        status: 'draft',
      },
      include: { project: true },
    });
  }

  async update(id: string, dto: UpdateCommandDto) {
    await this.findOne(id);
    const data: Record<string, unknown> = {};
    if (dto.instruction !== undefined) data.instruction = dto.instruction;
    if (dto.status !== undefined) data.status = dto.status;
    return this.prisma.command.update({
      where: { id },
      data,
      include: { project: true },
    });
  }

  async analyze(id: string) {
    const command = await this.findOne(id);

    // Update status to analyzing
    await this.prisma.command.update({
      where: { id },
      data: { status: 'analyzing' },
    });

    try {
      // Find a planner agent for context
      const plannerAgent = await this.prisma.agent.findFirst({
        where: { role: { in: ['planner', 'backend'] }, status: 'idle' },
        orderBy: { lastActiveAt: 'asc' },
      });

      const systemPrompt = `You are an AI project planner. You analyze requirements and break them down into concrete, actionable tasks.

Your output should be a structured plan in Markdown format with:
1. **Summary** - Brief overview of what needs to be done
2. **Tasks** - A numbered list of specific tasks, each with:
   - Task title
   - Task type (code/test/review/deploy/plan/fix)
   - Priority (low/medium/high/critical)
   - Description of what needs to be done
3. **Dependencies** - Any dependencies between tasks
4. **Estimated Complexity** - Overall assessment

Be specific and actionable. Each task should be something a single developer/agent can complete.`;

      const projectContext = command.project
        ? `\n\n**Project:** ${command.project.name}\n**Description:** ${command.project.description || 'N/A'}`
        : '';

      const userMessage = `Please analyze the following instruction and create an execution plan:${projectContext}\n\n---\n\n${command.instruction}`;

      const model = plannerAgent?.model || 'claude-sonnet-4-20250514';

      this.logger.log(`Analyzing command "${id}" with model ${model}`);

      const response = await this.aiProvider.chat({
        model,
        systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
        maxTokens: 4096,
      });

      const analysis = {
        content: response.content,
        model: response.model,
        provider: response.provider,
        usage: response.usage,
      };

      const updated = await this.prisma.command.update({
        where: { id },
        data: {
          status: 'planned',
          analysisJson: JSON.stringify(analysis),
        },
        include: { project: true },
      });

      return this.parseJson(updated);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Analysis failed';
      this.logger.error(`Command analysis failed: ${errMsg}`);

      await this.prisma.command.update({
        where: { id },
        data: {
          status: 'draft',
          analysisJson: JSON.stringify({ error: errMsg }),
        },
      });

      throw error;
    }
  }

  async approve(id: string) {
    const command = await this.findOne(id);
    if (command.status !== 'planned') {
      throw new Error('Command must be in "planned" status to approve');
    }

    // Update status to approved
    const updated = await this.prisma.command.update({
      where: { id },
      data: { status: 'approved' },
      include: { project: true },
    });

    // Create a task from the command instruction
    const task = await this.prisma.task.create({
      data: {
        title: `[Command] ${command.instruction.slice(0, 80)}`,
        description: command.instruction,
        type: 'plan',
        status: 'pending',
        priority: 'high',
        projectId: command.projectId,
      },
    });

    this.events.emitTaskUpdate(task);

    // Update command to dispatched
    await this.prisma.command.update({
      where: { id },
      data: { status: 'dispatched' },
    });

    return this.parseJson(updated);
  }
}
