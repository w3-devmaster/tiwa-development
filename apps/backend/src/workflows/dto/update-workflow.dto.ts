import { IsString, IsOptional, IsEnum, IsNumber, IsArray } from 'class-validator';

export class UpdateWorkflowDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(['pending', 'running', 'paused', 'completed', 'failed', 'cancelled'])
  status?: string;

  @IsOptional()
  @IsArray()
  stepsJson?: unknown[];

  @IsOptional()
  @IsNumber()
  currentStepIndex?: number;
}
