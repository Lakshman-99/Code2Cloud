import { Module, Global } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { QueuesService } from './queues.service';
import { BUILD_QUEUE_NAME } from './queue.constants';

@Global() // Make it Global so we don't have to import it everywhere
@Module({
  imports: [
    // 1. Configure Redis Connection
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        connection: {
          url: config.get<string>('REDIS_URL'),
        },
      }),
      inject: [ConfigService],
    }),

    // 2. Register the Specific Queue
    BullModule.registerQueue({
      name: BUILD_QUEUE_NAME,
      defaultJobOptions: {
        attempts: 3, // Retry failed builds 3 times
        backoff: {
          type: 'exponential',
          delay: 5000, // Wait 5s, then 10s, etc.
        },
        removeOnComplete: true, // Keep Redis clean
        removeOnFail: false,    // Keep failed jobs for debugging
      },
    }),
  ],
  providers: [QueuesService],
  exports: [QueuesService, BullModule],
})
export class QueuesModule {}