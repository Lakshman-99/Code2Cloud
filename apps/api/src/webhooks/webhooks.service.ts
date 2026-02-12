import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as crypto from "crypto";
import { PrismaService } from "prisma/prisma.service";
import { QueuesService } from "src/queues/queues.service";
import { EncryptionService } from "src/common/utils/encryption.service";
import { UrlUtils } from "src/common/utils/url.utils";
import { Prisma } from "generated/prisma/client";

// ─────────────────────────────────────────────────────────────
// Derived type matching the `include` in handlePushEvent
// ─────────────────────────────────────────────────────────────

type ProjectWithRelations = Prisma.ProjectGetPayload<{
  include: {
    envVars: { select: { key: true; value: true } };
    domains: { select: { name: true } };
    deployments: { select: { id: true; status: true } };
  };
}>;

// ─────────────────────────────────────────────────────────────
// GitHub Webhook Payload Types
// ─────────────────────────────────────────────────────────────

interface PushEventPayload {
  ref: string; // "refs/heads/main"
  after: string; // new commit SHA
  before: string; // previous commit SHA
  deleted: boolean; // true if branch was deleted
  forced: boolean;
  repository: {
    id: number;
    full_name: string; // "owner/repo"
    name: string;
    clone_url: string;
    default_branch: string;
    owner: {
      login: string; // repo owner username
    };
  };
  sender: {
    login: string;
    id: number;
  };
  installation?: {
    id: number;
  };
  head_commit?: {
    id: string;
    message: string;
    author: {
      name: string;
      email: string;
      username?: string;
    };
  };
}

