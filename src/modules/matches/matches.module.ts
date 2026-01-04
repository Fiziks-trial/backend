import { Module } from '@nestjs/common';
import { MatchesService } from './matches.service';
import { MatchesController, UserMatchesController } from './matches.controller';

@Module({
  controllers: [MatchesController, UserMatchesController],
  providers: [MatchesService],
  exports: [MatchesService],
})
export class MatchesModule {}
