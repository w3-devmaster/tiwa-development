import { IsString, IsOptional, IsEnum, IsObject } from 'class-validator';

export class CreateAgentDto {
  @IsString()
  name: string;

  @IsEnum(['planner', 'backend', 'frontend', 'qa', 'devops', 'reviewer'])
  role: string;

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
  @IsObject()
  displayConfig?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  stats?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  configJson?: Record<string, unknown>;
}
