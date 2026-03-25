import { IsString, IsOptional, IsEnum, IsObject } from 'class-validator';

export class UpdateProjectDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(['active', 'archived', 'paused'])
  status?: string;

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
