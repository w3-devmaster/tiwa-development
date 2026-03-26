import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Logger,
  HttpCode,
} from '@nestjs/common';
import { OrchestratorService } from './orchestrator.service';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';
import { InProcessQueueService } from '../queue/in-process-queue.service';
import { AiProviderService } from '../ai-provider/ai-provider.service';
import { IsString, IsOptional, IsEnum, IsNumber } from 'class-validator';

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

class WorkerResultDto {
  @IsString()
  workerId: string;

  @IsString()
  taskId: string;

  @IsString()
  @IsEnum(['completed', 'failed'])
  status: string;

  @IsString()
  content: string;

  @IsString()
  @IsOptional()
  error?: string;

  @IsString()
  @IsOptional()
  provider?: string;

  @IsNumber()
  @IsOptional()
  durationMs?: number;
}

class TestAgentDto {
  @IsString()
  provider: string;

  @IsString()
  model: string;

  @IsString()
  systemPrompt: string;

  @IsString()
  @IsOptional()
  testMessage?: string;
}

@Controller('api/orchestrator')
export class OrchestratorController {
  private readonly logger = new Logger(OrchestratorController.name);

  constructor(
    private orchestrator: OrchestratorService,
    private prisma: PrismaService,
    private events: EventsGateway,
    private inProcessQueue: InProcessQueueService,
    private aiProvider: AiProviderService,
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

    await this.inProcessQueue.add(task.id);
    this.events.emitTaskUpdate(task);

    this.logger.log(`Task "${task.title}" queued as ${task.id}`);
    return task;
  }

  @Post('execute/:taskId')
  async execute(@Param('taskId') taskId: string) {
    this.logger.log(`Manually executing task: ${taskId}`);
    return this.orchestrator.executeTask(taskId);
  }

  @Post('worker-result')
  @HttpCode(200)
  async workerResult(@Body() dto: WorkerResultDto) {
    this.logger.log(`Worker result received for task ${dto.taskId}: ${dto.status}`);
    return this.orchestrator.handleWorkerResult({
      workerId: dto.workerId,
      taskId: dto.taskId,
      status: dto.status as 'completed' | 'failed',
      content: dto.content,
      error: dto.error,
      provider: dto.provider || 'unknown',
      durationMs: dto.durationMs || 0,
    });
  }

  @Post('test-agent')
  @HttpCode(200)
  async testAgent(@Body() dto: TestAgentDto) {
    this.logger.log(`Testing agent: provider=${dto.provider}, model=${dto.model}`);
    const message = dto.testMessage || 'สวัสดี แนะนำตัวเองหน่อย';

    try {
      await this.aiProvider.reinitialize();
      const response = await this.aiProvider.chat({
        model: dto.model,
        systemPrompt: dto.systemPrompt,
        messages: [{ role: 'user', content: message }],
        maxTokens: 1024,
      });

      return {
        success: true,
        response: response.content,
        model: response.model,
        provider: response.provider,
        usage: response.usage,
      };
    } catch (error: any) {
      this.logger.error(`Test agent failed: ${error.message}`);
      return {
        success: false,
        error: error.message || 'Unknown error occurred',
        provider: dto.provider,
        model: dto.model,
      };
    }
  }

  @Get('status')
  async status() {
    return this.orchestrator.getStatus();
  }
}
