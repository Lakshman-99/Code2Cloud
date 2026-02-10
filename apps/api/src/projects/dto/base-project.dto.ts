import { IsString, IsNotEmpty, IsOptional, Matches } from 'class-validator';

export class BaseProjectDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-zA-Z0-9-]+$/, { message: 'Project name must be letters, numbers, and dashes only' })
  name: string;

  // Git Source
  @IsNotEmpty()
  gitRepoId: number;

  @IsString()
  @IsNotEmpty()
  gitRepoName: string;

  @IsString()
  @IsNotEmpty()
  gitRepoOwner: string;

  @IsString()
  @IsNotEmpty()
  gitBranch: string;

  @IsString()
  @IsNotEmpty()
  gitRepoUrl: string;

  @IsString()
  @IsNotEmpty()
  gitCloneUrl: string;

  @IsString()
  @IsNotEmpty()
  language: string;

  @IsString()
  @IsOptional()
  framework?: string;

  @IsString()
  @IsOptional()
  rootDirectory?: string;

  // Build Settings
  @IsString()
  @IsOptional()
  installCommand?: string;

  @IsString()
  @IsOptional()
  buildCommand?: string;

  @IsString()
  @IsOptional()
  runCommand?: string;

  @IsString()
  @IsOptional()
  outputDirectory?: string;

  @IsString()
  @IsOptional()
  pythonVersion?: string;
}
