// src/modules/problem/problem.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { problems } from '../../db/schema/problem';
import { eq, sql, desc } from 'drizzle-orm';
import { CreateProblemDto } from './dto/create-problem.dto';
import { UpdateProblemDto } from './dto/update-problem.dto';
import { QueryProblemDto } from './dto/query-problem.dto';
import { Subject } from './problem.types';

@Injectable()
export class ProblemService {
  constructor(@Inject('DB') private readonly db: any) {}

  private async existsDuplicate(question: string) {
    const qLower = question.trim().toLowerCase();
    const found = await this.db
      .select()
      .from(problems)
      .where(sql`LOWER(${problems.question}) = LOWER(${qLower})`)
      .limit(1);
    return found.length > 0;
  }

  async create(dto: CreateProblemDto) {
    if (await this.existsDuplicate(dto.question)) {
      throw new BadRequestException('Duplicate question');
    }

    const insertObj = {
      subject: dto.subject,
      topic: dto.topic,
      difficulty: dto.difficulty,
      question: dto.question,
      options: dto.options,
      correctIndex: dto.correctIndex,
      explanation: dto.explanation ?? null,
      hint: dto['hint'] ?? null,
      animationType: dto['animationType'] ?? null,
      animationConfig: dto['animationConfig'] ?? null,
      timeLimit: dto.timeLimit ?? 15,
      points: dto.points ?? 10,
    };

    await this.db.insert(problems).values(insertObj);
    return { success: true };
  }

  async findAll(q: QueryProblemDto) {
    const page = q.page ?? 1;
    const limit = q.limit ?? 20;
    const offset = (page - 1) * limit;

    let builder = this.db
      .select()
      .from(problems)
      .limit(limit)
      .offset(offset)
      .$dynamic();

    if (q.subject) builder = builder.where(eq(problems.subject, q.subject));
    if (q.difficulty)
      builder = builder.where(eq(problems.difficulty, q.difficulty));
    if (q.topic) builder = builder.where(eq(problems.topic, q.topic));

    const rows = await builder.orderBy(desc(problems.createdAt));

    return rows.map((r) => ({
      id: r.id,
      subject: r.subject,
      topic: r.topic,
      difficulty: r.difficulty,
      question: r.question,
      options: r.options,
      explanation: r.explanation,
      hint: r.hint,
      animationType: r.animationType,
      animationConfig: r.animationConfig,
      timeLimit: r.timeLimit,
      points: r.points,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));
  }

  async findById(id: string) {
    const row = await this.db
      .select()
      .from(problems)
      .where(eq(problems.id, id))
      .limit(1);
    if (!row || row.length === 0)
      throw new NotFoundException('Problem not found');
    return row[0];
  }

  // Admin-only fetch including correctIndex — use only for admin endpoints
  async findByIdAdmin(id: string) {
    return this.findById(id);
  }

  async update(id: string, dto: UpdateProblemDto) {
    const found = await this.db
      .select()
      .from(problems)
      .where(eq(problems.id, id))
      .limit(1);
    if (!found || found.length === 0)
      throw new NotFoundException('Problem not found');

    // optionally check for duplicate when question changes
    if (
      dto.question &&
      dto.question !== found[0].question &&
      (await this.existsDuplicate(dto.question))
    ) {
      throw new BadRequestException('Duplicate question');
    }

    await this.db
      .update(problems)
      .set({
        subject: dto.subject ?? found[0].subject,
        topic: dto.topic ?? found[0].topic,
        difficulty: dto.difficulty ?? found[0].difficulty,
        question: dto.question ?? found[0].question,
        options: dto.options ?? found[0].options,
        correctIndex:
          typeof dto.correctIndex !== 'undefined'
            ? dto.correctIndex
            : found[0].correctIndex,
        explanation: dto.explanation ?? found[0].explanation,
        hint: dto['hint'] ?? found[0].hint,
        animationType: dto['animationType'] ?? found[0].animationType,
        animationConfig: dto['animationConfig'] ?? found[0].animationConfig,
        timeLimit: dto.timeLimit ?? found[0].timeLimit,
        points: dto.points ?? found[0].points,
        updatedAt: sql`NOW()`,
      })
      .where(eq(problems.id, id));

    return { success: true };
  }

  async delete(id: string) {
    await this.db.delete(problems).where(eq(problems.id, id));
    return { success: true };
  }

  async getRandomForMatch(subject: Subject, count = 5) {
    const rows = await this.db
      .select({
        id: problems.id,
        subject: problems.subject,
        topic: problems.topic,
        difficulty: problems.difficulty,
        question: problems.question,
        options: problems.options,
        timeLimit: problems.timeLimit,
        points: problems.points,
        animationType: problems.animationType,
        animationConfig: problems.animationConfig,
      })
      .from(problems)
      .where(eq(problems.subject, subject))
      .orderBy(sql`RANDOM()`)
      .limit(count);

    return rows;
  }

  async getSubjectStats() {
    // group counts by subject and difficulty
    const raw = await this.db
      .select({
        subject: problems.subject,
        count: sql<number>`COUNT(*)`,
      })
      .from(problems)
      .groupBy(problems.subject);

    const result: Record<string, number> = {};
    raw.forEach((r) => (result[r.subject] = Number(r.count)));
    return result;
  }

  async validateAnswer(problemId: string, answerIndex: number) {
    const problem = await this.findById(problemId);
    const isCorrect = problem.correctIndex === answerIndex;
    return {
      correct: isCorrect,
      correctIndex: problem.correctIndex,
      explanation: problem.explanation,
      points: isCorrect ? problem.points : 0,
    };
  }
}
