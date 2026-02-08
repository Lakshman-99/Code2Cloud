import { IsString, IsBoolean, IsInt, IsOptional, Min, Max, IsUrl } from 'class-validator';

export class UpdateSettingsDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  maxConcurrentBuilds?: number;

  @IsOptional()
  @IsInt()
  logRetentionDays?: number;

  @IsOptional()
  @IsBoolean()
  turboMode?: boolean;

  @IsOptional()
  @IsInt()
  globalTTLMinutes?: number;

  @IsOptional()
  @IsBoolean()
  autoDeploy?: boolean;

  @IsOptional()
  @IsString()
  @IsUrl()
  slackWebhook?: string;

  @IsOptional()
  @IsBoolean()
  emailDeployFailed?: boolean;

  @IsOptional()
  @IsBoolean()
  emailDeploySuccess?: boolean;
}