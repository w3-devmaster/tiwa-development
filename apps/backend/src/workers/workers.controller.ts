import { Controller, Get, Post, Param, Body, HttpException, HttpStatus } from '@nestjs/common';
import { WorkersService, HeartbeatDto } from './workers.service';

@Controller('api/workers')
export class WorkersController {
  constructor(private readonly workersService: WorkersService) {}

  @Post('heartbeat')
  heartbeat(@Body() dto: HeartbeatDto) {
    return this.workersService.handleHeartbeat(dto);
  }

  @Get()
  listWorkers() {
    return this.workersService.getWorkers();
  }

  @Get(':id')
  getWorker(@Param('id') id: string) {
    const worker = this.workersService.getWorker(id);
    if (!worker) throw new HttpException('Worker not found', HttpStatus.NOT_FOUND);
    return worker;
  }

  @Post(':id/agent')
  async sendAgentCommand(
    @Param('id') id: string,
    @Body() body: { action: string; agentId: string; config?: any },
  ) {
    try {
      return await this.workersService.sendCommandToWorker(id, '/agent/update', body);
    } catch (error) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Failed to send command',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  @Post('broadcast/agent')
  async broadcastAgentCommand(@Body() body: { action: string; agentId: string; config?: any }) {
    return this.workersService.broadcastToWorkers('/agent/update', body);
  }
}
