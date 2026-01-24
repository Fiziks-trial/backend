import {
  Inject,
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { eq, ilike, and, isNotNull, desc } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DATABASE_CONNECTION } from '../../database/database.providers';
import { users, userSubjectStats } from './entities';
import { subjects } from '../subjects/entities';
import { UpdateUserDto, UpdateUserRoleDto } from './dto';

@Injectable()
export class UsersService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: PostgresJsDatabase,
  ) {}

  async findUserById(id: string) {
    const result = await this.db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        username: users.username,
        avatar: users.avatar,
        xp: users.xp,
        totalMatches: users.totalMatches,
        wins: users.wins,
        losses: users.losses,
        draws: users.draws,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!result.length) {
      throw new NotFoundException('User not found');
    }

    return result[0];
  }

  async updateUser(id: string, data: UpdateUserDto) {
    if (data.username) {
      const existing = await this.db
        .select({ id: users.id })
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
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        username: users.username,
        avatar: users.avatar,
        xp: users.xp,
        totalMatches: users.totalMatches,
        wins: users.wins,
        losses: users.losses,
        draws: users.draws,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      });

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

  async getUserSubjectStats(userId: string) {
    const stats = await this.db
      .select({
        id: userSubjectStats.id,
        subjectId: userSubjectStats.subjectId,
        elo: userSubjectStats.elo,
        matches: userSubjectStats.matches,
        wins: userSubjectStats.wins,
        losses: userSubjectStats.losses,
        draws: userSubjectStats.draws,
        currentStreak: userSubjectStats.currentStreak,
        maxStreak: userSubjectStats.maxStreak,
        lastPlayedAt: userSubjectStats.lastPlayedAt,
        subject: {
          name: subjects.name,
          slug: subjects.slug,
          icon: subjects.icon,
        },
      })
      .from(userSubjectStats)
      .innerJoin(subjects, eq(userSubjectStats.subjectId, subjects.id))
      .where(eq(userSubjectStats.userId, userId))
      .orderBy(desc(userSubjectStats.elo));

    return stats;
  }

  async getAllUsers(limit: number = 50, offset: number = 0) {
    const result = await this.db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        username: users.username,
        avatar: users.avatar,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .limit(limit)
      .offset(offset);

    return result;
  }

  async updateUserRole(id: string, data: UpdateUserRoleDto) {
    const result = await this.db
      .update(users)
      .set({
        role: data.role,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning({
        id: users.id,
        email: users.email,
        role: users.role,
      });

    if (!result.length) {
      throw new NotFoundException('User not found');
    }

    return result[0];
  }
}
