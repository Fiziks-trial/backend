import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  Max,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SearchUsersDto {
  /** Search query (min 3 characters) */
  @IsString()
  @MinLength(3, { message: 'Search query must be at least 3 characters' })
  search: string;

  /** Number of results to return (1-50) */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 10;
}
