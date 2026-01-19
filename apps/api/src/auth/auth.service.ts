import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { PrismaService } from "prisma/prisma.service";
import * as bcrypt from "bcrypt";
import { JwtService } from "@nestjs/jwt";
import { SignUpDto } from "./dto/sign-up.dto";
import { SignInDto } from "./dto/sign-in.dto";
import { CompleteGithubPayload, OAuthUser } from "../common/types/type";
import { User } from "generated/prisma/client";

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async signUp(dto: SignUpDto) {
    // 1. Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
    });

    // If found, stop everything.
    if (existingUser) throw new ForbiddenException("Credentials taken");

    // 2. Proceed with creation
    const hash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hash,
        name: dto.name,
        systemConfig: {
          create: {}, // Create default system config
        },
      },
    });

    // Automatically log them in on signup
    const tokens = await this.getTokens(
      user.id,
      user.email,
      user.name,
      user.avatar,
    );
    await this.updateRefreshTokenHash(user.id, tokens.refreshToken);
    return tokens;
  }

  async signIn(dto: SignInDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) throw new UnauthorizedException("Invalid credentials");

    const valid = await bcrypt.compare(dto.password, user.password || "");
    if (!valid) throw new UnauthorizedException("Invalid credentials");

    const tokens = await this.getTokens(
      user.id,
      user.email,
      user.name,
      user.avatar,
    );
    await this.updateRefreshTokenHash(user.id, tokens.refreshToken);

    return tokens;
  }

  async logout(userId: string) {
    // Delete the refresh token so it can't be used again
    await this.prisma.user.updateMany({
      where: { id: userId, hashedRefreshToken: { not: null } },
      data: { hashedRefreshToken: null },
    });
    return true;
  }

  async refreshTokens(userId: string, rt: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.hashedRefreshToken)
      throw new ForbiddenException("Access Denied");

    const rtMatches = await bcrypt.compare(rt, user.hashedRefreshToken);
    if (!rtMatches) throw new ForbiddenException("Access Denied");

    const tokens = await this.getTokens(
      user.id,
      user.email,
      user.name,
      user.avatar,
    );
    await this.updateRefreshTokenHash(user.id, tokens.refreshToken);

    return tokens;
  }

  async validateOAuthLogin(profile: OAuthUser) {
    // 1. Check if user exists
    let user = await this.prisma.user.findUnique({
      where: { email: profile.email },
    });

    // 2. If not, create them (No password needed!)
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: profile.email,
          name: profile.name,
          avatar: profile.picture, // Store the image!
          provider: profile.provider,
          password: null, // Explicitly null
        },
      });
    } else {
      // Optional: Update avatar if they changed it on Google/GitHub
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          avatar: profile.picture,
          provider: profile.provider,
        },
      });
    }

    // 3. Generate Tokens (using your existing logic)
    const tokens = await this.getTokens(
      user.id,
      user.email,
      user.name,
      user.avatar,
    );
    await this.updateRefreshTokenHash(user.id, tokens.refreshToken);

    return tokens;
  }

  async processGithubCallback(
    payload: CompleteGithubPayload,
    installationId?: string,
    currentUserId?: string,
  ) {
    const {
      githubId,
      username,
      email,
      name,
      avatarUrl,
      accessToken,
      refreshToken,
    } = payload;

    // --- SCENARIO 1: LINKING AN ACCOUNT (User already logged in) ---
    if (currentUserId) {
      // Just create/update the GitAccount link. Do NOT touch the main User profile.
      await this.prisma.gitAccount.upsert({
        where: {
          provider_providerId: { provider: "github", providerId: githubId },
        },
        create: {
          userId: currentUserId, // Link to the logged-in user
          provider: "github",
          providerId: githubId,
          username,
          avatarUrl,
          accessToken,
          refreshToken,
          installationId: installationId || null,
        },
        update: {
          userId: currentUserId, // Claim ownership if it was orphaned
          accessToken,
          refreshToken,
          username,
          avatarUrl,
          ...(installationId ? { installationId } : {}),
        },
      });

      // Return existing user's tokens (refreshed)
      const user = await this.prisma.user.findUnique({
        where: { id: currentUserId },
      });
      const tokens = await this.getTokens(
        user!.id,
        user!.email,
        user!.name,
        user!.avatar,
      );
      await this.updateRefreshTokenHash(user!.id, tokens.refreshToken);

      return tokens;
    }

    // --- SCENARIO 2: LOGIN / SIGNUP (No user session) ---

    // 1. Try to find user by existing Git Link OR Email
    if (!email)
      throw new UnauthorizedException(
        "GitHub account must have a public email",
      );

    let user: User | null | undefined = await this.prisma.gitAccount
      .findFirst({
        where: { provider: "github", providerId: githubId },
        include: { user: true },
      })
      .then((account) => account?.user);

    if (!user) {
      user = await this.prisma.user.findUnique({ where: { email } });
    }

    // 2. Create or Update User
    if (!user) {
      // CREATE NEW
      user = await this.prisma.user.create({
        data: {
          email,
          name: name || username,
          avatar: avatarUrl,
          provider: "github",
        },
      });
    } else {
      // UPDATE EXISTING (Merge logic)
      // If they logged in with GitHub, switch provider/avatar to reflect that
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          provider: "github",
          avatar: avatarUrl || undefined,
        },
      });
    }

    // 3. Upsert the GitAccount (The primary one used for login)
    await this.prisma.gitAccount.upsert({
      where: {
        provider_providerId: { provider: "github", providerId: githubId },
      },
      create: {
        userId: user.id,
        provider: "github",
        providerId: githubId,
        username,
        avatarUrl,
        accessToken,
        refreshToken,
        installationId: installationId || null,
      },
      update: {
        userId: user.id,
        accessToken,
        refreshToken,
        username,
        avatarUrl,
        ...(installationId ? { installationId } : {}),
      },
    });

    const tokens = await this.getTokens(
      user.id,
      user.email,
      user.name,
      user.avatar,
    );
    await this.updateRefreshTokenHash(user.id, tokens.refreshToken);

    return tokens;
  }

  // --- Helper Functions ---

  async updateRefreshTokenHash(userId: string, rt: string) {
    const hash = await bcrypt.hash(rt, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { hashedRefreshToken: hash },
    });
  }

  async getTokens(
    userId: string,
    email: string,
    name: string | null,
    avatar: string | null = null,
  ) {
    const payload = {
      sub: userId,
      email,
      name: name || "",
      avatar,
    };

    const [at, rt] = await Promise.all([
      this.jwt.signAsync(payload, {
        secret: process.env.JWT_SECRET,
        expiresIn: "15m",
      }),
      this.jwt.signAsync(payload, {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: "7d",
      }),
    ]);

    return { accessToken: at, refreshToken: rt };
  }
}
