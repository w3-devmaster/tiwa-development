import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TaskExecutionProcessor } from './task-execution.processor';
import { OrchestratorModule } from '../orchestrator/orchestrator.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'task-execution' }),
    OrchestratorModule,
  ],
  providers: [TaskExecutionProcessor],
})
export class QueueModule {}
