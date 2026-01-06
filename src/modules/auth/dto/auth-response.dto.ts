/** JWT tokens returned after authentication */
export class AuthTokensResponse {
  /** JWT access token */
  accessToken: string;

  /** JWT refresh token */
  refreshToken: string;
}

/** Authenticated user profile */
export class UserResponse {
  id: string;
  email: string;
  username: string;
  avatar: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Generic message response */
export class MessageResponse {
  message: string;
}
