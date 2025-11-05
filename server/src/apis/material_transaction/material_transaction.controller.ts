import { Controller, Get, Query } from '@nestjs/common';
import { MaterialTransactionService } from './material_transaction.service';
import {MaterialTransaction} from '../../../shared/interfaces/mms-system/transaction';
import { DatabaseService } from '../../database/database.service';
import { get } from 'http';


@Controller('material-transaction')
export class MaterialTransactionController {
  constructor(private readonly materialTransactionService: MaterialTransactionService) {}

  @Get('material-transactions-prod')
  async getMaterialTransactions_Prod(
    @Query('SecCD') SecCD : number,
  ): Promise<MaterialTransaction[]> {
    return await this.materialTransactionService.getMaterialTransactions_Prod(SecCD);
  }
  @Get('material-transactions-mc')
  async getMaterialTransactions_MC(): Promise<MaterialTransaction[]> {
    return await this.materialTransactionService.getMaterialTransactions_MC();
  }
  
}
