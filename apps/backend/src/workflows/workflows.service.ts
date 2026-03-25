import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { UpdateWorkflowDto } from './dto/update-workflow.dto';

@Injectable()
export class WorkflowsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.workflow.findMany({
      include: { project: true },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const workflow = await this.prisma.workflow.findUnique({
      where: { id },
      include: { project: true, tasks: true },
    });
    if (!workflow) throw new NotFoundException(`Workflow ${id} not found`);
    return workflow;
  }

  async create(dto: CreateWorkflowDto) {
    return this.prisma.workflow.create({
      data: {
        name: dto.name,
        description: dto.description,
        projectId: dto.projectId,
        stepsJson: (dto.stepsJson as any) || [],
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
    if (dto.stepsJson !== undefined) data.stepsJson = dto.stepsJson;
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
