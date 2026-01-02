import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { urlConfig } from 'lib/url-config';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateProjectDto) {
    // 1. Check if project name exists globally (Crucial for subdomains!)
    const existing = await this.prisma.project.findUnique({
      where: { name: dto.name },
    });

    if (existing) {
      throw new BadRequestException('Project name is already taken. Please choose another.');
    }

    // 2. Fetch Git Repo ID (We need the numeric ID for stability)
    // In a real app, you'd fetch this from GitHub API using the user's token.
    // For now, we'll assume the frontend passes it or we fetch it here.
    // Let's assume we fetch it via the GitHub Service we built earlier.
    // NOTE: For simplicity in this step, I'll use a placeholder or you can pass it in DTO.
    const gitRepoId = 0; // TODO: Fetch from GitHub API using gitRepoOwner/Name
    const deploymentUrl = `${dto.name.toLowerCase()}.${urlConfig.domain}`;

    const project = await this.prisma.$transaction(async (tx) => {
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
          gitRepoId: gitRepoId, // You should fetch this from GitHub API
          gitBranch: dto.gitBranch,
          gitRepoUrl: dto.gitRepoUrl,
          gitCloneUrl: dto.gitCloneUrl,
        },
      });

      // B. Create Env Vars
      if (dto.envVars && dto.envVars.length > 0) {
        await tx.environmentVariable.createMany({
          data: dto.envVars.map((v) => ({
            key: v.key,
            value: v.value, // TODO: Encrypt this before saving!
            projectId: project.id,
          })),
        });
      }

      // C. Create Initial Deployment
      const deployment = await tx.deployment.create({
        data: {
          projectId: project.id,
          initiatorId: userId,
          status: 'QUEUED',
          deploymentUrl: deploymentUrl,
          // Metadata (Snapshot)
          branch: dto.gitBranch,
          commitHash: 'HEAD', // In reality, fetch the latest commit SHA from GitHub
          commitMessage: 'Initial deployment',
        },
      });

      // D. Create Domain Entry
      await tx.domain.create({
        data: {
          projectId: project.id,
          name: deploymentUrl,
        },
      });

      // D. TODO: Trigger BullMQ Job Here
      console.log(`[Queue] Triggering build for deployment ${deployment.id}`);

      return project;
    });

    return this.findOne(project.id, userId);
  }

  async findAll(userId: string) {
    return this.prisma.project.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        deployments: {
          take: 1,
          orderBy: { startedAt: 'desc' }, // Latest deployment status
        },
        domains: true,
        envVars: { select: { key: true, value: true } }, // Be careful returning values!
      },
    });
  }

  async findOne(id: string, userId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id, userId },
      include: {
        envVars: { select: { key: true, value: true } }, // Be careful returning values!
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