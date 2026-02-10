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
  sshUrl: string;
  cloneUrl: string;
  isPrivate: boolean;
  defaultBranchRef: { name: string } | null;
  updatedAt: string;
  primaryLanguage: { name: string } | null;
  // File Contents (root)
  pkgJson?: { text: string };
  reqTxt?: { text: string };
  // File Contents (common subdirectories for monorepos)
  pkgJsonApi?: { text: string };
  pkgJsonServer?: { text: string };
  pkgJsonBackend?: { text: string };
  pkgJsonWeb?: { text: string };
  pkgJsonClient?: { text: string };
  pkgJsonFrontend?: { text: string };
  pkgJsonApp?: { text: string };
  reqTxtApi?: { text: string };
  reqTxtServer?: { text: string };
  reqTxtBackend?: { text: string };
  reqTxtWeb?: { text: string };
  reqTxtClient?: { text: string };
  reqTxtFrontend?: { text: string };
  reqTxtApp?: { text: string };
  // Monorepo indicators
  lernaJson?: { text: string };
  pnpmWorkspace?: { text: string };
  turboJson?: { text: string };
}

export interface GraphQLResponse {
  viewer: {
    repositories: {
      nodes: RepoNode[];
    };
  };
}
