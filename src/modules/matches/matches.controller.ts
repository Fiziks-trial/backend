import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MatchesService } from './matches.service';
import { GetMatchHistoryDto, MatchResponse, MatchHistoryResponse } from './dto';

@ApiTags('Matches')
@Controller('matches')
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  /** Get match details by ID */
  @Get(':id')
  getMatch(@Param('id') id: string): Promise<MatchResponse> {
    return this.matchesService.getMatchById(id);
  }
}

@ApiTags('Users')
@Controller('users')
export class UserMatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  /** Get user match history */
  @Get(':id/matches')
  getUserMatches(
    @Param('id') userId: string,
    @Query() query: GetMatchHistoryDto,
  ): Promise<MatchHistoryResponse> {
    return this.matchesService.getUserMatchHistory(
      userId,
      query.limit,
      query.offset,
    );
  }
}
