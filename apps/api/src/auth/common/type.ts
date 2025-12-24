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

