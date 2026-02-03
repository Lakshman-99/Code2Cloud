import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { DeploymentStatus } from 'generated/prisma/enums';

export class DeploymentNotificationDto {
  @IsString()
  @IsNotEmpty()
  deploymentId: string;

  @IsEnum(DeploymentStatus)
  @IsNotEmpty()
  status: DeploymentStatus;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsString()
  projectName?: string;

  @IsOptional()
  @IsString()
  deploymentUrl?: string;
}
