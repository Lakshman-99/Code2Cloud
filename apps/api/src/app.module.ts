import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { GitModule } from './git/git.module';
import { ProjectsModule } from './projects/projects.module';

@Module({
  imports: [AuthModule, GitModule, ProjectsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
