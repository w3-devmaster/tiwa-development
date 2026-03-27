import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { EventsModule } from './events/events.module';
import { WorkersModule } from './workers/workers.module';
import { DepartmentsModule } from './departments/departments.module';
import { AgentsModule } from './agents/agents.module';
import { TasksModule } from './tasks/tasks.module';
import { ProjectsModule } from './projects/projects.module';
import { WorkflowsModule } from './workflows/workflows.module';
import { LogsModule } from './logs/logs.module';
import { AiProviderModule } from './ai-provider/ai-provider.module';
import { SettingsModule } from './settings/settings.module';
import { OrchestratorModule } from './orchestrator/orchestrator.module';
import { QueueModule } from './queue/queue.module';
import { SkillsModule } from './skills/skills.module';
import { CommandsModule } from './commands/commands.module';
import { ServicesModule } from './services/services.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    PrismaModule,
    EventsModule,
    SettingsModule,
    AiProviderModule,
    WorkersModule,
    DepartmentsModule,
    AgentsModule,
    TasksModule,
    ProjectsModule,
    WorkflowsModule,
    LogsModule,
    OrchestratorModule,
    QueueModule,
    SkillsModule,
    CommandsModule,
    ServicesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
