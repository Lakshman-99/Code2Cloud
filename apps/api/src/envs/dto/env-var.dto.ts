import { Type } from 'class-transformer';
import { IsString, IsNotEmpty, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { EnvironmentType } from 'generated/prisma/enums';

export class EnvVarItemDto {
  @IsString()
  @IsNotEmpty()
  key: string;

  @IsString()
  value: string;

  @IsArray()
  @IsEnum(EnvironmentType, { each: true })
  targets: EnvironmentType[];
}

export class SaveEnvVarsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EnvVarItemDto)
  variables: EnvVarItemDto[];
}