import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { OrchestratorService } from '../orchestrator/orchestrator.service';
import { InProcessQueueService } from './in-process-queue.service';

@Injectable()
export class TaskExecutionProcessor implements OnModuleInit {
  private readonly logger = new Logger(TaskExecutionProcessor.name);

  constructor(
    private orchestrator: OrchestratorService,
    private queue: InProcessQueueService,
  ) {}

  onModuleInit() {
    this.queue.setProcessor((taskId) => this.process(taskId));
    this.logger.log('Task execution processor registered');
  }

  async process(taskId: string): Promise<any> {
    this.logger.log(`Processing task: ${taskId}`);
    try {
      const result = await this.orchestrator.executeTask(taskId);
      this.logger.log(`Task ${taskId} finished: ${result.status}`);
      return result;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Task ${taskId} processing failed: ${msg}`);
      throw error;
    }
  }
}