// ─────────────────────────────────────────────────────────────
// Deployment Lifecycle on Push:
//
// 1. No active deployment     → Create + deploy normally
// 2. READY (live)             → Rolling update (zero downtime),
//                               old deployment marked SUPERSEDED
// 3. BUILDING / DEPLOYING     → Cancel via Redis signal, start new
// 4. QUEUED                   → Cancel signal, start new
// ─────────────────────────────────────────────────────────────

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);
  private readonly webhookSecret: string;

  constructor(
    private prisma: PrismaService,
    private queuesService: QueuesService,
    private encryptionService: EncryptionService,
    private config: ConfigService,
  ) {
    this.webhookSecret = this.config.getOrThrow<string>("GITHUB_WEBHOOK_SECRET");
  }

  // ─────────────────────────────────────────────────────────
  // Signature Verification
  // ─────────────────────────────────────────────────────────

  verifySignature(rawBody: Buffer, signature: string | undefined): boolean {
    if (!signature) return false;

    const expected =
      "sha256=" +
      crypto
        .createHmac("sha256", this.webhookSecret)
        .update(rawBody)
        .digest("hex");

    // Constant-time comparison to prevent timing attacks
    try {
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expected),
      );
    } catch {
      return false;
    }
  }

  // ─────────────────────────────────────────────────────────
  // Push Event Handler
  // ─────────────────────────────────────────────────────────

  async handlePushEvent(payload: PushEventPayload) {
    // Ignore branch deletions (e.g. "git push origin --delete feature-x")
    if (payload.deleted) {
      this.logger.debug("Ignoring branch deletion event");
      return;
    }

    // Extract branch name: "refs/heads/main" → "main"
    const branch = payload.ref.replace("refs/heads/", "");
    const repoOwner = payload.repository.owner.login;
    const repoName = payload.repository.name;
    const commitHash = payload.after;
    const installationId = payload.installation?.id;

    if (!installationId) {
      this.logger.warn("Push event missing installation ID — skipping");
      return;
    }

    this.logger.log(
      `Push to ${repoOwner}/${repoName}#${branch} ` +
        `(${commitHash.slice(0, 8)}) by ${payload.sender.login}`,
    );

    // ── Find all projects linked to this repo + branch ──
    // A single repo could power multiple projects (different root directories)
    const projects = await this.prisma.project.findMany({
      where: {
        gitRepoOwner: repoOwner,
        gitRepoName: repoName,
        gitBranch: branch,
      },
      include: {
        envVars: {
          select: { key: true, value: true },
        },
        domains: {
          where: { status: "ACTIVE" },
          select: { name: true },
        },
        deployments: {
          where: {
            status: { in: ["QUEUED", "BUILDING", "DEPLOYING", "READY"] },
          },
          orderBy: { startedAt: "desc" },
          take: 1,
          select: { id: true, status: true },
        },
      },
    });

    if (projects.length === 0) {
      this.logger.debug(
        `No projects linked to ${repoOwner}/${repoName}#${branch}`,
      );
      return;
    }

    this.logger.log(
      `Found ${projects.length} project(s) for ${repoOwner}/${repoName}#${branch}`,
    );

    // ── Trigger deployment for each matching project ──
    for (const project of projects) {
      // Respect per-project auto-deploy toggle
      if (!project.autoDeploy) {
        this.logger.debug(
          `Skipping ${project.name} — autoDeploy is disabled`,
        );
        continue;
      }

      try {
        await this.triggerDeployment(project, {
          branch,
          commitHash,
          installationId,
          commitMessage: payload.head_commit?.message || "",
          commitAuthor:
            payload.head_commit?.author?.name || payload.sender.login,
        });
      } catch (error) {
        // Don't let one project failure block the others
        this.logger.error(
          `Failed to trigger deployment for ${project.name}`,
          error,
        );
      }
    }
  }

  // ─────────────────────────────────────────────────────────
  // Deployment Trigger (mirrors the flow in projects.create)
  // ─────────────────────────────────────────────────────────

  private async triggerDeployment(
    project: ProjectWithRelations,
    opts: {
      branch: string;
      commitHash: string;
      installationId: number;
      commitMessage: string;
      commitAuthor: string;
    },
  ) {
    const currentDeployment = project.deployments[0];
    let previousDeploymentId: string | undefined;

    // ── Handle existing in-flight or live deployment ──────
    if (currentDeployment) {
      const { status } = currentDeployment;

      if (["QUEUED", "BUILDING", "DEPLOYING"].includes(status)) {
        // Cancel the in-progress deployment — the Go worker checks
        // cancel signals at each build phase boundary and aborts.
        this.logger.log(
          `Cancelling ${status} deployment ${currentDeployment.id} ` +
            `for ${project.name} (superseded by new push)`,
        );

        await this.queuesService.publishCancelSignal(currentDeployment.id);

        // Update DB immediately so the UI reflects cancellation
        await this.prisma.deployment.update({
          where: { id: currentDeployment.id },
          data: { status: "CANCELED" },
        });
      } else if (status === "READY") {
        previousDeploymentId = currentDeployment.id;
      }
    }

    // ── Build domain list from existing project domains ──
    const domains: string[] = project.domains.map((d) => d.name);

    // Safety: ensure at least the default subdomain exists
    if (domains.length === 0) {
      domains.push(UrlUtils.generateDeploymentUrl(project.name));
    }

    // ── Decrypt env vars (stored encrypted in DB) ────────
    const envVars: Record<string, string> = {};
    for (const env of project.envVars) {
      envVars[env.key] = this.encryptionService.decrypt(env.value);
    }

    // Add python version if set on project
    if (project.pythonVersion) {
      envVars["RAILPACK_PYTHON_VERSION"] = project.pythonVersion;
    }

    // ── Fetch system config for deployment region ────────
    const systemConfig = await this.prisma.systemConfig.findUnique({
      where: { userId: project.userId },
    });

    // ── Create deployment record ─────────────────────────
    const deploymentUrl = UrlUtils.generateDeploymentUrl(project.name);

    const deployment = await this.prisma.deployment.create({
      data: {
        projectId: project.id,
        initiatorId: project.userId,
        status: "QUEUED",
        deploymentUrl,
        branch: opts.branch,
        commitHash: opts.commitHash,
        commitMessage: opts.commitMessage,
        commitAuthor: opts.commitAuthor,
        deploymentRegion: systemConfig?.defaultRegion || "us-ashburn-1",
        trigger: 'WEBHOOK',
      },
    });

    this.logger.log(
      `Created deployment ${deployment.id} for ${project.name} ` +
        `(commit: ${opts.commitHash.slice(0, 8)}, trigger: webhook)`,
    );

    // ── Push build job to Redis queue ────────────────────
    await this.queuesService.addBuildJob({
      deploymentId: deployment.id,
      projectId: project.id,
      projectName: project.name,
      gitUrl: project.gitCloneUrl,
      installationId: opts.installationId,
      branch: opts.branch,
      commitHash: opts.commitHash,
      rootDirectory: project.rootDirectory || undefined,
      buildConfig: {
        framework: project.framework,
        installCommand: project.installCommand || undefined,
        buildCommand: project.buildCommand || undefined,
        runCommand: project.runCommand || undefined,
        outputDir: project.outputDirectory || undefined,
      },
      domains,
      envVars,
      previousDeploymentId,
    });

    this.logger.log(
      `Queued webhook build for ${project.name} → deployment ${deployment.id}`,
    );
  }
}
