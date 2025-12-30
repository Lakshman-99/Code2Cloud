import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { GitModule } from './git/git.module';

@Module({
  imports: [AuthModule, GitModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
