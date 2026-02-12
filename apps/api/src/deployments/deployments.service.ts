import {
  Injectable,
  NotFoundException,
  Logger,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { QueuesService } from "../queues/queues.service";
import { EncryptionService } from "src/common/utils/encryption.service";
import { CreateDeploymentDto } from "./dto/create-deployment.dto";
import { DeploymentStatus, EnvironmentType } from "generated/prisma/enums";
import { GithubAppService } from "src/git/git.service";

@Injectable()
export class DeploymentsService {
  private readonly logger = new Logger(DeploymentsService.name);

  constructor(
    private prisma: PrismaService,
    private queueService: QueuesService,
    private gitService: GithubAppService,
    private encryptionService: EncryptionService,
  ) {}

  // --- 1. TRIGGER DEPLOYMENT ---
  async create(userId: string, dto: CreateDeploymentDto) {
    const { projectId } = dto;

    // A. Verify Project Ownership & Get Config
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, userId },
      include: {
        envVars: true,
        domains: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!project) throw new NotFoundException("Project not found");

    const gitAccounts = await this.prisma.gitAccount.findMany({
      where: { userId },
    });

    if (gitAccounts.length === 0) {
      throw new BadRequestException("No linked GitHub accounts found.");
    }

    // Check if the latest deployment already in progress/queued
    const latestDeployment = await this.prisma.deployment.findFirst({
      where: { projectId },
      orderBy: { startedAt: "desc" },
    });
    if (
      latestDeployment &&
      ["QUEUED", "BUILDING", "DEPLOYING"].includes(latestDeployment.status)
    ) {
      throw new BadRequestException(
        "A deployment is already in progress for this project.",
      );
    }

    // Try to match owner, otherwise pick the first (likely correct for single-user scenarios)
    const matchingAccount =
      gitAccounts.find((acc) => acc.username === project.gitRepoOwner) ||
      gitAccounts[0];

    if (!matchingAccount.installationId) {
      throw new BadRequestException(
        "Selected GitHub account is not installed.",
      );
    }

    // 3. FETCH THE REAL COMMIT SHA
    const commitData = await this.gitService.getLatestCommit(
      matchingAccount.installationId,
      project.gitRepoOwner,
      project.gitRepoName,
      project.gitBranch,
    );

    const deployment = await this.prisma.$transaction(async (tx) => {
      const systemConfig = await tx.systemConfig.findUnique({
        where: { userId },
      });
      const deploymentUrl = project.domains[0]?.name;

      const deployment = await tx.deployment.create({
        data: {
          projectId,
          initiatorId: userId,
          status: "QUEUED",
          deploymentUrl,
          // Metadata Snapshot
          branch: project.gitBranch,
          commitHash: commitData.sha,
          commitMessage: commitData.message,
          commitAuthor: commitData.author,
          deploymentRegion: systemConfig?.defaultRegion || "us-ashburn-1",
        },
      });

      await tx.project.update({
        where: { id: projectId },
        data: {
          configChanged: false,
          updatedAt: new Date(),
        },
      });

      return deployment;
    });

    // C. Prepare Environment Variables
    // We must decrypt them so the Build Worker can actually use them
    const domains = project.domains.map((d) => d.name);
    const envVars: Record<string, string> = {};
    const projectEnvVars = project.envVars as {
      key: string;
      value: string;
      targets: EnvironmentType[];
    }[];

    for (const v of projectEnvVars) {
      if (!v.targets.includes("PRODUCTION")) continue;

      try {
        envVars[v.key] = this.encryptionService.decrypt(v.value);
      } catch {
        this.logger.warn(
          `Failed to decrypt var ${v.key} for project ${projectId}`,
        );
      }
    }

    // D. Push Job to Redis
    await this.queueService.addBuildJob({
      deploymentId: deployment.id,
      projectId: project.id,
      projectName: project.name,
      // Construct the secure clone URL (or pass token separately)
      gitUrl: `https://github.com/${project.gitRepoOwner}/${project.gitRepoName}.git`,
      installationId: Number(matchingAccount.installationId),
      branch: project.gitBranch,
      commitHash: commitData.sha,
      rootDirectory: project.rootDirectory || undefined,
      buildConfig: {
        framework: project.framework,
        installCommand: project.installCommand || undefined,
        buildCommand: project.buildCommand || undefined,
        runCommand: project.runCommand || undefined,
        outputDir: project.outputDirectory || undefined,
      },
      domains,
      envVars: {
        ...envVars,
        ...(project.pythonVersion
          ? { RAILPACK_PYTHON_VERSION: String(project.pythonVersion) }
          : {}),
      },
    });

    this.logger.log(
      `Deployment ${deployment.id} queued for project ${project.name}`,
    );

    return deployment;
  }

  // --- 2. GET ALL (Dashboard Feed) ---
  async findAll(userId: string) {
    return this.prisma.deployment.findMany({
      where: { project: { userId } }, // Ensure user owns the project
      orderBy: { startedAt: "desc" },
      take: 10,
      include: {
        project: {
          select: { name: true, framework: true },
        },
      },
    });
  }

  // --- 3. GET BY PROJECT (History Tab) ---
  async findAllByProject(userId: string, projectId: string) {
    // Check access first
    const project = await this.prisma.project.count({
      where: { id: projectId, userId },
    });
    if (!project) throw new NotFoundException("Project not found");

    return this.prisma.deployment.findMany({
      where: { projectId },
      orderBy: { startedAt: "desc" },
      take: 20,
    });
  }

  // --- 4. GET ONE (Details Page) ---
  async findOne(userId: string, id: string) {
    const deployment = await this.prisma.deployment.findFirst({
      where: { id, project: { userId } },
      include: {
        project: true, // Include project info for context
      },
    });

    if (!deployment) throw new NotFoundException("Deployment not found");
    return deployment;
  }

  // --- 5. GET LOGS (Cursor-based for live polling) ---
  async getLogs(
    userId: string,
    deploymentId: string,
    options: { source?: string; after?: string; limit?: number },
  ) {
    // Verify ownership
    const deployment = await this.prisma.deployment.findFirst({
      where: { id: deploymentId, project: { userId } },
    });
    if (!deployment) throw new NotFoundException("Deployment not found");

    const take = Math.min(options.limit || 200, 500);

    const where: Record<string, unknown> = { deploymentId };
    if (options.source) {
      where.source = options.source;
    }
    if (options.after) {
      where.timestamp = { gt: options.after };
    }

    const logs = await this.prisma.logEntry.findMany({
      where,
      orderBy: { timestamp: "asc" },
      take,
    });

    const nextCursor = logs.length > 0 ? logs[logs.length - 1].timestamp : null;
    const isBuilding = ["QUEUED", "BUILDING", "DEPLOYING"].includes(
      deployment.status,
    );

    return {
      logs,
      nextCursor,
      hasMore: logs.length === take,
      status: deployment.status,
      isLive: isBuilding,
    };
  }

  async updateStatus(
    userId: string,
    deploymentId: string,
    status: DeploymentStatus,
  ) {
    const deployment = await this.prisma.deployment.findFirst({
      where: { id: deploymentId, project: { userId } },
    });
    if (!deployment) throw new NotFoundException("Deployment not found");

    return this.prisma.deployment.update({
      where: { id: deploymentId },
      data: { status },
    });
  }

  async cancel(userId: string, deploymentId: string) {
    const deployment = await this.prisma.deployment.findFirst({
      where: { id: deploymentId, project: { userId } },
      include: { project: { select: { name: true } } },
    });
    if (!deployment) throw new NotFoundException("Deployment not found");

    // Only in-progress deployments can be cancelled
    const cancellableStatuses: DeploymentStatus[] = [
      "QUEUED",
      "BUILDING",
      "DEPLOYING",
    ];
    if (!cancellableStatuses.includes(deployment.status)) {
      throw new BadRequestException(
        `Deployment cannot be cancelled in status: ${deployment.status}`,
      );
    }

    // 1. Update DB status to CANCELED
    const updated = await this.prisma.deployment.update({
      where: { id: deploymentId },
      data: {
        status: "CANCELED",
        finishedAt: new Date(),
        duration: Math.floor(
          (Date.now() - deployment.startedAt.getTime()) / 1000,
        ),
      },
    });

    // 2. Publish cancel signal to Redis so the worker picks it up
    await this.queueService.publishCancelSignal(deploymentId);

    this.logger.log(
      `Deployment ${deploymentId} cancelled for project ${deployment.project.name}`,
    );

    return updated;
  }
}
