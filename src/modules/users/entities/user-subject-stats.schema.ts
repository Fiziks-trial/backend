import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { users } from './user.schema';
import { subjects } from '../../subjects/entities';

export const userSubjectStats = pgTable(
  'user_subject_stats',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id),
    subjectId: uuid('subject_id')
      .notNull()
      .references(() => subjects.id),
    elo: integer('elo').notNull().default(1200),
    matches: integer('matches').notNull().default(0),
    wins: integer('wins').notNull().default(0),
    losses: integer('losses').notNull().default(0),
    draws: integer('draws').notNull().default(0),
    currentStreak: integer('current_streak').notNull().default(0),
    maxStreak: integer('max_streak').notNull().default(0),
    lastPlayedAt: timestamp('last_played_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('user_subject_stats_user_subject_idx').on(
      table.userId,
      table.subjectId,
    ),
    index('user_subject_stats_subject_elo_idx').on(table.subjectId, table.elo),
    index('user_subject_stats_user_idx').on(table.userId),
  ],
);

export type UserSubjectStats = typeof userSubjectStats.$inferSelect;
export type NewUserSubjectStats = typeof userSubjectStats.$inferInsert;
