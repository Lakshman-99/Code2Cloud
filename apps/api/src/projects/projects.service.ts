import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { QueuesService } from 'src/queues/queues.service';
import { EncryptionService } from 'src/common/utils/encryption.service';
import { GithubAppService } from 'src/git/git.service';
import { EnvironmentVariable } from 'generated/prisma/client';
import { UrlUtils } from 'src/common/utils/url.utils';

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(
    private prisma: PrismaService,
    private queuesService: QueuesService,
    private encryptionService: EncryptionService,
    private gitService: GithubAppService,
  ) {}

  async create(userId: string, dto: CreateProjectDto) {
    // 1. Check if project name exists globally (Crucial for subdomains!)
    const existing = await this.prisma.project.findUnique({
      where: { name: dto.name },
    });

    if (existing) {
      throw new BadRequestException('Project name is already taken. Please choose another.');
    }

    const gitAccounts = await this.prisma.gitAccount.findMany({ where: { userId } });
    
    if (gitAccounts.length === 0) {
        throw new BadRequestException("No linked GitHub accounts found.");
    }

    // Try to match owner, otherwise pick the first (likely correct for single-user scenarios)
    const matchingAccount = gitAccounts.find(acc => acc.username === dto.gitRepoOwner) || gitAccounts[0];
    
    if (!matchingAccount.installationId) {
        throw new BadRequestException("Selected GitHub account is not installed.");
    }

    // 3. FETCH THE REAL COMMIT SHA
    const commitData = await this.gitService.getLatestCommit(
        matchingAccount.installationId,
        dto.gitRepoOwner,
        dto.gitRepoName,
        dto.gitBranch
    );

    // 2. Transaction: DB Writes + Queue Trigger
    const result = await this.prisma.$transaction(async (tx) => {
      const systemConfig = await tx.systemConfig.findUnique({ where: { userId } });

      // A. Create Project
      const project = await tx.project.create({
        data: {
          name: dto.name,
          userId,
          language: dto.language,
          framework: dto.framework,
          rootDirectory: dto.rootDirectory,
          installCommand: dto.installCommand,
          buildCommand: dto.buildCommand,
          runCommand: dto.runCommand,
          outputDirectory: dto.outputDirectory,
          gitRepoOwner: dto.gitRepoOwner,
          gitRepoName: dto.gitRepoName,
          gitRepoId: dto.gitRepoId,
          gitBranch: dto.gitBranch,
          gitRepoUrl: dto.gitRepoUrl,
          gitCloneUrl: dto.gitCloneUrl,
        },
      });

      // B. Create Encrypted Env Vars
      if (dto.envVars && dto.envVars.length > 0) {
        await tx.environmentVariable.createMany({
          data: dto.envVars.map((v) => ({
            key: v.key,
            value: this.encryptionService.encrypt(v.value),
            projectId: project.id,
          })),
        });
      }

      // C. Create Initial Deployment
      const deploymentUrl = UrlUtils.generateDeploymentUrl(project.name);
      
      const deployment = await tx.deployment.create({
        data: {
          projectId: project.id,
          initiatorId: userId,
          status: 'QUEUED',
          deploymentUrl, 
          // Metadata Snapshot
          branch: dto.gitBranch,
          commitHash: commitData.sha, 
          commitMessage: commitData.message,
          commitAuthor: commitData.author,
          deploymentRegion: systemConfig?.defaultRegion || 'us-ashburn-1',
        },
      });

      // D. Create Domain Entry (Default Subdomain)
      await tx.domain.create({
        data: {
          projectId: project.id,
          name: deploymentUrl,
        },
      });

      // E. Trigger Build Queue
      await this.queuesService.addBuildJob({
        deploymentId: deployment.id,
        projectId: project.id,
        projectName: project.name,
        gitUrl: dto.gitCloneUrl,
        installationId: Number(matchingAccount.installationId),
        branch: project.gitBranch,
        commitHash: commitData.sha,
        buildConfig: {
          framework: project.framework,
          installCommand: project.installCommand || undefined,
          buildCommand: project.buildCommand || undefined,
          runCommand: project.runCommand || undefined,
          outputDir: project.outputDirectory || undefined,
        },
        domains: [deploymentUrl],
        // Decrypt env vars for the builder (it needs raw values)
        envVars: dto.envVars?.reduce((acc, curr) => ({
            ...acc, [curr.key]: curr.value
        }), {}) || {}
      });

      this.logger.log(`[Queue] Triggered build for deployment ${deployment.id}`);

      return project;
    });

    // Return the full object
    return this.findOne(result.id, userId);
  }

  async findAll(userId: string) {
    const projects = await this.prisma.project.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        deployments: {
          take: 1,
          orderBy: { startedAt: 'desc' }, // Latest deployment status
        },
        domains: true,
        envVars: {
          select: { id: true, key: true, value: true, targets: true }
        },
      },
    });

    const decrypted = projects.map((project) => {
      const envs = project.envVars as EnvironmentVariable[];

      const decryptedVars = envs.map((v) => ({
        ...v,
        value: this.encryptionService.decrypt(v.value),
      })) || [];

      return {
        ...project,
        envVars: decryptedVars,
      };
    });

    return decrypted;
  }

  async findOne(id: string, userId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id, userId },
      include: {
        envVars: { 
          select: { id: true, key: true, value: true, targets: true } 
        },
        domains: true,
        deployments: {
          take: 5,
          orderBy: { startedAt: 'desc' }
        }
      }
    });

    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async update(id: string, userId: string, dto: UpdateProjectDto) {
    // Check ownership
    await this.findOne(id, userId);

    return this.prisma.project.update({
      where: { id },
      data: {
        ...dto,
      }
    });
  }

  async remove(id: string, userId: string) {
    // Check ownership
    await this.findOne(id, userId);

    // Cascading delete in Schema handles deployments/env-vars automatically
    return this.prisma.project.delete({
      where: { id }
    });
  }
}