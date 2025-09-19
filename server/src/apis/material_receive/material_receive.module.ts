

import { Module } from '@nestjs/common';
import { MaterialReceiveService } from './material_receive.service';
import { MaterialReceiveController } from './material_receive.controller';
import { DatabaseService } from '../../database/database.service';
import { ConfigModule } from '@nestjs/config';



@Module({
  imports: [ConfigModule],
  controllers: [MaterialReceiveController],
  providers: [MaterialReceiveService, DatabaseService],
})
export class MaterialReceiveModule {}
