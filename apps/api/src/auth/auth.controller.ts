// api/src/auth/auth.controller.ts
import { Body, Controller, Post, HttpCode, HttpStatus, UseGuards, Get, Req, Res } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { SignInDto } from "./dto/sign-in.dto";
import { SignUpDto } from "./dto/sign-up.dto";
import { AtGuard } from "./common/guards/at.guard";
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from "express";
import { OAuthUser } from "./common/type";
import { GetCurrentUserId } from "./common/decorators/get-current-user-id.decorator";
import { RtGuard } from "./common/guards/rt.guard";
import { GetCurrentUser } from "./common/decorators/get-current-user.decorator";

@Controller("auth")
export class AuthController {
  constructor(private auth: AuthService) {}

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

    res.redirect(
      `http://localhost:3000/auth/callback?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`
    );
  }

  @Get('github')
  @UseGuards(AuthGuard('github'))
  githubAuth() {
    // Initiates the GitHub OAuth flow
  }

  @Get("github/callback")
  @UseGuards(AuthGuard("github"))
  async githubAuthRedirect(
    @Req() req: Request & { user: OAuthUser },
    @Res() res: Response
  ): Promise<void> {
    const tokens = await this.auth.validateOAuthLogin(req.user);

    res.redirect(
      `http://localhost:3000/auth/callback?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`
    );
  }
}