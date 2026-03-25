import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Logger,
  HttpCode,
  Inject,
} from '@nestjs/common';
import { OrchestratorService } from './orchestrator.service';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';
import { IsString, IsOptional, IsEnum } from 'class-validator';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';

class SubmitTaskDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  @IsEnum(['code', 'test', 'review', 'deploy', 'plan', 'fix'])
  type?: string;

  @IsString()
  @IsOptional()
  @IsEnum(['low', 'medium', 'high', 'critical'])
  priority?: string;

  @IsString()
  @IsOptional()
  projectId?: string;
}

@Controller('api/orchestrator')
export class OrchestratorController {
  private readonly logger = new Logger(OrchestratorController.name);

  constructor(
    private orchestrator: OrchestratorService,
    private prisma: PrismaService,
    private events: EventsGateway,
    @InjectQueue('task-execution') private taskQueue: Queue,
  ) {}

  @Post('submit')
  @HttpCode(201)
  async submit(@Body() dto: SubmitTaskDto) {
    this.logger.log(`Submitting task: ${dto.title}`);

    const task = await this.prisma.task.create({
      data: {
        title: dto.title,
        description: dto.description,
        type: dto.type || 'code',
        status: 'queued',
        priority: dto.priority || 'medium',
        projectId: dto.projectId,
      },
      include: { assignedAgent: true },
    });

    await this.taskQueue.add('execute', { taskId: task.id });
    this.events.emitTaskUpdate(task);

    this.logger.log(`Task "${task.title}" queued as ${task.id}`);
    return task;
  }

  @Post('execute/:taskId')
  async execute(@Param('taskId') taskId: string) {
    this.logger.log(`Manually executing task: ${taskId}`);
    return this.orchestrator.executeTask(taskId);
  }

  @Get('status')
  async status() {
    return this.orchestrator.getStatus();
  }
}
