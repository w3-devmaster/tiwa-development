import { IsString } from 'class-validator';

export class CreateCommandDto {
  @IsString()
  projectId: string;

  @IsString()
  instruction: string;
}
