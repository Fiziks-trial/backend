export interface JwtPayload {
  sub: string;
  email: string;
}

export interface JwtTokens {
  accessToken: string;
  refreshToken: string;
}
