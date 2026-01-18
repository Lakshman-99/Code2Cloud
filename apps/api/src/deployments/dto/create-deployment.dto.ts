import { IsString, IsOptional } from 'class-validator';

export class CreateDeploymentDto {
  @IsString()
  projectId: string;

  @IsString()
  @IsOptional()
  branch?: string; // Optional: Deploy a specific branch manually
}