// src/modules/problem/problem.controller.ts
import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ProblemService } from './problem.service';
import { CreateProblemDto } from './dto/create-problem.dto';
import { UpdateProblemDto } from './dto/update-problem.dto';
import { QueryProblemDto } from './dto/query-problem.dto';

// placeholder guards (implement in your auth module)
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Subject } from './problem.types';

@Controller('api/problems')
export class ProblemController {
  constructor(private readonly service: ProblemService) {}

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  @Post()
  async create(@Body() dto: CreateProblemDto) {
    return this.service.create(dto);
  }

  @Get()
  async list(@Query() query: QueryProblemDto) {
    return this.service.findAll(query);
  }

  @Get('subjects')
  async subjects() {
    return this.service.getSubjectStats();
  }

  @UseGuards(AuthGuard)
  @Get('random')
  async random(
    @Query('subject') subject: Subject,
    @Query('count') count = '5',
  ) {
    return this.service.getRandomForMatch(subject, Number(count));
  }

  @Get(':id')
  async getOne(@Param('id') id: string, @Req() req: any) {
    // If admin, include correctIndex. Your auth middleware should set req.user.roles
    if (req.user && req.user.roles && req.user.roles.includes('admin')) {
      return this.service.findByIdAdmin(id);
    }
    const p = await this.service.findById(id);
    // remove correctIndex
    const { ...safe } = p;
    return safe;
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateProblemDto) {
    return this.service.update(id, dto);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.service.delete(id);
  }

  //   @UseGuards(AuthGuard)
  @Post(':id/validate')
  async validate(
    @Param('id') id: string,
    @Body('answerIndex') answerIndex: number,
  ) {
    return this.service.validateAnswer(id, answerIndex);
  }
}
