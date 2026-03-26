import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { UpdateWorkflowDto } from './dto/update-workflow.dto';

@Injectable()
export class WorkflowsService {
  constructor(private prisma: PrismaService) {}

  private parseJsonFields(workflow: any) {
    if (!workflow) return workflow;
    const parse = (v: any) => { try { return typeof v === 'string' ? JSON.parse(v) : v; } catch { return v; } };
    return { ...workflow, stepsJson: parse(workflow.stepsJson) };
  }

  async findAll() {
    const workflows = await this.prisma.workflow.findMany({
      include: { project: true },
      orderBy: { updatedAt: 'desc' },
    });
    return workflows.map((w) => this.parseJsonFields(w));
  }

  async findOne(id: string) {
    const workflow = await this.prisma.workflow.findUnique({
      where: { id },
      include: { project: true, tasks: true },
    });
    if (!workflow) throw new NotFoundException(`Workflow ${id} not found`);
    return this.parseJsonFields(workflow);
  }

  async create(dto: CreateWorkflowDto) {
    return this.prisma.workflow.create({
      data: {
        name: dto.name,
        description: dto.description,
        projectId: dto.projectId,
        stepsJson: JSON.stringify(dto.stepsJson || []),
        currentStepIndex: dto.currentStepIndex || 0,
      },
      include: { project: true },
    });
  }

  async update(id: string, dto: UpdateWorkflowDto) {
    await this.findOne(id);
    const data: Record<string, unknown> = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.stepsJson !== undefined) data.stepsJson = JSON.stringify(dto.stepsJson);
    if (dto.currentStepIndex !== undefined) data.currentStepIndex = dto.currentStepIndex;
    if (dto.status !== undefined) {
      data.status = dto.status;
      if (dto.status === 'running') data.startedAt = new Date();
      if (['completed', 'failed', 'cancelled'].includes(dto.status))
        data.completedAt = new Date();
    }
    return this.prisma.workflow.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.workflow.delete({ where: { id } });
  }
}
