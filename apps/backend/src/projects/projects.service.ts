import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  private parseJsonFields(project: any) {
    if (!project) return project;
    const parse = (v: any) => { try { return typeof v === 'string' ? JSON.parse(v) : v; } catch { return v; } };
    return { ...project, gitRepoJson: parse(project.gitRepoJson), metadataJson: parse(project.metadataJson) };
  }

  async findAll() {
    const projects = await this.prisma.project.findMany({
      include: { _count: { select: { tasks: true, workflows: true } } },
      orderBy: { updatedAt: 'desc' },
    });
    return projects.map((p) => this.parseJsonFields(p));
  }

  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        tasks: { take: 20, orderBy: { updatedAt: 'desc' } },
        workflows: { orderBy: { updatedAt: 'desc' } },
      },
    });
    if (!project) throw new NotFoundException(`Project ${id} not found`);
    return this.parseJsonFields(project);
  }

  async create(dto: CreateProjectDto) {
    return this.prisma.project.create({
      data: {
        name: dto.name,
        description: dto.description,
        workspacePath: dto.workspacePath,
        gitRepoJson: JSON.stringify(dto.gitRepoJson || {}),
      },
    });
  }

  async update(id: string, dto: UpdateProjectDto) {
    await this.findOne(id);
    const data: Record<string, unknown> = { ...dto };
    if (dto.gitRepoJson !== undefined) data.gitRepoJson = JSON.stringify(dto.gitRepoJson);
    if (dto.metadataJson !== undefined) data.metadataJson = JSON.stringify(dto.metadataJson);
    return this.prisma.project.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.project.delete({ where: { id } });
  }
}
