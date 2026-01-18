import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { EnvVarsController } from './env-vars.controller';
import { EnvVarsService } from './env-vars.service';
import { EncryptionService } from 'src/common/utils/encryption.service';

@Module({
  imports: [PrismaModule],
  controllers: [EnvVarsController],
  providers: [EnvVarsService, EncryptionService],
})
export class EnvVarsModule {}