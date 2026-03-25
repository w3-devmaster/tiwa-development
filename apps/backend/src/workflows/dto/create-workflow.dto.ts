import { IsString, IsOptional, IsNumber, IsArray } from 'class-validator';

export class CreateWorkflowDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  projectId: string;

  @IsOptional()
  @IsArray()
  stepsJson?: unknown[];

  @IsOptional()
  @IsNumber()
  currentStepIndex?: number;
}
