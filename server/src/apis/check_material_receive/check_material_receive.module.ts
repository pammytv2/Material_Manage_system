import { Module } from '@nestjs/common';
import { CheckMaterialReceiveService } from './check_material_receive.service';
import { CheckMaterialReceiveController } from './check_material_receive.controller';
import { DatabaseService } from '../../database/database.service';
import { ConfigModule } from '@nestjs/config';
@Module({
  imports: [ConfigModule],
  controllers: [CheckMaterialReceiveController],
  providers: [CheckMaterialReceiveService, DatabaseService],
})
export class CheckMaterialReceiveModule {}
