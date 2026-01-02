import { IsString, IsNotEmpty, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { BaseProjectDto } from './base-project.dto';

class EnvVarDto {
  @IsString()
  @IsNotEmpty()
  key: string;

  @IsString()
  value: string;
}

export class CreateProjectDto extends BaseProjectDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EnvVarDto)
  @IsOptional()
  envVars?: EnvVarDto[];
}