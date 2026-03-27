import { IsString, IsOptional } from 'class-validator';

export class UpdateCommandDto {
  @IsOptional()
  @IsString()
  instruction?: string;

  @IsOptional()
  @IsString()
  status?: string;
}
