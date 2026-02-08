import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { BUILD_QUEUE_NAME, BuildJobData } from './queue.constants';

@Injectable()
export class QueuesService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QueuesService.name);
  private redis: Redis;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    // Initialize Redis Connection
    // ensure REDIS_URL matches what the Go worker uses
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
      // 1. Serialize the data to a simple JSON string
      const payload = JSON.stringify(data);

      // 2. Push to the Right of the list (RPUSH)
      // The Go worker is doing BLPOP (Left Pop), acting as a FIFO queue.
      // queue name must match Go: "build-queue"
      await this.redis.rpush(BUILD_QUEUE_NAME, payload);

      this.logger.log(`[Queue] 🚀 Added build job for deployment ${data.deploymentId}`);
      return { status: 'queued', deploymentId: data.deploymentId };
    } catch (error) {
      this.logger.error(`[Queue] Failed to add build job`, error);
      throw error;
    }
  }

  /**
   * Signal cancellation for a deployment.
   * Sets a Redis key that the Go worker polls between build steps.
   */
  async publishCancelSignal(deploymentId: string) {
    const key = `cancel:${deploymentId}`;
    // Set with 1-hour TTL so it auto-expires even if never consumed
    await this.redis.set(key, '1', 'EX', 3600);
    this.logger.log(`[Queue] 🚫 Cancel signal published for deployment ${deploymentId}`);
  }

  /**
   * Check queue health (Raw Redis version)
   */
  async getQueueStatus() {
    // Get the length of the list
    const length = await this.redis.llen(BUILD_QUEUE_NAME);
    return {
      waiting: length,
    };
  }
}