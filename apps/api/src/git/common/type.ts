export interface GraphQLError {
  type: string;
  path: any[];
  message: string;
}

export interface RepoNode {
  id: string; // GraphQL ID (e.g. "R_kgD...")
  databaseId: number; // The numeric ID we use (e.g. 123456)
  name: string;
  nameWithOwner: string;
  url: string;
  isPrivate: boolean;
  defaultBranchRef: { name: string } | null;
  updatedAt: string;
  primaryLanguage: { name: string } | null;
  // File Contents
  pkgJson?: { text: string };
  reqTxt?: { text: string };
}

export interface GraphQLResponse {
  viewer: {
    repositories: {
      nodes: RepoNode[];
    };
  };
}
