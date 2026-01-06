import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq, desc, or } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DATABASE_CONNECTION } from '../../database/database.providers';
import { matches } from './entities';

@Injectable()
export class MatchesService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: PostgresJsDatabase,
  ) {}

  async getMatchById(matchId: string) {
    const result = await this.db
      .select()
      .from(matches)
      .where(eq(matches.id, matchId))
      .limit(1);

    if (!result.length) {
      throw new NotFoundException('Match not found');
    }

    const match = result[0];

    return {
      id: match.id,
      status: match.status,
      subject: {
        id: match.subjectId,
        name: match.subjectName,
        icon: match.subjectIcon,
      },
      player1: {
        id: match.player1Id,
        username: match.player1Username,
        score: match.player1Score,
        ratingBefore: match.player1RatingBefore,
        ratingAfter: match.player1RatingAfter,
        ratingChange: match.player1RatingChange,
      },
      player2: {
        id: match.player2Id,
        username: match.player2Username,
        score: match.player2Score,
        ratingBefore: match.player2RatingBefore,
        ratingAfter: match.player2RatingAfter,
        ratingChange: match.player2RatingChange,
      },
      winnerId: match.winnerId,
      createdAt: match.createdAt,
      startedAt: match.startedAt,
      endedAt: match.endedAt,
    };
  }

  async getUserMatchHistory(
    userId: string,
    limit: number = 20,
    offset: number = 0,
  ) {
    const userMatches = await this.db
      .select()
      .from(matches)
      .where(or(eq(matches.player1Id, userId), eq(matches.player2Id, userId)))
      .orderBy(desc(matches.createdAt))
      .limit(limit)
      .offset(offset);

    // Transform to response format
    const matchHistory = userMatches.map((match) => {
      const isPlayer1 = match.player1Id === userId;

      // Determine result
      let result: 'win' | 'loss' | 'draw';
      if (match.winnerId === null) {
        result = 'draw';
      } else if (match.winnerId === userId) {
        result = 'win';
      } else {
        result = 'loss';
      }

      return {
        id: match.id,
        subject: {
          id: match.subjectId,
          name: match.subjectName,
          icon: match.subjectIcon,
        },
        player: {
          score: isPlayer1 ? match.player1Score : match.player2Score,
          ratingBefore: isPlayer1
            ? match.player1RatingBefore
            : match.player2RatingBefore,
          ratingAfter: isPlayer1
            ? match.player1RatingAfter
            : match.player2RatingAfter,
          ratingChange: isPlayer1
            ? match.player1RatingChange
            : match.player2RatingChange,
        },
        opponent: {
          id: isPlayer1 ? match.player2Id : match.player1Id,
          username: isPlayer1 ? match.player2Username : match.player1Username,
          score: isPlayer1 ? match.player2Score : match.player1Score,
        },
        result,
        createdAt: match.createdAt,
        endedAt: match.endedAt,
      };
    });

    return {
      matches: matchHistory,
    };
  }
}
