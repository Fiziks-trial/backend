import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common';
import { ProblemsService } from './problems.service';
import { ProblemQueryDto } from './dto';
import { Problem } from './entities';

@ApiTags('Problems')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('problems')
export class ProblemsController {
  constructor(private readonly problemsService: ProblemsService) {}

  @Get()
  findAll(@Query() query: ProblemQueryDto): Promise<Problem[]> {
    return this.problemsService.findAll(query);
  }

  @Get(':id')
  findById(@Param('id') id: string): Promise<Problem> {
    return this.problemsService.findById(id);
  }
}
