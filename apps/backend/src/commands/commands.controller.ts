import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { CommandsService } from './commands.service';
import { CreateCommandDto } from './dto/create-command.dto';
import { UpdateCommandDto } from './dto/update-command.dto';

@Controller('api/commands')
export class CommandsController {
  constructor(private readonly commandsService: CommandsService) {}

  @Get()
  findAll(@Query('projectId') projectId?: string) {
    return this.commandsService.findAll(projectId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.commandsService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateCommandDto) {
    return this.commandsService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCommandDto) {
    return this.commandsService.update(id, dto);
  }

  @Post(':id/analyze')
  analyze(@Param('id') id: string) {
    return this.commandsService.analyze(id);
  }

  @Post(':id/approve')
  approve(@Param('id') id: string) {
    return this.commandsService.approve(id);
  }
}
