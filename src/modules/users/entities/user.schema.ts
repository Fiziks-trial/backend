import {
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  index,
  integer,
} from 'drizzle-orm/pg-core';

export const userRoles = ['user', 'admin'] as const;
export type UserRole = (typeof userRoles)[number];

export const users = pgTable(
  'users',
  {
    id: text('id').primaryKey(),
    email: text('email').notNull().unique(),
    name: text('name'),
    avatar: text('avatar'),
    provider: text('provider').notNull(),
    providerId: text('provider_id').notNull(),
    username: text('username').unique(),
    role: text('role').notNull().default('user').$type<UserRole>(),
    xp: integer('xp').notNull().default(0),
    totalMatches: integer('total_matches').notNull().default(0),
    wins: integer('wins').notNull().default(0),
    losses: integer('losses').notNull().default(0),
    draws: integer('draws').notNull().default(0),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('provider_idx').on(table.provider, table.providerId),
    index('users_wins_idx').on(table.wins),
  ],
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
