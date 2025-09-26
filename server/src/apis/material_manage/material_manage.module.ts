import { Module } from '@nestjs/common';
import { MaterialManageService } from './material_manage.service';
import { MaterialManageController } from './material_manage.controller';
import { DatabaseService } from '../../database/database.service';
import { ConfigModule } from '@nestjs/config';
@Module({
  imports: [ConfigModule],
  controllers: [MaterialManageController],
  providers: [MaterialManageService, DatabaseService],
})
export class MaterialManageModule {}
