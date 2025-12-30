import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { App } from 'octokit';
import axios from 'axios';
import { GitHubInstallationsResponse, GitHubOAuthResponse, GitHubOAuthSuccess, GitHubUserEmail, GitHubUserProfile } from 'src/auth/common/type';

@Injectable()
export class GithubAppService {
  private app: App;

  constructor(private config: ConfigService) {
    const appId = this.config.getOrThrow<string>('GITHUB_APP_ID');
    const privateKey = this.config.getOrThrow<string>('GITHUB_PRIVATE_KEY').replace(/\\n/g, '\n');
    const clientId = this.config.getOrThrow<string>('GITHUB_CLIENT_ID');
    const clientSecret = this.config.getOrThrow<string>('GITHUB_CLIENT_SECRET');

    this.app = new App({
      appId: appId,
      privateKey: privateKey,
      oauth: {
        clientId: clientId,
        clientSecret: clientSecret,
      },
    });
  }

  // 1. EXCHANGE CODE (Identity)
  async exchangeCodeForUser(code: string): Promise<{ token: GitHubOAuthSuccess; userProfile: GitHubUserProfile; installationId?: string }> {
    try {
      const clientId = this.config.getOrThrow<string>('GITHUB_CLIENT_ID');
      const clientSecret = this.config.getOrThrow<string>('GITHUB_CLIENT_SECRET');

      // Exchange code for token
      const tokenRes = await axios.post<GitHubOAuthResponse>(
        'https://github.com/login/oauth/access_token',
        {
          client_id: clientId,
          client_secret: clientSecret,
          code,
        },
        { headers: { Accept: 'application/json' } }
      );

      // Type Guard: Check if the response is an error
      if ('error' in tokenRes.data) {
        throw new BadRequestException(tokenRes.data.error_description);
      }

      const tokenData = tokenRes.data;
      const authHeader = { Authorization: `Bearer ${tokenData.access_token}` };

      // B. Get Profile
      const userRes = await axios.get<GitHubUserProfile>('https://api.github.com/user', {
        headers: authHeader,
      });

      const userProfile = userRes.data;

      // C. Fix Private Emails (Keep this!)
      if (!userProfile.email) {
        try {
          const emailsRes = await axios.get<GitHubUserEmail[]>('https://api.github.com/user/emails', { headers: authHeader });
          const primaryEmail = emailsRes.data.find(e => e.primary && e.verified);
          userProfile.email = primaryEmail?.email || emailsRes.data[0]?.email || null;
        } catch {
          // Ignore email fetch errors
        }
      }

      let installationId: string | undefined;
      try {
        // Ask GitHub: "Does this user have any installations of THIS app?"
        const installRes = await axios.get<GitHubInstallationsResponse>('https://api.github.com/user/installations', {
            headers: authHeader 
        });
        
        // If we find an installation, grab the first one's ID
        if (installRes.data.total_count > 0 && installRes.data.installations.length > 0) {
            installationId = String(installRes.data.installations[0].id);
        }
      } catch {
        console.warn("Failed to auto-discover installation. User might be new.");
      }

      return {
        token: tokenRes.data, 
        userProfile: userRes.data,
        installationId,
      };
    } catch (error) {
      console.error("OAuth Exchange Failed:", error);
      throw new BadRequestException("Failed to exchange GitHub code");
    }
  }

  // 2. LIST REPOS (Access)
  async listRepositories(installationId: string) {
    try {
      const octokit = await this.app.getInstallationOctokit(Number(installationId));

      const { data } = await octokit.rest.apps.listReposAccessibleToInstallation({
        per_page: 100, 
      });

      const allowedLanguages = new Set(['JavaScript', 'TypeScript', 'Python']);

      // 1. FILTER: Only allow supported runtimes
      const supportedRepos = data.repositories.filter((repo) => 
        repo.language && allowedLanguages.has(repo.language)
      );

      // 2. SORT: Newest updated first
      supportedRepos.sort((a, b) => 
        new Date(b.updated_at || "").getTime() - new Date(a.updated_at || "").getTime()
      );

      return supportedRepos.map((repo) => ({
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        private: repo.private,
        htmlUrl: repo.html_url,
        cloneUrl: repo.clone_url,
        language: repo.language,
        defaultBranch: repo.default_branch,
        updatedAt: repo.updated_at,
      }));
    } catch {
      throw new BadRequestException("Failed to fetch repositories. App might be uninstalled.");
    }
  }
}