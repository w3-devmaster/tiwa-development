import { Global, Module, forwardRef } from '@nestjs/common';
import { InProcessQueueService } from './in-process-queue.service';
import { TaskExecutionProcessor } from './task-execution.processor';
import { OrchestratorModule } from '../orchestrator/orchestrator.module';

@Global()
@Module({
  imports: [forwardRef(() => OrchestratorModule)],
  providers: [InProcessQueueService, TaskExecutionProcessor],
  exports: [InProcessQueueService],
})
export class QueueModule {}
