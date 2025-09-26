import { Test, TestingModule } from '@nestjs/testing';
import { MaterialManageController } from './material_manage.controller';
import { MaterialManageService } from './material_manage.service';

describe('MaterialManageController', () => {
  let controller: MaterialManageController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MaterialManageController],
      providers: [MaterialManageService],
    }).compile();

    controller = module.get<MaterialManageController>(MaterialManageController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
