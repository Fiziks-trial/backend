import { pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';

export const users = pgTable(
  'users',
  {
    id: text('id').primaryKey(),
    email: text('email').notNull().unique(),
    name: text('name'),
    avatar: text('avatar'),
    provider: text('provider').notNull(),
    providerId: text('provider_id').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [uniqueIndex('provider_idx').on(table.provider, table.providerId)],
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
