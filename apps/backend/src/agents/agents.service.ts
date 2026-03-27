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

  private parseJsonFields(agent: any) {
    if (!agent) return agent;
    const parse = (v: any) => { try { return typeof v === 'string' ? JSON.parse(v) : v; } catch { return v; } };
    return { ...agent, displayConfig: parse(agent.displayConfig), stats: parse(agent.stats), configJson: parse(agent.configJson) };
  }

  async findAll(status?: string) {
    const where = status ? { status } : {};
    const agents = await this.prisma.agent.findMany({
      where,
      include: { skills: { include: { skill: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return agents.map((a) => ({
      ...this.parseJsonFields(a),
      skills: a.skills.map((as: any) => as.skill),
    }));
  }

  async findOne(id: string) {
    const agent = await this.prisma.agent.findUnique({
      where: { id },
      include: {
        tasks: { take: 10, orderBy: { updatedAt: 'desc' } },
        skills: { include: { skill: true } },
      },
    });
    if (!agent) throw new NotFoundException(`Agent ${id} not found`);
    return {
      ...this.parseJsonFields(agent),
      skills: agent.skills.map((as: any) => as.skill),
    };
  }

  async create(dto: CreateAgentDto) {
    return this.prisma.agent.create({
      data: {
        name: dto.name,
        role: dto.role,
        model: dto.model || 'claude-sonnet-4-20250514',
        department: dto.department || 'backend',
        task: dto.task,
        displayConfig: JSON.stringify(dto.displayConfig || {}),
        stats: JSON.stringify(dto.stats || { tasks: 0, success: '0%', avgTime: '0m', tokPerMin: 0 }),
        configJson: JSON.stringify(dto.configJson || {}),
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
    if (dto.displayConfig !== undefined) data.displayConfig = JSON.stringify(dto.displayConfig);
    if (dto.stats !== undefined) data.stats = JSON.stringify(dto.stats);
    if (dto.configJson !== undefined) data.configJson = JSON.stringify(dto.configJson);

    const updated = await this.prisma.agent.update({ where: { id }, data });
    this.events.emitAgentStatus(updated);
    return updated;
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.agent.delete({ where: { id } });
  }

  async getSkills(agentId: string) {
    await this.findOne(agentId);
    const agentSkills = await this.prisma.agentSkill.findMany({
      where: { agentId },
      include: { skill: true },
    });
    return agentSkills.map((as) => as.skill);
  }

  async setSkills(agentId: string, skillIds: string[]) {
    await this.findOne(agentId);
    // Delete existing
    await this.prisma.agentSkill.deleteMany({ where: { agentId } });
    // Create new
    if (skillIds.length > 0) {
      await this.prisma.agentSkill.createMany({
        data: skillIds.map((skillId) => ({ agentId, skillId })),
      });
    }
    return this.getSkills(agentId);
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
