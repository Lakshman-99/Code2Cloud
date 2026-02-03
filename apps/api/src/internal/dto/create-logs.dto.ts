import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { LogSource } from 'generated/prisma/enums';

export class LogEntryDto {
  @IsEnum(LogSource)
  @IsNotEmpty()
  source: LogSource;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsOptional()
  @IsString()
  timestamp?: string;
}

export class CreateLogsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LogEntryDto)
  logs: LogEntryDto[];
}
