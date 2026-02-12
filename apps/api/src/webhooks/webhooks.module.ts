import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { EncryptionService } from 'src/common/utils/encryption.service';

@Module({
  imports: [PrismaModule],
  controllers: [WebhooksController],
  providers: [WebhooksService, EncryptionService],
})
export class WebhooksModule {}