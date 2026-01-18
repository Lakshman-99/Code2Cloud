import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { DeploymentsController } from './deployments.controller';
import { DeploymentsService } from './deployments.service';
import { QueuesModule } from 'src/queues/queues.module';
import { EncryptionService } from 'src/common/utils/encryption.service';
import { GithubAppService } from 'src/git/git.service';

@Module({
  imports: [PrismaModule, QueuesModule],
  controllers: [DeploymentsController],
  providers: [DeploymentsService, EncryptionService, GithubAppService],
})
export class DeploymentsModule {}