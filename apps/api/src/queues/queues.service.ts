import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import {
  BUILD_QUEUE_NAME,
  PROJECT_CLEANUP_QUEUE,
  CANCEL_KEY_PREFIX,
  BuildJobData,
  ProjectCleanupJobData,
} from './queue.constants';

@Injectable()
export class QueuesService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QueuesService.name);
  private redis: Redis;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    this.redis = new Redis(this.configService.getOrThrow('REDIS_URL'));
    
    this.redis.on('error', (err) => {
      this.logger.error('Redis connection error', err);
    });
  }

  onModuleDestroy() {
    this.redis.disconnect();
  }

  /**
   * Add a build job to the Redis Queue using Raw RPUSH.
   * This is compatible with the Go Worker's BLPOP.
   */
  async addBuildJob(data: BuildJobData) {
    try {
      const payload = JSON.stringify(data);
      await this.redis.rpush(BUILD_QUEUE_NAME, payload);

      this.logger.log(`[Queue] 🚀 Added build job for deployment ${data.deploymentId}`);
      return { status: 'queued', deploymentId: data.deploymentId };
    } catch (error) {
      this.logger.error(`[Queue] Failed to add build job`, error);
      throw error;
    }
  }

  /**
   * Push a project cleanup job for the Go worker.
   * Called when a project is deleted — the worker will
   * remove all K8s resources (Deployment, Service, Ingress, etc).
   */
  async addProjectCleanupJob(data: ProjectCleanupJobData) {
    try {
      const payload = JSON.stringify(data);
      await this.redis.lpush(PROJECT_CLEANUP_QUEUE, payload);

      this.logger.log(
        `[Queue] 🗑️ Added project cleanup job for ${data.projectName} ` +
          `(${data.activeDeploymentIds.length} active deployments)`,
      );
    } catch (error) {
      this.logger.error(`[Queue] Failed to add project cleanup job`, error);
      // DB delete already happened, cleanup is best-effort.
      // Orphaned K8s resources can be cleaned up manually or by label selectors.
    }
  }

  /**
   * Signal cancellation for a deployment.
   * Sets a Redis key that the Go worker polls between build steps.
   */
  async publishCancelSignal(deploymentId: string) {
    const key = `${CANCEL_KEY_PREFIX}${deploymentId}`;
    // Set with 5-min TTL so it auto-expires even if never consumed
    await this.redis.set(key, '1', 'EX', 300);
    this.logger.log(`[Queue] 🚫 Cancel signal published for deployment ${deploymentId}`);
  }

  /**
   * Check queue health (Raw Redis version)
   */
  async getQueueStatus() {
    const waiting = await this.redis.llen(BUILD_QUEUE_NAME);
    const cleanupPending = await this.redis.llen(PROJECT_CLEANUP_QUEUE);
    return { waiting, cleanupPending };
  }
}