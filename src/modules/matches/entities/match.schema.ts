import { pgTable, uuid, text, timestamp, index } from 'drizzle-orm/pg-core';
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
    subjectId: uuid('subject_id')
      .notNull()
      .references(() => subjects.id),
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
    index('matches_status_subject_idx').on(table.status, table.subjectId),
    index('matches_created_at_idx').on(table.createdAt),
  ],
);

export type Match = typeof matches.$inferSelect;
export type NewMatch = typeof matches.$inferInsert;
