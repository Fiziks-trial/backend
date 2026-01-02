import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { matches } from './match.schema';
import { users } from '../../users/entities';

export const matchParticipants = pgTable(
  'match_participants',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    matchId: uuid('match_id')
      .notNull()
      .references(() => matches.id),
    userId: text('user_id')
      .notNull()
      .references(() => users.id),
    score: integer('score').notNull().default(0),
    correctAnswers: integer('correct_answers').notNull().default(0),
    ratingBefore: integer('rating_before').notNull().default(1200),
    ratingAfter: integer('rating_after').notNull().default(1200),
    ratingChange: integer('rating_change').notNull().default(0),
    xpEarned: integer('xp_earned').notNull().default(0),
    joinedAt: timestamp('joined_at').notNull().defaultNow(),
  },
  (table) => [
    index('match_participants_user_idx').on(table.userId),
    uniqueIndex('match_participants_match_user_idx').on(
      table.matchId,
      table.userId,
    ),
  ],
);

export type MatchParticipant = typeof matchParticipants.$inferSelect;
export type NewMatchParticipant = typeof matchParticipants.$inferInsert;
