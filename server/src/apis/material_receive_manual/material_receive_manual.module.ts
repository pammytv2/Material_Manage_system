import { Module } from '@nestjs/common';
import { MaterialReceiveManualService } from './material_receive_manual.service';
import { MaterialReceiveManualController } from './material_receive_manual.controller';
import { DatabaseService } from '../../database/database.service';
import { ConfigModule } from '@nestjs/config';
@Module({
  imports: [ConfigModule],
  controllers: [MaterialReceiveManualController],
  providers: [MaterialReceiveManualService, DatabaseService],
})
export class MaterialReceiveManualModule {}
