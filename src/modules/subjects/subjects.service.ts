import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DATABASE_CONNECTION } from '../../database/database.providers';
import { subjects, Subject } from './entities';

@Injectable()
export class SubjectsService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: PostgresJsDatabase,
  ) {}

  async findAll(): Promise<Subject[]> {
    return this.db.select().from(subjects).where(eq(subjects.isActive, true));
  }

  async findBySlug(slug: string): Promise<Subject> {
    const result = await this.db
      .select()
      .from(subjects)
      .where(eq(subjects.slug, slug))
      .limit(1);

    if (!result.length) {
      throw new NotFoundException(`Subject with slug "${slug}" not found`);
    }

    return result[0];
  }

  async findById(id: string): Promise<Subject> {
    const result = await this.db
      .select()
      .from(subjects)
      .where(eq(subjects.id, id))
      .limit(1);

    if (!result.length) {
      throw new NotFoundException(`Subject with id "${id}" not found`);
    }

    return result[0];
  }
}
