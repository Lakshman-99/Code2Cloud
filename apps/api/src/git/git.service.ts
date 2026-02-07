/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { App } from 'octokit';
import axios from 'axios';
import { GitHubInstallationsResponse, GitHubOAuthResponse, GitHubOAuthSuccess, GitHubUserEmail, GitHubUserProfile } from 'src/common/types/type';
import { GraphQLResponse } from './common/type';

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

      // 1. GraphQL Query: Fetch Repos + Manifest Files in one go
      // We look for 'package.json' (Node) and 'requirements.txt' (Python)
      const query = `
        query {
          viewer {
            repositories(first: 100, orderBy: {field: UPDATED_AT, direction: DESC}) {
              nodes {
                id
                databaseId 
                name
                nameWithOwner
                url
                sshUrl
                isPrivate
                updatedAt
                defaultBranchRef { name }
                primaryLanguage { name }
                
                # Try to fetch package.json
                pkgJson: object(expression: "HEAD:package.json") {
                  ... on Blob { text }
                }
                
                # Try to fetch requirements.txt
                reqTxt: object(expression: "HEAD:requirements.txt") {
                  ... on Blob { text }
                }
              }
            }
          }
        }
      `;

      const response = await octokit.graphql<GraphQLResponse>(query);
      const nodes = response.viewer.repositories.nodes;

      // 2. Map & Detect Frameworks
      const repos = nodes.map((node) => {
        // Run detection logic on the file contents we just grabbed
        const { framework, installCommand, buildCommand, runCommand, outputDirectory } = this.detectFrameworkFromContents(
          node.pkgJson?.text, 
          node.reqTxt?.text
        );

        return {
          id: node.databaseId, // Use the numeric ID for consistency
          name: node.name,
          fullName: node.nameWithOwner,
          private: node.isPrivate,
          url: node.url,
          sshUrl: node.sshUrl,
          cloneUrl: `${node.url}.git`,
          language: node.primaryLanguage?.name || null,
          defaultBranch: node.defaultBranchRef?.name || 'main',
          updatedAt: node.updatedAt,
          // --- NEW DETECTED METADATA ---
          framework,
          installCommand,
          buildCommand,
          runCommand,
          outputDirectory
        };
      });

      // 3. Filter: Only return supported runtimes (Node/Python)
      return repos.filter(r => r.framework !== 'unknown');

    } catch (error) {
      console.error("GraphQL Repo Fetch Error:", error);
      throw new BadRequestException("Failed to fetch repositories.");
    }
  }

  private detectFrameworkFromContents(packageJsonString?: string, requirementsTxtString?: string) {
    if (packageJsonString) {
      try {
        const packageJson = JSON.parse(packageJsonString);
        const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
        const scripts = packageJson.scripts || {};
        const hasDependency = (dependencyName: string) => Boolean(dependencies[dependencyName]);

        const nodeFrameworks = [
          { dependency:'next', framework:'nextjs', installCommand:'npm install', buildCommand:'npm run build', runCommand:'npm run start', outputDirectory:'.next' },
          { dependency:'@nestjs/core', framework:'nestjs', installCommand:'npm install', buildCommand:'npm run build', runCommand:'npm run start', outputDirectory:'dist' },
          { dependency:'@angular/core', framework:'angular', installCommand:'npm install', buildCommand:'npm run build', runCommand:'npm run start', outputDirectory:'dist' },
          { dependency:'vite', framework:'vite', installCommand:'npm install', buildCommand:'npm run build', runCommand:'npx vite preview --port $PORT --host 0.0.0.0', outputDirectory:'dist' },
          { dependency:'react-scripts', framework:'create-react-app', installCommand:'npm install', buildCommand:'npm run build', runCommand:'npm run start', outputDirectory:'build' },
          { dependency:'vue', framework:'vue', installCommand:'npm install', buildCommand:'npm run build', runCommand:'npx vite preview --port $PORT --host 0.0.0.0', outputDirectory:'dist' },
          { dependency:'nuxt', framework:'nuxt', installCommand:'npm install', buildCommand:'npm run build', runCommand:'npm run start', outputDirectory:'.output/public' },
          { dependency:'@sveltejs/kit', framework:'sveltekit', installCommand:'npm install', buildCommand:'npm run build', runCommand:'npx vite preview --port $PORT --host 0.0.0.0', outputDirectory:'build' },
          { dependency:'astro', framework:'astro', installCommand:'npm install', buildCommand:'npm run build', runCommand:'npx astro preview --port $PORT --host 0.0.0.0', outputDirectory:'dist' },
          { dependency:'express', framework:'express', installCommand:'npm install', buildCommand:'', runCommand:'npm start', outputDirectory:'.' },
          { dependency:'fastify', framework:'fastify', installCommand:'npm install', buildCommand:'', runCommand:'npm start', outputDirectory:'.' },
        ];

        for (const frameworkEntry of nodeFrameworks) {
          if (hasDependency(frameworkEntry.dependency)) {
            return {
              framework: frameworkEntry.framework,
              installCommand: scripts.install || frameworkEntry.installCommand,
              buildCommand: scripts.build || frameworkEntry.buildCommand,
              runCommand: scripts.start || frameworkEntry.runCommand,
              outputDirectory: frameworkEntry.outputDirectory
            };
          }
        }

        if (hasDependency('express') || hasDependency('fastify') || hasDependency('koa')) {
          return {
            framework: 'node-server',
            installCommand: 'npm install',
            buildCommand: '',
            runCommand: scripts.start || 'node index.js',
            outputDirectory: '.'
          };
        }

        return {
          framework: 'node',
          installCommand: 'npm install',
          buildCommand: scripts.build ? 'npm run build' : '',
          runCommand: scripts.start || 'npm run start',
          outputDirectory: '.'
        };
      } catch {
        // JSON parse error — fall through to unknown
      }
    }

    if (requirementsTxtString) {
      const content = requirementsTxtString.toLowerCase();
      const contains = (keyword: string) => content.includes(keyword);

      if (contains('django')) return { framework: 'django', installCommand: 'pip install -r requirements.txt', buildCommand: 'python manage.py collectstatic --noinput', runCommand: 'gunicorn app.wsgi:application', outputDirectory: 'staticfiles' };
      if (contains('fastapi')) return { framework: 'fastapi', installCommand: 'pip install -r requirements.txt', buildCommand: '', runCommand: 'uvicorn main:app --host 0.0.0.0 --port $PORT', outputDirectory: '.' };
      if (contains('flask')) return { framework: 'flask', installCommand: 'pip install -r requirements.txt', buildCommand: '', runCommand: 'gunicorn app:app', outputDirectory: '.' };
      if (contains('streamlit')) return { framework: 'streamlit', installCommand: 'pip install -r requirements.txt', buildCommand: '', runCommand: 'streamlit run app.py', outputDirectory: '.' };

      return { framework: 'python', installCommand: 'pip install -r requirements.txt', buildCommand: '', runCommand: 'python main.py', outputDirectory: '.' };
    }

    return { framework: 'unknown', installCommand: '', buildCommand: '', runCommand: '', outputDirectory: '' };
  }

  // 3. Get File Tree (For the Root Directory Selector)
  async getRepoContents(installationId: string, owner: string, repo: string, path: string = '') {
    const octokit = await this.app.getInstallationOctokit(Number(installationId));
    try {
      const { data } = await octokit.rest.repos.getContent({
        owner,
        repo,
        path,
      });

      if (Array.isArray(data)) {
        return data
          .map((item) => ({
            name: item.name,
            path: item.path,
            type: item.type, // 'file' or 'dir'
            sha: item.sha,
          }))
          .sort((a, b) => {
            // Folders first
            if (a.type === 'dir' && b.type === 'file') return -1;
            if (a.type === 'file' && b.type === 'dir') return 1;
            return a.name.localeCompare(b.name);
          });
      }
      return [];
    } catch {
      throw new BadRequestException("Could not fetch repo contents");
    }
  }

  // 4. Re-Detect Framework (Called when user selects a new Root Directory)
  async detectFrameworkConfig(installationId: string, owner: string, repo: string, path: string = '') {
    const octokit = await this.app.getInstallationOctokit(Number(installationId));
    
    // Fetch package.json and requirements.txt at the SPECIFIC path
    let pkgJsonStr = undefined;
    let reqTxtStr = undefined;

    try {
      const { data: pkg } = await octokit.rest.repos.getContent({ owner, repo, path: `${path}/package.json` });
      if ('content' in pkg) pkgJsonStr = Buffer.from(pkg.content, 'base64').toString();
    } catch {
      // Ignore errors
    }

    try {
      const { data: req } = await octokit.rest.repos.getContent({ owner, repo, path: `${path}/requirements.txt` });
      if ('content' in req) reqTxtStr = Buffer.from(req.content, 'base64').toString();
    } catch {
      // Ignore errors
    }

    // Reuse the detection logic 
    return this.detectFrameworkFromContents(pkgJsonStr, reqTxtStr);
  }

  async getLatestCommit(installationId: string, owner: string, repo: string, branch: string) {
    try {
      const octokit = await this.app.getInstallationOctokit(Number(installationId));
      
      const { data } = await octokit.rest.repos.getBranch({
        owner,
        repo,
        branch,
      });

      return {
        sha: data.commit.sha,
        message: data.commit.commit.message,
        author: data.commit.commit.author?.name || data.commit.author?.login,
      };
    } catch (error) {
      console.error(`Failed to fetch commit for ${owner}/${repo}/${branch}`, error);
      // Fallback to avoid breaking the flow, but ideally this should throw
      return { sha: 'HEAD', message: 'Initial deployment', author: 'System' };
    }
  }

  // Get Installation Token for Workers
  async getInstallationToken(installationId: string): Promise<string> {
    try {
      const octokit = await this.app.getInstallationOctokit(Number(installationId));
      
      // The token is embedded in the octokit instance, but we need to get a fresh one
      // Using the app's built-in method to get installation access token
      const { data } = await octokit.rest.apps.createInstallationAccessToken({
        installation_id: Number(installationId)
      });

      return data.token;
    } catch (error) {
      console.error(`Failed to get installation token for ${installationId}`, error);
      throw new BadRequestException('Failed to get installation token');
    }
  }
}