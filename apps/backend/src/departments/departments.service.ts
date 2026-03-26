import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';

@Injectable()
export class DepartmentsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.department.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async findOne(id: string) {
    const dept = await this.prisma.department.findUnique({ where: { id } });
    if (!dept) throw new NotFoundException(`Department ${id} not found`);
    return dept;
  }

  async create(dto: CreateDepartmentDto) {
    try {
      return await this.prisma.department.create({
        data: {
          name: dto.name,
          description: dto.description,
          icon: dto.icon ?? '📦',
          color: dto.color ?? '#6c5ce7',
          sortOrder: dto.sortOrder ?? 0,
        },
      });
    } catch (e: any) {
      if (e.code === 'P2002') {
        throw new ConflictException(`Department "${dto.name}" already exists`);
      }
      throw e;
    }
  }

  async update(id: string, dto: UpdateDepartmentDto) {
    await this.findOne(id);
    const data: Record<string, unknown> = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.icon !== undefined) data.icon = dto.icon;
    if (dto.color !== undefined) data.color = dto.color;
    if (dto.sortOrder !== undefined) data.sortOrder = dto.sortOrder;

    try {
      return await this.prisma.department.update({ where: { id }, data });
    } catch (e: any) {
      if (e.code === 'P2002') {
        throw new ConflictException(`Department "${dto.name}" already exists`);
      }
      throw e;
    }
  }

  async remove(id: string) {
    await this.findOne(id);
    // Check if any agents reference this department
    const agentCount = await this.prisma.agent.count({
      where: { department: id },
    });
    // Also check by name
    const dept = await this.prisma.department.findUnique({ where: { id } });
    const agentCountByName = await this.prisma.agent.count({
      where: { department: dept?.name },
    });

    if (agentCount > 0 || agentCountByName > 0) {
      throw new ConflictException(
        `Cannot delete department "${dept?.name}": ${agentCount + agentCountByName} agent(s) are assigned to it. Reassign them first.`,
      );
    }

    return this.prisma.department.delete({ where: { id } });
  }
}
