import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../prisma/prisma.module';
import { InternalController } from './internal.controller';
import { InternalService } from './internal.service';
import { GithubAppService } from '../git/git.service';
import { EncryptionService } from '../common/utils/encryption.service';

@Module({
  imports: [ConfigModule, PrismaModule],
  controllers: [InternalController],
  providers: [InternalService, GithubAppService, EncryptionService],
  exports: [InternalService]
})
export class InternalModule {}
