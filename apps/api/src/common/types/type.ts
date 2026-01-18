export type JwtPayload = {
  sub: string;
  email: string;
  name?: string | null;
  iat?: number;
  exp?: number;
};

export type JwtPayloadWithRt = JwtPayload & {
  refreshToken: string;
};

export interface GoogleProfile {
  name: {
    givenName: string;
    familyName: string;
  };
  emails: Array<{
    value: string;
  }>;
  photos: Array<{
    value: string;
  }>;
}

export interface GithubProfile {
  username: string;
  displayName?: string;
  photos: Array<{
    value: string;
  }>;
  emails: Array<{
    value: string;
  }>;
}

export interface OAuthUser {
  email: string;
  name: string;
  picture: string;
  provider: "google" | "github";
}

export interface GitHubUserProfile {
  id: number;
  login: string; // username
  avatar_url: string;
  name: string | null;
  email: string | null; // Often null if private, we handle this
}

export interface CompleteGithubPayload {
  githubId: string;
  username: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
  accessToken: string;
  refreshToken?: string | null;
}

export type GitHubOAuthSuccess = {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  refresh_token_expires_in?: number;
  scope: string;
  token_type: string;
};

export type GitHubOAuthError = {
  error: string;
  error_description: string;
  error_uri?: string;
};

export type GitHubOAuthResponse = GitHubOAuthSuccess | GitHubOAuthError;

export interface GitHubUserEmail {
  email: string;
  primary: boolean;
  verified: boolean;
  visibility: string | null;
}

export interface GitHubInstallation {
  id: number;
  account: {
    login: string;
    id: number;
    avatar_url: string;
    type: string;
  };
  repository_selection: 'all' | 'selected';
  access_tokens_url: string;
  repositories_url: string;
}

export interface GitHubInstallationsResponse {
  total_count: number;
  installations: GitHubInstallation[];
}