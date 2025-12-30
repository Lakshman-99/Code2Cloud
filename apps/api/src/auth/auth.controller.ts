/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// api/src/auth/auth.controller.ts
import { Body, Controller, Post, HttpCode, HttpStatus, UseGuards, Get, Req, Res, Query } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { SignInDto } from "./dto/sign-in.dto";
import { SignUpDto } from "./dto/sign-up.dto";
import { AtGuard } from "./common/guards/at.guard";
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from "express";
import { CompleteGithubPayload, OAuthUser } from "./common/type";
import { GetCurrentUserId } from "./common/decorators/get-current-user-id.decorator";
import { RtGuard } from "./common/guards/rt.guard";
import { GetCurrentUser } from "./common/decorators/get-current-user.decorator";
import { JwtAuthGuard } from "./common/guards/jwt-auth.guard";
import { GithubAppService } from "src/git/git.service";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";

@Controller("auth")
export class AuthController {
  constructor(
    private auth: AuthService,
    private githubApp: GithubAppService,
    private config: ConfigService,
    private jwtService: JwtService
  ) {}

  @Post("signup")
  signup(@Body() dto: SignUpDto) {
    return this.auth.signUp(dto);
  }

  @Post("signin")
  @HttpCode(HttpStatus.OK)
  signin(@Body() dto: SignInDto) {
    return this.auth.signIn(dto);
  }

  @UseGuards(AtGuard) // Protect this route with Access Token
  @Post("logout")
  @HttpCode(HttpStatus.OK)
  logout(@GetCurrentUserId() userId: string) {
    return this.auth.logout(userId);
  }

  @UseGuards(RtGuard) // Protect this route with Refresh Token
  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  refresh(
    @GetCurrentUserId() userId: string,
    @GetCurrentUser('refreshToken') refreshToken: string,
  ) {
    // The Guard validated the token; the Strategy extracted it.
    // We just pass it to the service.
    return this.auth.refreshTokens(userId, refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@Req() req: Request) {
    return req.user;
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth() {
    // Initiates the Google OAuth flow
  }

  @Get("google/callback")
  @UseGuards(AuthGuard("google"))
  async googleAuthRedirect(
    @Req() req: Request & { user: OAuthUser },
    @Res() res: Response
  ): Promise<void> {
    const tokens = await this.auth.validateOAuthLogin(req.user);
    const frontendUrl = this.config.getOrThrow<string>('FRONTEND_URL');

    res.redirect(
      `${frontendUrl}/auth/callback?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`
      );
    }

  @Get('github')
  githubLogin(@Res() res: Response) {
    const clientId = this.config.getOrThrow('GITHUB_CLIENT_ID');
    const apiUrl = this.config.getOrThrow('API_URL');     
    const redirectUri = `${apiUrl}/auth/github/callback`;

    const url = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=read:user,user:email`;
    return res.redirect(url);
  }

  // 2. CONNECT BUTTON (Dashboard) -> Identity + Access
  @Get('github/connect')
  githubConnect(@Res() res: Response) {
    const appName = this.config.getOrThrow('GITHUB_APP_NAME');
    return res.redirect(`https://github.com/apps/${appName}/installations/new`);
  }

  // 3. UNIFIED CALLBACK
  @Get('github/callback')
  async githubCallback(
    @Query('code') code: string,
    @Query('installation_id') installationId: string,
    @Req() req: Request,
    @Res() res: Response
  ) {
    const frontendUrl = this.config.getOrThrow<string>('FRONTEND_URL');

    if (!code) return res.redirect(`${frontendUrl}/auth?error=no_code`);

    try {
      // A. Exchange Code
      const { token, userProfile, installationId: discoveredId } = await this.githubApp.exchangeCodeForUser(code);

      const finalInstallationId = installationId || discoveredId;

      let currentUserId: string | undefined;
      const cookieToken = req.cookies?.['accessToken'];

      if (cookieToken) {
        try {
          const secret = this.config.getOrThrow<string>('JWT_SECRET');
          const decoded = this.jwtService.verify(cookieToken as string, { secret });
          currentUserId = decoded.sub;
        } catch (e) { 
          // Invalid token, ignore
          console.error("Token verification failed:", e.message);
        }
      }

      // C. Prepare Payload
      const payload: CompleteGithubPayload = {
        githubId: String(userProfile.id),
        username: userProfile.login,
        email: userProfile.email,
        name: userProfile.name,
        avatarUrl: userProfile.avatar_url,
        accessToken: token.access_token,
        refreshToken: token.refresh_token,
      };

      // D. Process in Database
      const jwtTokens = await this.auth.processGithubCallback(
        payload,
        finalInstallationId,
        currentUserId
      );

      // E. Redirect
      if (finalInstallationId) {
        if (installationId) {
          // Explicit Install Flow -> Dashboard
          return res.redirect(`${frontendUrl}/auth/popup-close`);
        } else {
            // Login Flow (but we auto-connected!) -> Auth Callback -> Dashboard
          return res.redirect(
            `${frontendUrl}/auth/callback?accessToken=${jwtTokens.accessToken}&refreshToken=${jwtTokens.refreshToken}`
          );
        }
      } else {
        // Login Flow -> Back to Callback Page
        return res.redirect(
          `${frontendUrl}/auth/callback?accessToken=${jwtTokens.accessToken}&refreshToken=${jwtTokens.refreshToken}`
        );
      }

    } catch (error) {
      console.error("GitHub Auth Failed:", error);
      return res.redirect(`${frontendUrl}/auth?error=auth_failed`);
    }
  }
}