import { Injectable } from '@nestjs/common';
import {MaterialTransaction} from '../../../shared/interfaces/mms-system/transaction';
import { DatabaseService } from '../../database/database.service';
import * as sql from 'mssql';

@Injectable()
export class MaterialTransactionService {
  constructor(private readonly databaseService: DatabaseService) {}


    async getMaterialTransactions_Prod(SecCD : number): Promise<MaterialTransaction[]> {
       const pool = await this.databaseService.getConnection();
       const transaction = pool.transaction();
       await transaction.begin();
       const request = transaction.request();
       request.input('SecCD', sql.Int, SecCD);
       const result = await request.execute('sp_Prod_ViewItem_Transaction');
       await transaction.commit();
       return result.recordset;
    }
    async getMaterialTransactions_MC(): Promise<MaterialTransaction[]> {
         const sqlQuery = `SELECT * FROM view_transaction_MC`;
            return await this.databaseService.query(sqlQuery);

    }
    


}
