import { Module } from '@nestjs/common';
import { ProblemsController } from './problems.controller';
import { AdminProblemsController } from './admin-problems.controller';
import { ProblemsService } from './problems.service';

@Module({
  controllers: [ProblemsController, AdminProblemsController],
  providers: [ProblemsService],
  exports: [ProblemsService],
})
export class ProblemsModule {}
