// src/modules/problem/problem.module.ts
import { Module } from '@nestjs/common';
import { ProblemController } from './problem.controller';
import { ProblemService } from './problem.service';
import { DrizzleModule } from '../../db/drizzle.module'; // your drizzle DI

@Module({
  imports: [DrizzleModule],
  controllers: [ProblemController],
  providers: [ProblemService],
  exports: [ProblemService],
})
export class ProblemModule {}
