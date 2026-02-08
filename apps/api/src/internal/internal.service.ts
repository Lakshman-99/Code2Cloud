import { Injectable, NotFoundException, Logger } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { EncryptionService } from "../common/utils/encryption.service";
import { GithubAppService } from "../git/git.service";
import { MailService } from "../mail/mail.service";
import axios from "axios";
import {
  UpdateDeploymentStatusDto,
  CreateLogsDto,
  UpdateProjectStatusDto,
  UpdateDomainStatusDto,
  DeploymentNotificationDto,
} from "./dto";
import { DeploymentStatus, LogSource } from "generated/prisma/enums";

@Injectable()
export class InternalService {
  private readonly logger = new Logger(InternalService.name);

  constructor(
    private prisma: PrismaService,
    private gitService: GithubAppService,
    private encryption: EncryptionService,
    private mailService: MailService,
  ) {}

  async updateDeploymentStatus(id: string, dto: UpdateDeploymentStatusDto) {
    const deployment = await this.prisma.deployment.findUnique({
      where: { id },
    });
    if (!deployment) throw new NotFoundException("Deployment not found");

    const updateData: Record<string, unknown> = { status: dto.status };

    // Set containerImage if provided
    if (dto.containerImage) {
      updateData.containerImage = dto.containerImage;
    }

    // Set deploymentUrl if provided
    if (dto.deploymentUrl) {
      updateData.deploymentUrl = dto.deploymentUrl;
    }

    // Set finishedAt and calculate duration for terminal states
    if (["READY", "FAILED", "CANCELED"].includes(dto.status)) {
      updateData.finishedAt = new Date();
      updateData.duration = Math.floor(
        (Date.now() - deployment.startedAt.getTime()) / 1000,
      );
    }

    const updated = await this.prisma.deployment.update({
      where: { id },
      data: updateData,
      include: { project: { select: { name: true } } },
    });

    this.logger.log(`Deployment ${id} status updated to ${dto.status}`);
    return updated;
  }

  async createLogs(deploymentId: string, dto: CreateLogsDto) {
    const deployment = await this.prisma.deployment.findUnique({
      where: { id: deploymentId },
    });
    if (!deployment) throw new NotFoundException("Deployment not found");

    const logsData = dto.logs.map((log) => ({
      deploymentId,
      source: log.source,
      message: log.message,
      timestamp: log.timestamp ? new Date(log.timestamp) : new Date(),
    }));

    await this.prisma.logEntry.createMany({ data: logsData });

    this.logger.log(
      `Added ${dto.logs.length} logs to deployment ${deploymentId}`,
    );
    return { success: true, count: dto.logs.length };
  }

  async getLogs(deploymentId: string, source?: LogSource) {
    const deployment = await this.prisma.deployment.findUnique({
      where: { id: deploymentId },
    });
    if (!deployment) throw new NotFoundException("Deployment not found");

    const whereClause: Record<string, unknown> = { deploymentId };
    if (source) {
      whereClause.source = source;
    }

    return this.prisma.logEntry.findMany({
      where: whereClause,
      orderBy: { timestamp: "asc" },
    });
  }

  async getInstallationToken(installationId: string) {
    const token = await this.gitService.getInstallationToken(installationId);
    return {
      token,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    };
  }

