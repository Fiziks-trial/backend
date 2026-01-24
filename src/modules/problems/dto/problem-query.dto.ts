import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsEnum,
  IsUUID,
  IsString,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  ProblemType,
  Difficulty,
  problemTypes,
  difficulties,
} from '../entities';

export class ProblemQueryDto {
  @ApiPropertyOptional({ enum: problemTypes })
  @IsOptional()
  @IsEnum(problemTypes)
  type?: ProblemType;

  @ApiPropertyOptional({ enum: difficulties })
  @IsOptional()
  @IsEnum(difficulties)
  difficulty?: Difficulty;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  subjectId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  topic?: string;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  offset?: number;
}
