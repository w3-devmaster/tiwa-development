import { Controller, Get, Post, Param } from '@nestjs/common';
import { ServicesService } from './services.service';

@Controller('api/services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get('status')
  getStatuses() {
    return this.servicesService.getAllStatuses();
  }

  @Post(':name/restart')
  restart(@Param('name') name: string) {
    return this.servicesService.restartService(name);
  }
}