  async getSettingsByProject(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { userId: true },
    });
    if (!project) throw new NotFoundException("Project not found");

    const config = await this.prisma.systemConfig.findUnique({
      where: { userId: project.userId },
    });

    // Return defaults if no config exists
    if (!config) {
      return {
        defaultRegion: "us-ashburn-1",
        maxConcurrentBuilds: 1,
        logRetentionDays: 1,
        turboMode: false,
        globalTTLMinutes: 5,
        autoDeploy: true,
        emailDeployFailed: true,
        emailDeploySuccess: true,
        slackWebhook: null,
      };
    }

    // Decrypt slack webhook if present
    let slackWebhook = null;
    if (config.slackWebhook) {
      try {
        slackWebhook = this.encryption.decrypt(config.slackWebhook);
      } catch {
        this.logger.warn(
          `Failed to decrypt slack webhook for user ${project.userId}`,
        );
      }
    }

    return {
      defaultRegion: config.defaultRegion,
      maxConcurrentBuilds: config.maxConcurrentBuilds,
      logRetentionDays: config.logRetentionDays,
      turboMode: config.turboMode,
      globalTTLMinutes: config.globalTTLMinutes,
      autoDeploy: config.autoDeploy,
      emailDeployFailed: config.emailDeployFailed,
      emailDeploySuccess: config.emailDeploySuccess,
      slackWebhook,
    };
  }

  async getExpiredDeployments() {
    // Get all configs with their TTL settings
    const configs = await this.prisma.systemConfig.findMany({
      select: { userId: true, globalTTLMinutes: true },
    });

    const expiredDeployments: Array<{
      id: string;
      projectId: string;
      projectName: string;
      containerImage: string | null;
      deploymentUrl: string | null;
      startedAt: Date;
      ttlMinutes: number;
    }> = [];

    for (const config of configs) {
      const ttlMs = config.globalTTLMinutes * 60 * 1000;
      const expiryThreshold = new Date(Date.now() - ttlMs);

      const deployments = await this.prisma.deployment.findMany({
        where: {
          project: { userId: config.userId },
          status: "READY",
          startedAt: { lt: expiryThreshold },
        },
        include: { project: { select: { name: true } } },
      });

      for (const d of deployments) {
        expiredDeployments.push({
          id: d.id,
          projectId: d.projectId,
          projectName: d.project.name,
          containerImage: d.containerImage,
          deploymentUrl: d.deploymentUrl,
          startedAt: d.startedAt,
          ttlMinutes: config.globalTTLMinutes,
        });
      }
    }

    return expiredDeployments;
  }

  async cleanupLogs() {
    // Get all configurations with logRetentionDays
    const configs = await this.prisma.systemConfig.findMany({
      select: { userId: true, logRetentionDays: true },
    });

    let totalDeleted = 0;

    for (const config of configs) {
      if (!config.logRetentionDays) continue;

      const retentionMs = config.logRetentionDays * 24 * 60 * 60 * 1000;
      const expiryThreshold = new Date(Date.now() - retentionMs);

      const result = await this.prisma.logEntry.deleteMany({
        where: {
          deployment: {
            project: { userId: config.userId },
          },
          timestamp: { lt: expiryThreshold },
        },
      });

      totalDeleted += result.count;
    }

    this.logger.log(`Cleaned up ${totalDeleted} expired log entries`);
    return { success: true, count: totalDeleted };
  }

  async deleteDeploymentResources(id: string) {
    const deployment = await this.prisma.deployment.findUnique({
      where: { id },
      include: { project: { select: { name: true } } },
    });
    if (!deployment) throw new NotFoundException("Deployment not found");

    // Mark deployment as canceled/expired
    await this.prisma.deployment.update({
      where: { id },
      data: {
        status: DeploymentStatus.CANCELED,
        finishedAt: new Date(),
      },
    });

    this.logger.log(`Deployment ${id} resources marked for deletion`);

    return {
      success: true,
      deploymentId: id,
      projectName: deployment.project.name,
      containerImage: deployment.containerImage,
    };
  }

  async updateProjectStatus(id: string, dto: UpdateProjectStatusDto) {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) throw new NotFoundException("Project not found");

    const updated = await this.prisma.project.update({
      where: { id },
      data: { onlineStatus: dto.onlineStatus },
    });

    this.logger.log(`Project ${id} status updated to ${dto.onlineStatus}`);
    return updated;
  }

  async updateDomainStatus(id: string, dto: UpdateDomainStatusDto) {
    const domain = await this.prisma.domain.findUnique({ where: { id } });
    if (!domain) throw new NotFoundException("Domain not found");

    const updateData: Record<string, unknown> = { status: dto.status };

    // Set or clear error message
    if (dto.error !== undefined) {
      updateData.error = dto.error || null;
    }

    const updated = await this.prisma.domain.update({
      where: { id },
      data: updateData,
    });

    this.logger.log(`Domain ${id} status updated to ${dto.status}`);
    return updated;
  }

  async getPendingDomains() {
    const domains = await this.prisma.domain.findMany({
      where: { status: 'PENDING' },
      include: {
        project: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return domains.map((d) => ({
      id: d.id,
      domain: d.name,
      projectId: d.project.id,
      projectName: d.project.name,
      status: d.status,
      createdAt: d.createdAt.toISOString(),
    }));
  }

  async sendDeploymentNotification(dto: DeploymentNotificationDto) {
    const deployment = await this.prisma.deployment.findUnique({
      where: { id: dto.deploymentId },
      include: {
        project: { select: { name: true, userId: true } },
        initiator: { select: { email: true, name: true } },
      },
    });

    if (!deployment) throw new NotFoundException("Deployment not found");

    // Get user settings
    const config = await this.prisma.systemConfig.findUnique({
      where: { userId: deployment.project.userId },
    });

    const notifications: Promise<void>[] = [];

    // Send Slack notification if webhook configured
    if (config?.slackWebhook) {
      try {
        const webhookUrl = this.encryption.decrypt(config.slackWebhook);
        notifications.push(
          this.sendSlackNotification(webhookUrl, deployment, dto),
        );
      } catch {
        this.logger.warn(
          `Failed to decrypt Slack webhook for deployment ${dto.deploymentId}`,
        );
      }
    }

    // Send Email notification
    const recipientEmail = deployment.initiator?.email;
    if (recipientEmail) {
      const authorName = deployment.initiator?.name ?? undefined;
      const commitMessage = dto.message;

      if (config?.emailDeploySuccess && dto.status === "READY") {
        notifications.push(
          this.mailService.sendDeploymentSuccess(
            recipientEmail,
            deployment.project.name,
            dto.deploymentUrl || "",
            commitMessage,
            authorName,
          ),
        );
      }

      if (config?.emailDeployFailed && dto.status === "FAILED") {
        notifications.push(
          this.mailService.sendDeploymentFailure(
            recipientEmail,
            deployment.project.name,
            commitMessage,
            authorName,
          ),
        );
      }
    }

    await Promise.allSettled(notifications);

    this.logger.log(`Notification sent for deployment ${dto.deploymentId}`);
    return { success: true, deploymentId: dto.deploymentId };
  }

  private async sendSlackNotification(
    webhookUrl: string,
    deployment: {
      project: { name: string };
      initiator: { email: string; name: string | null } | null;
    },
    dto: DeploymentNotificationDto,
  ): Promise<void> {
    const statusEmoji = this.getStatusEmoji(dto.status);
    const statusColor = this.getStatusColor(dto.status);

    const message = {
      attachments: [
        {
          color: statusColor,
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `${statusEmoji} *Deployment ${dto.status}*\n*Project:* ${dto.projectName || deployment.project.name}`,
              },
            },
            {
              type: "section",
              fields: [
                {
                  type: "mrkdwn",
                  text: `*Initiated by:*\n${deployment.initiator?.name || deployment.initiator?.email || "System"}`,
                },
                {
                  type: "mrkdwn",
                  text: `*URL:*\n${dto.deploymentUrl || "N/A"}`,
                },
              ],
            },
          ],
        },
      ],
    };

    if (dto.message) {
      message.attachments[0].blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Message:* ${dto.message}`,
        },
      } as never);
    }

    await axios.post(webhookUrl, message);
  }

  private getStatusEmoji(status: DeploymentStatus): string {
    const emojis: Record<DeploymentStatus, string> = {
      QUEUED: "⏳",
      BUILDING: "🔨",
      DEPLOYING: "🚀",
      READY: "✅",
      FAILED: "❌",
      CANCELED: "🚫",
      EXPIRED: "🧹",
    };
    return emojis[status] || "📋";
  }

  private getStatusColor(status: DeploymentStatus): string {
    const colors: Record<DeploymentStatus, string> = {
      QUEUED: "#808080",
      BUILDING: "#FFA500",
      DEPLOYING: "#0000FF",
      READY: "#00FF00",
      FAILED: "#FF0000",
      CANCELED: "#808080",
      EXPIRED:  "#A52A2A",
    };
    return colors[status] || "#808080";
  }
}
