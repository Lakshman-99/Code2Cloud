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
