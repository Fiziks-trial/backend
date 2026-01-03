import {
  pgTable,
  text,
  timestamp,
  integer,
  jsonb,
  pgEnum,
} from 'drizzle-orm/pg-core';

// Enums
export const subjectEnum = pgEnum('subject', [
  'physics',
  'chemistry',
  'biology',
  'math',
]);

export const difficultyEnum = pgEnum('difficulty', ['easy', 'medium', 'hard']); 

// Table
export const problems = pgTable('problems', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  subject: subjectEnum('subject').notNull(),
  topic: text('topic').notNull(),
  difficulty: difficultyEnum('difficulty').notNull(),
  question: text('question').notNull(),
  options: jsonb('options').$type<string[]>().notNull(),
  correctIndex: integer('correct_index').notNull(),
  explanation: text('explanation'),
  hint: text('hint'),
  animationType: text('animation_type'),
  animationConfig: jsonb('animation_config'),
  timeLimit: integer('time_limit').default(15),
  points: integer('points').default(10),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
