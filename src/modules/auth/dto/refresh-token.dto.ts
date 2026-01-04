import { IsString, IsNotEmpty } from 'class-validator';

export class RefreshTokenDto {
  /** Refresh token to exchange for new access token */
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
