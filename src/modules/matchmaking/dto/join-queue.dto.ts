import { IsNotEmpty, IsUUID } from 'class-validator';

export class JoinQueueDto {
  @IsUUID('4', { message: 'subjectId must be a valid UUID' })
  @IsNotEmpty({ message: 'subjectId is required' })
  subjectId: string;
}
