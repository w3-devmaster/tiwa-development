import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSkillDto } from './dto/create-skill.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';

@Injectable()
export class SkillsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.skill.findMany({
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const skill = await this.prisma.skill.findUnique({ where: { id } });
    if (!skill) throw new NotFoundException(`Skill ${id} not found`);
    return skill;
  }

  async create(dto: CreateSkillDto) {
    try {
      return await this.prisma.skill.create({
        data: { name: dto.name, content: dto.content ?? '' },
      });
    } catch (e: any) {
      if (e.code === 'P2002') {
        throw new ConflictException(`Skill "${dto.name}" already exists`);
      }
      throw e;
    }
  }

  async update(id: string, dto: UpdateSkillDto) {
    await this.findOne(id);
    const data: Record<string, unknown> = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.content !== undefined) data.content = dto.content;

    try {
      return await this.prisma.skill.update({ where: { id }, data });
    } catch (e: any) {
      if (e.code === 'P2002') {
        throw new ConflictException(`Skill "${dto.name}" already exists`);
      }
      throw e;
    }
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.skill.delete({ where: { id } });
  }
}
