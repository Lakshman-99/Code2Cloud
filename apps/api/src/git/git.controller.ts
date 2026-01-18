import {
  Controller,
  Get,
  UseGuards,
  BadRequestException,
  Query,
} from "@nestjs/common";
import { GetCurrentUserId } from "src/common/decorators/get-current-user-id.decorator";
import { JwtAuthGuard } from "src/common/guards/jwt-auth.guard";
import { PrismaService } from "../../prisma/prisma.service";
import { GithubAppService } from "./git.service";

@Controller("git")
export class GitController {
  constructor(
    private prisma: PrismaService,
    private githubApp: GithubAppService,
  ) {}

  // Used by useGit() hook
  @Get("status")
  @UseGuards(JwtAuthGuard)
  async getStatus(@GetCurrentUserId() userId: string) {
    const accounts = await this.prisma.gitAccount.findMany({
      where: { userId, provider: "github" },
    });

    // Primary account is the first one, or the one with an installation
    const primary = accounts.find((a) => a.installationId) || accounts[0];

    return {
      connected: accounts.length > 0 && accounts.some((a) => a.installationId),
      username: primary?.username, // For display
      avatarUrl: primary?.avatarUrl,
      // Return the full list for your UI Dropdown
      accounts: accounts.map((a) => ({
        id: a.id,
        username: a.username,
        avatarUrl: a.avatarUrl,
        installationId: a.installationId as string | null,
      })),
    };
  }

  @Get("repos")
  @UseGuards(JwtAuthGuard)
  async listRepos(
    @GetCurrentUserId() userId: string,
    @Query("installationId") installationId: string,
  ) {
    await this.verifyInstallation(userId, installationId);
    return this.githubApp.listRepositories(installationId);
  }

  @Get("tree")
  @UseGuards(JwtAuthGuard)
  async getRepoTree(
    @GetCurrentUserId() userId: string,
    @Query("installationId") installationId: string,
    @Query("owner") owner: string,
    @Query("repo") repo: string,
    @Query("path") path: string = "",
  ) {
    await this.verifyInstallation(userId, installationId);
    return this.githubApp.getRepoContents(installationId, owner, repo, path);
  }

  @Get("detect")
  @UseGuards(JwtAuthGuard)
  async detectFramework(
    @GetCurrentUserId() userId: string,
    @Query("installationId") installationId: string,
    @Query("owner") owner: string,
    @Query("repo") repo: string,
    @Query("path") path: string = "",
  ) {
    await this.verifyInstallation(userId, installationId);
    return this.githubApp.detectFrameworkConfig(
      installationId,
      owner,
      repo,
      path,
    );
  }

  private async verifyInstallation(userId: string, installationId: string) {
    if (!installationId)
      throw new BadRequestException("installationId is required");

    const account = await this.prisma.gitAccount.findFirst({
      where: {
        userId,
        provider: "github",
        installationId: installationId,
      },
    });

    if (!account) {
      throw new BadRequestException(
        "GitHub account not found or access denied",
      );
    }
  }
}
