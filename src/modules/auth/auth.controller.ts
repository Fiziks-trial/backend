import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiExcludeEndpoint } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { GithubAuthGuard } from './guards/github-auth.guard';
import { JwtAuthGuard, CurrentUser } from '../../common';
import {
  RefreshTokenDto,
  AuthTokensResponse,
  UserResponse,
  MessageResponse,
} from './dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  /** Initiate Google OAuth login */
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  googleLogin() {
    // Guard redirects to Google
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiExcludeEndpoint()
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const user = await this.authService.validateOAuthUser(req.user as any);
    const tokens = await this.authService.login(user);
    return this.redirectWithTokens(res, tokens);
  }

  /** Initiate GitHub OAuth login */
  @Get('github')
  @UseGuards(GithubAuthGuard)
  githubLogin() {
    // Guard redirects to GitHub
  }

  @Get('github/callback')
  @UseGuards(GithubAuthGuard)
  @ApiExcludeEndpoint()
  async githubCallback(@Req() req: Request, @Res() res: Response) {
    const user = await this.authService.validateOAuthUser(req.user as any);
    const tokens = await this.authService.login(user);
    return this.redirectWithTokens(res, tokens);
  }

  /** Refresh access token using refresh token */
  @Post('refresh')
  async refresh(@Body() dto: RefreshTokenDto): Promise<AuthTokensResponse> {
    return this.authService.refreshTokens(dto.refreshToken);
  }

  /** Logout and invalidate refresh token */
  @Post('logout')
  async logout(@Body() dto: RefreshTokenDto): Promise<MessageResponse> {
    await this.authService.logout(dto.refreshToken);
    return { message: 'Logged out successfully' };
  }

  /** Get current authenticated user */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  async me(
    @CurrentUser() user: { id: string; email: string },
  ): Promise<UserResponse> {
    return this.authService.getUserById(user.id);
  }

  private redirectWithTokens(
    res: Response,
    tokens: { accessToken: string; refreshToken: string },
  ) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const params = new URLSearchParams({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
    return res.redirect(`${frontendUrl}/auth/callback?${params.toString()}`);
  }
}
