import { Test, TestingModule } from '@nestjs/testing';
import { MaterialManageService } from './material_manage.service';

describe('MaterialManageService', () => {
  let service: MaterialManageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MaterialManageService],
    }).compile();

    service = module.get<MaterialManageService>(MaterialManageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
