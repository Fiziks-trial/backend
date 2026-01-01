import {
  Inject,
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { eq, ilike, and, isNotNull } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DATABASE_CONNECTION } from '../../database/database.providers';
import { users, User } from '../auth/entities';
import { UpdateUserDto } from './dto';

@Injectable()
export class UsersService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: PostgresJsDatabase,
  ) {}

  async findUserById(id: string): Promise<User> {
    const result = await this.db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!result.length) {
      throw new NotFoundException('User not found');
    }

    return result[0];
  }

  async updateUser(id: string, data: UpdateUserDto): Promise<User> {
    if (data.username) {
      const existing = await this.db
        .select()
        .from(users)
        .where(eq(users.username, data.username))
        .limit(1);

      if (existing.length && existing[0].id !== id) {
        throw new ConflictException('Username already taken');
      }
    }

    const result = await this.db
      .update(users)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();

    if (!result.length) {
      throw new NotFoundException('User not found');
    }

    return result[0];
  }

  async getPublicProfileById(id: string) {
    const result = await this.db
      .select({
        id: users.id,
        username: users.username,
        avatar: users.avatar,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!result.length) {
      throw new NotFoundException('User not found');
    }

    return result[0];
  }

  async getPublicProfileByUsername(username: string) {
    const result = await this.db
      .select({
        id: users.id,
        username: users.username,
        avatar: users.avatar,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (!result.length) {
      throw new NotFoundException('User not found');
    }

    return result[0];
  }

  async searchUsers(query: string, limit: number = 10) {
    if (query.length < 3) {
      throw new BadRequestException(
        'Search query must be at least 3 characters',
      );
    }

    const maxLimit = Math.min(limit, 50);

    const result = await this.db
      .select({
        id: users.id,
        username: users.username,
        avatar: users.avatar,
      })
      .from(users)
      .where(and(isNotNull(users.username), ilike(users.username, `${query}%`)))
      .limit(maxLimit);

    return {
      users: result,
      count: result.length,
    };
  }
}
