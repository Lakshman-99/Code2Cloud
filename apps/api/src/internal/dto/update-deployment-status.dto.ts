import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { DeploymentStatus } from 'generated/prisma/enums';

export class UpdateDeploymentStatusDto {
  @IsEnum(DeploymentStatus)
  @IsNotEmpty()
  status: DeploymentStatus;

  @IsOptional()
  @IsString()
  containerImage?: string;

  @IsOptional()
  @IsString()
  deploymentUrl?: string;
}
