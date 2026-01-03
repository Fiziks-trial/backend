import { IsOptional, IsEnum, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { Subject, Difficulty, SUBJECTS, DIFFICULTIES } from '../problem.types';

export class QueryProblemDto {
  @IsOptional()
  @IsEnum(SUBJECTS)
  subject?: Subject;

  @IsOptional()
  @IsEnum(DIFFICULTIES)
  difficulty?: Difficulty;

  @IsOptional()
  @IsString()
  topic?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  limit?: number = 20;
}
