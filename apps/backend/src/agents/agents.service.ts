import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';

@Injectable()
export class AgentsService {
  constructor(
    private prisma: PrismaService,
    private events: EventsGateway,
  ) {}

  async findAll(status?: string) {
    const where = status ? { status } : {};
    return this.prisma.agent.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  async findOne(id: string) {
    const agent = await this.prisma.agent.findUnique({
      where: { id },
      include: { tasks: { take: 10, orderBy: { updatedAt: 'desc' } } },
    });
    if (!agent) throw new NotFoundException(`Agent ${id} not found`);
    return agent;
  }

  async create(dto: CreateAgentDto) {
    return this.prisma.agent.create({
      data: {
        name: dto.name,
        role: dto.role,
        model: dto.model || 'claude-sonnet-4-20250514',
        department: dto.department || 'backend',
        task: dto.task,
        displayConfig: (dto.displayConfig || {}) as any,
        stats: (dto.stats || { tasks: 0, success: '0%', avgTime: '0m', tokPerMin: 0 }) as any,
        configJson: (dto.configJson || {}) as any,
      },
    });
  }

  async update(id: string, dto: UpdateAgentDto) {
    await this.findOne(id);
    const data: Record<string, unknown> = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.role !== undefined) data.role = dto.role;
    if (dto.model !== undefined) data.model = dto.model;
    if (dto.department !== undefined) data.department = dto.department;
    if (dto.task !== undefined) data.task = dto.task;
    if (dto.status !== undefined) {
      data.status = dto.status;
      data.lastActiveAt = new Date();
    }
    if (dto.displayConfig !== undefined) data.displayConfig = dto.displayConfig;
    if (dto.stats !== undefined) data.stats = dto.stats;
    if (dto.configJson !== undefined) data.configJson = dto.configJson;

    const updated = await this.prisma.agent.update({ where: { id }, data });
    this.events.emitAgentStatus(updated);
    return updated;
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.agent.delete({ where: { id } });
  }

  async getStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [activeAgents, totalTasks, completedToday, errors] =
      await Promise.all([
        this.prisma.agent.count({
          where: { status: { in: ['working', 'thinking', 'busy'] } },
        }),
        this.prisma.task.count({
          where: { status: 'in_progress' },
        }),
        this.prisma.task.count({
          where: { status: 'completed', completedAt: { gte: today } },
        }),
        this.prisma.agent.count({
          where: { status: 'error' },
        }),
      ]);

    return { activeAgents, totalTasks, completedToday, errors };
  }
}
