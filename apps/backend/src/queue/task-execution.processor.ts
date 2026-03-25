import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { OrchestratorService } from '../orchestrator/orchestrator.service';

@Processor('task-execution')
export class TaskExecutionProcessor extends WorkerHost {
  private readonly logger = new Logger(TaskExecutionProcessor.name);

  constructor(private orchestrator: OrchestratorService) {
    super();
  }

  async process(job: Job<{ taskId: string }>): Promise<any> {
    const { taskId } = job.data;
    this.logger.log(`Processing task: ${taskId} (job ${job.id})`);

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
