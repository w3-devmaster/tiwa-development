import { Controller, Get, Post, Delete, Param, Body, HttpException, HttpStatus } from '@nestjs/common';
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

  @Post()
  addWorker(@Body() body: { host: string; port: number }) {
    if (!body.host || !body.port) {
      throw new HttpException('host and port are required', HttpStatus.BAD_REQUEST);
    }
    return this.workersService.addManualWorker(body.host, body.port);
  }

  @Delete(':id')
  removeWorker(@Param('id') id: string) {
    const deleted = this.workersService.removeWorker(id);
    if (!deleted) throw new HttpException('Worker not found', HttpStatus.NOT_FOUND);
    return { success: true, id };
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
