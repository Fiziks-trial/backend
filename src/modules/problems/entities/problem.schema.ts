import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  uuid,
  jsonb,
  real,
} from 'drizzle-orm/pg-core';
import { subjects } from '../../subjects/entities';

export const problemTypes = ['mcq', 'numerical'] as const;
export type ProblemType = (typeof problemTypes)[number];

export const difficulties = ['easy', 'medium', 'hard'] as const;
export type Difficulty = (typeof difficulties)[number];

export interface McqOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export const problems = pgTable('problems', {
  id: uuid('id').primaryKey().defaultRandom(),
  question: text('question').notNull(),
  type: text('type').$type<ProblemType>().notNull(),
  difficulty: text('difficulty').$type<Difficulty>().notNull(),
  options: jsonb('options').$type<McqOption[]>(),
  correctAnswer: text('correct_answer').notNull(),
  tolerance: real('tolerance'),
  explanation: text('explanation'),
  hints: jsonb('hints').$type<string[]>().default([]),
  points: integer('points').notNull().default(100),
  timeLimit: integer('time_limit').notNull().default(180),
  subjectId: uuid('subject_id')
    .notNull()
    .references(() => subjects.id),
  topic: text('topic'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type Problem = typeof problems.$inferSelect;
export type NewProblem = typeof problems.$inferInsert;
