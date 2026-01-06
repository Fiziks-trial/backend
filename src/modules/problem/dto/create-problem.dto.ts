import {
  IsEnum,
  IsString,
  IsArray,
  IsInt,
  Min,
  Max,
  IsOptional,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';
import { Subject, Difficulty, SUBJECTS, DIFFICULTIES } from '../problem.types';

export class CreateProblemDto {
  @IsEnum(SUBJECTS)
  subject: Subject;

  @IsString()
  topic: string;

  @IsEnum(DIFFICULTIES)
  difficulty: Difficulty;

  @IsString()
  question: string;

  @IsArray()
  @ArrayMinSize(4)
  @ArrayMaxSize(4)
  @IsString({ each: true })
  options: string[];

  @IsInt()
  @Min(0)
  @Max(3)
  correctIndex: number;

  @IsOptional()
  @IsString()
  explanation?: string;

  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(60)
  timeLimit?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  points?: number;
}
