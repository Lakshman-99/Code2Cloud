export interface GitAccount {
    id: string;
    username: string;
    avatarUrl: string;
    installationId: string | null;
};

export interface GitConnectionStatus {
  connected: boolean;
  username?: string;
  avatarUrl?: string;
  accounts?: GitAccount[];
}

export interface GitRepository {
  id: number;
  name: string;
  fullName: string;
  private: boolean;
  htmlUrl: string;
  language: string;
  defaultBranch: string;
  updatedAt: string;
}