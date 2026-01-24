import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsArray,
  IsNumber,
  IsBoolean,
  IsUUID,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  ProblemType,
  Difficulty,
  problemTypes,
  difficulties,
} from '../entities';

export class McqOptionDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  text: string;

  @ApiProperty()
  @IsBoolean()
  isCorrect: boolean;
}

export class CreateProblemDto {
  @ApiProperty({ description: 'The question text' })
  @IsString()
  @IsNotEmpty()
  question: string;

  @ApiProperty({ enum: problemTypes })
  @IsEnum(problemTypes)
  type: ProblemType;

  @ApiProperty({ enum: difficulties })
  @IsEnum(difficulties)
  difficulty: Difficulty;

  @ApiPropertyOptional({ type: [McqOptionDto], description: 'MCQ options' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => McqOptionDto)
  options?: McqOptionDto[];

  @ApiProperty({
    description: 'Correct answer (option id for MCQ, value for numerical)',
  })
  @IsString()
  @IsNotEmpty()
  correctAnswer: string;

  @ApiPropertyOptional({ description: 'Tolerance for numerical answers' })
  @IsOptional()
  @IsNumber()
  tolerance?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  explanation?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  hints?: string[];

  @ApiPropertyOptional({ default: 100 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1000)
  points?: number;

  @ApiPropertyOptional({ default: 180, description: 'Time limit in seconds' })
  @IsOptional()
  @IsNumber()
  @Min(10)
  @Max(600)
  timeLimit?: number;

  @ApiProperty()
  @IsUUID()
  subjectId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  topic?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
