import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from 'prisma/prisma.module';
import { AuthModule } from 'src/auth/auth.module';
import { GitController } from './git.controller';
import { GithubAppService } from './git.service';


@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    forwardRef(() => AuthModule),
  ],
  controllers: [GitController],
  providers: [GithubAppService],
  exports: [GithubAppService],
})
export class GitModule {}