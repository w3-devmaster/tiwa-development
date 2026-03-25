import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    private prisma: PrismaService,
    private events: EventsGateway,
    @InjectQueue('task-execution') private taskQueue: Queue,
  ) {}

  async findAll(filters?: {
    status?: string;
    projectId?: string;
    assignedAgentId?: string;
  }) {
    const where: Record<string, unknown> = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.projectId) where.projectId = filters.projectId;
    if (filters?.assignedAgentId) where.assignedAgentId = filters.assignedAgentId;

    return this.prisma.task.findMany({
      where,
      include: { assignedAgent: true },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: { assignedAgent: true, project: true, workflow: true },
    });
    if (!task) throw new NotFoundException(`Task ${id} not found`);
    return task;
  }

  async create(dto: CreateTaskDto) {
    return this.prisma.task.create({
      data: {
        title: dto.title,
        description: dto.description,
        type: dto.type || 'code',
        status: 'pending',
        priority: dto.priority || 'medium',
        assignedAgentId: dto.assignedAgentId,
        projectId: dto.projectId,
        workflowId: dto.workflowId,
        branch: dto.branch,
      },
      include: { assignedAgent: true },
    });
  }

  async update(id: string, dto: UpdateTaskDto) {
    await this.findOne(id);
    const data: Record<string, unknown> = {};

    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.priority !== undefined) data.priority = dto.priority;
    if (dto.assignedAgentId !== undefined) data.assignedAgentId = dto.assignedAgentId;
    if (dto.branch !== undefined) data.branch = dto.branch;
    if (dto.error !== undefined) data.error = dto.error;

    if (dto.status !== undefined) {
      data.status = dto.status;
      if (dto.status === 'in_progress') data.startedAt = new Date();
      if (['completed', 'failed', 'cancelled'].includes(dto.status))
        data.completedAt = new Date();
    }

    const updated = await this.prisma.task.update({
      where: { id },
      data,
      include: { assignedAgent: true },
    });

    // Emit real-time update
    this.events.emitTaskUpdate(updated);

    // Auto-queue for execution when status becomes 'queued'
    if (dto.status === 'queued') {
      this.logger.log(`Task "${updated.title}" queued for execution`);
      await this.taskQueue.add('execute', { taskId: id });
    }

    return updated;
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.task.update({
      where: { id },
      data: { status: 'cancelled' },
    });
  }

  async getBoard() {
    const tasks = await this.prisma.task.findMany({
      include: { assignedAgent: true },
      orderBy: { updatedAt: 'desc' },
    });
    return {
      todo: tasks.filter((t) => t.status === 'pending' || t.status === 'queued'),
      in_progress: tasks.filter((t) => t.status === 'in_progress'),
      review: tasks.filter((t) => t.status === 'review'),
      done: tasks.filter((t) =>
        ['completed', 'failed', 'cancelled'].includes(t.status),
      ),
    };
  }
}
