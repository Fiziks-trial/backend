import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { eq, and } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import { DATABASE_CONNECTION } from '../../database/database.providers';
import { users, refreshTokens, User, NewUser } from './entities';
import { JwtPayload, JwtTokens } from '../../common';

@Injectable()
export class AuthService {
  constructor(
    @Inject(DATABASE_CONNECTION) private db: any,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateOAuthUser(profile: {
    provider: string;
    providerId: string;
    email: string;
    name: string;
    avatar?: string;
  }): Promise<User> {
    const existingUser = await this.db
      .select()
      .from(users)
      .where(
        and(
          eq(users.provider, profile.provider),
          eq(users.providerId, profile.providerId),
        ),
      )
      .limit(1);

    if (existingUser.length > 0) {
      return existingUser[0];
    }

    const newUser: NewUser = {
      id: createId(),
      email: profile.email,
      name: profile.name,
      avatar: profile.avatar,
      provider: profile.provider,
      providerId: profile.providerId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await this.db.insert(users).values(newUser).returning();
    return result[0];
  }

  async login(user: User): Promise<JwtTokens> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
    };

    const accessToken = this.jwtService.sign(payload);

    const refreshToken = await this.createRefreshToken(user.id);

    return {
      accessToken,
      refreshToken,
    };
  }

  private async createRefreshToken(userId: string): Promise<string> {
    const token = createId() + createId();
    const expiresIn =
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d';
    const expiresAt = this.calculateExpiry(expiresIn);

    await this.db.insert(refreshTokens).values({
      id: createId(),
      token,
      userId,
      expiresAt,
      createdAt: new Date(),
    });

    return token;
  }

  async refreshTokens(token: string): Promise<JwtTokens> {
    const storedToken = await this.db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.token, token))
      .limit(1);

    if (storedToken.length === 0) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const refreshTokenRecord = storedToken[0];

    if (new Date() > refreshTokenRecord.expiresAt) {
      await this.db
        .delete(refreshTokens)
        .where(eq(refreshTokens.id, refreshTokenRecord.id));
      throw new UnauthorizedException('Refresh token expired');
    }

    const user = await this.db
      .select()
      .from(users)
      .where(eq(users.id, refreshTokenRecord.userId))
      .limit(1);

    if (user.length === 0) {
      throw new UnauthorizedException('User not found');
    }

    await this.db
      .delete(refreshTokens)
      .where(eq(refreshTokens.id, refreshTokenRecord.id));

    return this.login(user[0]);
  }

  async logout(token: string): Promise<void> {
    await this.db.delete(refreshTokens).where(eq(refreshTokens.token, token));
  }

  async getUserById(id: string): Promise<User | null> {
    const result = await this.db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    return result[0] || null;
  }

  private calculateExpiry(duration: string): Date {
    const match = duration.match(/^(\d+)([smhd])$/);
    if (!match) {
      return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    return new Date(Date.now() + value * multipliers[unit]);
  }
}
