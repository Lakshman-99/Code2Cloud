import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AuthModule } from "./auth/auth.module";
import { GitModule } from "./git/git.module";
import { ProjectsModule } from "./projects/projects.module";
import { DeploymentsModule } from "./deployments/deployments.module";
import { DomainsModule } from "./domains/domains.module";
import { EnvVarsModule } from "./envs/env-vars.module";
import { QueuesModule } from "./queues/queues.module";
import { SettingsModule } from "./settings/settings.module";
import { HealthModule } from "./health/health.module";

@Module({
  imports: [
    AuthModule,
    GitModule,
    ProjectsModule,
    DeploymentsModule,
    DomainsModule,
    EnvVarsModule,
    QueuesModule,
    SettingsModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
