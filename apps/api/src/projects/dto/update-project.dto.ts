import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { BaseProjectDto } from './base-project.dto';

// PartialType makes all fields from CreateDto optional automatically
export class UpdateProjectDto extends PartialType(BaseProjectDto) {
  @IsOptional()
  @IsBoolean()
  autoDeploy?: boolean;

  @IsOptional()
  @IsString()
  gitBranch?: string;
}