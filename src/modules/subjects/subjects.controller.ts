import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SubjectsService } from './subjects.service';
import { SubjectResponse } from './dto';

@ApiTags('Subjects')
@Controller('subjects')
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  /** Get all active subjects */
  @Get()
  findAll(): Promise<SubjectResponse[]> {
    return this.subjectsService.findAll();
  }

  /** Get subject by slug */
  @Get(':slug')
  findBySlug(@Param('slug') slug: string): Promise<SubjectResponse> {
    return this.subjectsService.findBySlug(slug);
  }
}
