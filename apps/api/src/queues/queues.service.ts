import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { BUILD_QUEUE_NAME, BuildJobData } from './queue.constants';

@Injectable()
export class QueuesService {
  private readonly logger = new Logger(QueuesService.name);

  constructor(
    @InjectQueue(BUILD_QUEUE_NAME) private buildQueue: Queue
  ) {}

  /**
   * Add a build job to the Redis Queue.
   * This is non-blocking; it returns immediately after Redis accepts the job.
   */
  async addBuildJob(data: BuildJobData) {
    try {
      const job = await this.buildQueue.add('build-job', data, {
        jobId: data.deploymentId, // Use Deployment UUID as Job ID for easy tracking
        priority: 1, // Normal priority
        timestamp: Date.now(),
      });

      this.logger.log(`[Queue] Added build job ${job.id} for project ${data.projectId}`);
      return job;
    } catch (error) {
      this.logger.error(`[Queue] Failed to add build job`, error);
      throw error; // Let the controller handle the error (500)
    }
  }

  /**
   * Optional: Check queue health
   */
  async getQueueStatus() {
    const counts = await this.buildQueue.getJobCounts(
      'active',
      'waiting',
      'completed',
      'failed',
    );
    return counts;
  }
}