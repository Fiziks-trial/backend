import {
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  integer,
} from 'drizzle-orm/pg-core';

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
    coins: integer('coins').notNull().default(0),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [uniqueIndex('provider_idx').on(table.provider, table.providerId)],
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
