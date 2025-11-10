import { Module } from '@nestjs/common';
import { MaterialRequestService } from './material_request.service';
import { MaterialRequestController } from './material_request.controller';
import { ConfigModule } from '@nestjs/config';
import { DatabaseService } from '../../database/database.service';
@Module({
  imports: [ConfigModule],
  controllers: [MaterialRequestController],
  providers: [MaterialRequestService, DatabaseService],
})
export class MaterialRequestModule {}
