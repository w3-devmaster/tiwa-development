import { IsString, IsOptional, IsEnum, IsObject } from 'class-validator';

export class UpdateAgentDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(['planner', 'backend', 'frontend', 'qa', 'devops', 'reviewer'])
  role?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  task?: string;

  @IsOptional()
  @IsEnum(['idle', 'busy', 'working', 'thinking', 'error', 'offline'])
  status?: string;

  @IsOptional()
  @IsObject()
  displayConfig?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  stats?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  configJson?: Record<string, unknown>;
}
