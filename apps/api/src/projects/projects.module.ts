import { Module } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { EncryptionService } from 'src/common/utils/encryption.service';
import { GithubAppService } from 'src/git/git.service';

@Module({
  imports: [PrismaModule],
  controllers: [ProjectsController],
  providers: [ProjectsService, EncryptionService, GithubAppService],
})
export class ProjectsModule {}