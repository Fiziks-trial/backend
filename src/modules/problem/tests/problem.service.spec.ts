// src/modules/problem/tests/problem.service.spec.ts
import { Test } from '@nestjs/testing';
import { ProblemService } from '../problem.service';
import { DrizzleModule } from '../../../db/drizzle.module';

describe('ProblemService', () => {
  let service: ProblemService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [DrizzleModule],
      providers: [ProblemService],
    }).compile();

    service = moduleRef.get<ProblemService>(ProblemService);
  });

  it('creates a problem', async () => {
    const dto = {
      subject: 'physics',
      topic: 'Kinematics',
      difficulty: 'easy',
      question: 'What is 1+1?',
      options: ['1','2','3','4'],
      correctIndex: 1,
      points: 5,
    };
    const res = await service.create(dto);
    expect(res).toEqual({ success: true });
  });

  it('validates answer correctly', async () => {
    // create -> find id -> validate
  });
});
