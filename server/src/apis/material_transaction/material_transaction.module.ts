import { Module } from '@nestjs/common';
import { MaterialTransactionService } from './material_transaction.service';
import { MaterialTransactionController } from './material_transaction.controller';
import { DatabaseService } from '../../database/database.service';
import { ConfigModule } from '@nestjs/config';
@Module({
  imports: [ConfigModule],
  controllers: [MaterialTransactionController],
  providers: [MaterialTransactionService, DatabaseService],
})
export class MaterialTransactionModule {}
