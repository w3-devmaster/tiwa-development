import { IsString, IsOptional, IsObject } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  workspacePath?: string;

  @IsOptional()
  @IsObject()
  gitRepoJson?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  metadataJson?: Record<string, unknown>;
}
