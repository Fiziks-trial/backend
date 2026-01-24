import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq, and, SQL } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DATABASE_CONNECTION } from '../../database/database.providers';
import { problems, Problem, NewProblem } from './entities';
import { CreateProblemDto, UpdateProblemDto, ProblemQueryDto } from './dto';

@Injectable()
export class ProblemsService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: PostgresJsDatabase,
  ) {}

  async findAll(query: ProblemQueryDto): Promise<Problem[]> {
    const conditions: SQL[] = [eq(problems.isActive, true)];

    if (query.type) {
      conditions.push(eq(problems.type, query.type));
    }
    if (query.difficulty) {
      conditions.push(eq(problems.difficulty, query.difficulty));
    }
    if (query.subjectId) {
      conditions.push(eq(problems.subjectId, query.subjectId));
    }
    if (query.topic) {
      conditions.push(eq(problems.topic, query.topic));
    }

    return this.db
      .select()
      .from(problems)
      .where(and(...conditions))
      .limit(query.limit ?? 20)
      .offset(query.offset ?? 0);
  }

  async findById(id: string): Promise<Problem> {
    const result = await this.db
      .select()
      .from(problems)
      .where(eq(problems.id, id))
      .limit(1);

    if (!result.length) {
      throw new NotFoundException(`Problem with id "${id}" not found`);
    }

    return result[0];
  }

  async findAllAdmin(query: ProblemQueryDto): Promise<Problem[]> {
    const conditions: SQL[] = [];

    if (query.type) {
      conditions.push(eq(problems.type, query.type));
    }
    if (query.difficulty) {
      conditions.push(eq(problems.difficulty, query.difficulty));
    }
    if (query.subjectId) {
      conditions.push(eq(problems.subjectId, query.subjectId));
    }
    if (query.topic) {
      conditions.push(eq(problems.topic, query.topic));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    return this.db
      .select()
      .from(problems)
      .where(whereClause)
      .limit(query.limit ?? 50)
      .offset(query.offset ?? 0);
  }

  async create(dto: CreateProblemDto): Promise<Problem> {
    const newProblem: NewProblem = {
      question: dto.question,
      type: dto.type,
      difficulty: dto.difficulty,
      options: dto.options ?? null,
      correctAnswer: dto.correctAnswer,
      tolerance: dto.tolerance ?? null,
      explanation: dto.explanation ?? null,
      hints: dto.hints ?? [],
      points: dto.points ?? 100,
      timeLimit: dto.timeLimit ?? 180,
      subjectId: dto.subjectId,
      topic: dto.topic ?? null,
      isActive: dto.isActive ?? true,
    };

    const result = await this.db
      .insert(problems)
      .values(newProblem)
      .returning();
    return result[0];
  }

  async update(id: string, dto: UpdateProblemDto): Promise<Problem> {
    await this.findById(id);

    const result = await this.db
      .update(problems)
      .set({
        ...dto,
        updatedAt: new Date(),
      })
      .where(eq(problems.id, id))
      .returning();

    return result[0];
  }

  async delete(id: string): Promise<void> {
    await this.findById(id);
    await this.db.delete(problems).where(eq(problems.id, id));
  }
}
