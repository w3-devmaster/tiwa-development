import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';
import { AiProviderService } from '../ai-provider/ai-provider.service';
import { WorkersService } from '../workers/workers.service';

export interface ServiceStatus {
  name: string;
  label: string;
  status: 'online' | 'degraded' | 'offline';
  details?: string;
  restartable: boolean;
}

@Injectable()
export class ServicesService {
  private readonly logger = new Logger(ServicesService.name);

  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
    private aiProvider: AiProviderService,
    private workers: WorkersService,
  ) {}

  async getAllStatuses(): Promise<ServiceStatus[]> {
    const statuses: ServiceStatus[] = [];

    // API Server
    statuses.push({
      name: 'api',
      label: 'API Server',
      status: 'online',
      details: 'Running',
      restartable: false,
    });

    // Database
    try {
      await this.prisma.$queryRawUnsafe('SELECT 1');
      statuses.push({
        name: 'database',
        label: 'Database',
        status: 'online',
        details: 'Connected',
        restartable: true,
      });
    } catch {
      statuses.push({
        name: 'database',
        label: 'Database',
        status: 'offline',
        details: 'Disconnected',
        restartable: true,
      });
    }

    // WebSocket
    const wsServer = this.eventsGateway.server;
    if (wsServer) {
      const clientCount =
        (wsServer as any).engine?.clientsCount ?? (wsServer.sockets as any)?.size ?? 0;
      statuses.push({
        name: 'websocket',
        label: 'WebSocket',
        status: 'online',
        details: `${clientCount} client${clientCount !== 1 ? 's' : ''}`,
        restartable: true,
      });
    } else {
      statuses.push({
        name: 'websocket',
        label: 'WebSocket',
        status: 'offline',
        details: 'Not initialized',
        restartable: true,
      });
    }

    // AI Provider
    try {
      const providers = this.aiProvider.getAvailableProviders();
      if (providers.length > 0) {
        statuses.push({
          name: 'ai_provider',
          label: 'AI Provider',
          status: 'online',
          details: providers.join(', '),
          restartable: true,
        });
      } else {
        statuses.push({
          name: 'ai_provider',
          label: 'AI Provider',
          status: 'degraded',
          details: 'No providers configured',
          restartable: true,
        });
      }
    } catch {
      statuses.push({
        name: 'ai_provider',
        label: 'AI Provider',
        status: 'offline',
        details: 'Error',
        restartable: true,
      });
    }

    // Workers
    const workerList = this.workers.getWorkers();
    if (workerList.length > 0) {
      statuses.push({
        name: 'workers',
        label: 'Workers',
        status: 'online',
        details: `${workerList.length} active`,
        restartable: true,
      });
    } else {
      statuses.push({
        name: 'workers',
        label: 'Workers',
        status: 'degraded',
        details: 'No workers',
        restartable: true,
      });
    }

    return statuses;
  }

  async restartService(
    name: string,
  ): Promise<{ success: boolean; message: string }> {
    const validServices = [
      'database',
      'websocket',
      'ai_provider',
      'workers',
    ];
    if (!validServices.includes(name)) {
      throw new BadRequestException(`Cannot restart service: ${name}`);
    }

    this.logger.log(`Restarting service: ${name}`);
    this.emitProgress(name, 10, 'Initiating restart...');

    try {
      switch (name) {
        case 'database':
          this.emitProgress(name, 30, 'Disconnecting...');
          await this.prisma.$disconnect();
          this.emitProgress(name, 60, 'Reconnecting...');
          await this.prisma.$connect();
          this.emitProgress(name, 90, 'Verifying...');
          await this.prisma.$queryRawUnsafe('SELECT 1');
          break;

        case 'websocket':
          this.emitProgress(name, 40, 'Disconnecting clients...');
          this.eventsGateway.server?.disconnectSockets(true);
          this.emitProgress(name, 80, 'Reconnecting...');
          // Clients auto-reconnect due to reconnection: true
          break;

        case 'ai_provider':
          this.emitProgress(name, 40, 'Reinitializing providers...');
          await this.aiProvider.reinitialize();
          this.emitProgress(name, 80, 'Verifying...');
          break;

        case 'workers':
          this.emitProgress(name, 40, 'Clearing worker registry...');
          this.workers.clearWorkers();
          this.emitProgress(name, 80, 'Waiting for re-registration...');
          break;
      }

      // Small delay for visual feedback
      await new Promise((r) => setTimeout(r, 300));
      this.emitProgress(name, 100, 'Complete');
      this.logger.log(`Service ${name} restarted successfully`);
      return { success: true, message: `${name} restarted successfully` };
    } catch (error) {
      this.emitProgress(name, 100, 'Failed');
      this.logger.error(`Failed to restart ${name}`, error);
      return {
        success: false,
        message: `Failed to restart ${name}: ${error}`,
      };
    }
  }

  private emitProgress(name: string, progress: number, phase: string) {
    this.eventsGateway.emitServiceRestart({ name, progress, phase });
  }
}
