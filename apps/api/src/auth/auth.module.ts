import { forwardRef, Module } from "@nestjs/common";
import { ConfigModule } from '@nestjs/config';
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { PrismaModule } from "prisma/prisma.module";
import { JwtModule } from "@nestjs/jwt";
import { AtStrategy } from "./strategies/at.strategy";
import { RtStrategy } from "./strategies/rt.strategy";
import { GoogleStrategy } from "./strategies/google.strategy";
import { GithubStrategy } from "./strategies/github.strategy";
import { GitModule } from "src/git/git.module";

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({}),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    forwardRef(() => GitModule),
  ],
  controllers: [AuthController],
  providers: [AuthService, AtStrategy, RtStrategy, GoogleStrategy, GithubStrategy],
  exports: [AuthService],
})
export class AuthModule {}
