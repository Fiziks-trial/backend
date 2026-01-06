import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { users } from '../../users/entities';
import { subjects } from '../../subjects/entities';

export const matchStatusEnum = [
  'in_progress',
  'completed',
  'cancelled',
] as const;
export type MatchStatus = (typeof matchStatusEnum)[number];

export const matches = pgTable(
  'matches',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Subject
    subjectId: uuid('subject_id')
      .notNull()
      .references(() => subjects.id),
    subjectName: text('subject_name').notNull(),
    subjectIcon: text('subject_icon'),

    // Player 1
    player1Id: text('player1_id')
      .notNull()
      .references(() => users.id),
    player1Username: text('player1_username').notNull(),
    player1Score: integer('player1_score').notNull().default(0),
    player1RatingBefore: integer('player1_rating_before')
      .notNull()
      .default(1200),
    player1RatingAfter: integer('player1_rating_after').notNull().default(1200),
    player1RatingChange: integer('player1_rating_change').notNull().default(0),

    // Player 2
    player2Id: text('player2_id')
      .notNull()
      .references(() => users.id),
    player2Username: text('player2_username').notNull(),
    player2Score: integer('player2_score').notNull().default(0),
    player2RatingBefore: integer('player2_rating_before')
      .notNull()
      .default(1200),
    player2RatingAfter: integer('player2_rating_after').notNull().default(1200),
    player2RatingChange: integer('player2_rating_change').notNull().default(0),

    // Match metadata
    status: text('status')
      .$type<MatchStatus>()
      .notNull()
      .default('in_progress'),
    winnerId: text('winner_id').references(() => users.id),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    startedAt: timestamp('started_at').notNull().defaultNow(),
    endedAt: timestamp('ended_at'),
  },
  (table) => [
    index('matches_player1_idx').on(table.player1Id),
    index('matches_player2_idx').on(table.player2Id),
    index('matches_subject_idx').on(table.subjectId),
    index('matches_status_idx').on(table.status),
    index('matches_created_at_idx').on(table.createdAt),
  ],
);

export type Match = typeof matches.$inferSelect;
export type NewMatch = typeof matches.$inferInsert;
