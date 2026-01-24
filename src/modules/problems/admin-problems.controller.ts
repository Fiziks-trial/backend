import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard, AdminGuard } from '../../common';
import { ProblemsService } from './problems.service';
import { CreateProblemDto, UpdateProblemDto, ProblemQueryDto } from './dto';
import { Problem } from './entities';

@ApiTags('Admin - Problems')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin/problems')
export class AdminProblemsController {
  constructor(private readonly problemsService: ProblemsService) {}

  @Get()
  findAll(@Query() query: ProblemQueryDto): Promise<Problem[]> {
    return this.problemsService.findAllAdmin(query);
  }

  @Get(':id')
  findById(@Param('id') id: string): Promise<Problem> {
    return this.problemsService.findById(id);
  }

  @Post()
  create(@Body() dto: CreateProblemDto): Promise<Problem> {
    return this.problemsService.create(dto);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProblemDto,
  ): Promise<Problem> {
    return this.problemsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('id') id: string): Promise<void> {
    return this.problemsService.delete(id);
  }
}
