import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import {
  Item,
  ItemListResponse,
  Item_List_LotSplit,
} from 'shared/interfaces/mms-system/Item_List';
import * as sql from 'mssql';

@Injectable()
export class CheckMaterialReceiveService {
  constructor(private readonly databaseService: DatabaseService) {}

  async getItemIQA(): Promise<any[]> {
    const sqlQuery = `
       SELECT 
    t.ReceiveNo,
    t.InvoiceNumber,
    a.VendorCode,
    a.VendorName,
    COUNT(DISTINCT t.ITEMNO) AS lotcount
FROM 
    test_lot_status_iqa_check t
LEFT JOIN 
    accpac_sync_poreceipt_icshipment_detail a
    ON t.ITEMNO = a.ITEMNO
GROUP BY 
    t.InvoiceNumber, a.VendorCode, a.VendorName ,t.ReceiveNo `;
    return await this.databaseService.query(sqlQuery);
  }
  async sumIQA(
    invoiceNumber: string,
  ): Promise<any[]> {
    const pool = await this.databaseService.getConnection();
    const transaction = pool.transaction();
    await transaction.begin();
    const request = transaction.request();
    request.input('InvoiceNumber', sql.VarChar, invoiceNumber);
   const result = await request.execute('sp_Submit_to_IQA');
   await transaction.commit();
   return result.recordsets;
}
  async getItemLotSplit(
    invoiceNumber: string,
  ): Promise<Item_List_LotSplit[]> {
    const sqlQuery = `SELECT InvoiceNumber,ReceiveNo,lot_no,ITEMNO,lot_qty FROM test_lot_status_iqa_check  WHERE  InvoiceNumber  = @InvoiceNumber`;
    const pool = await this.databaseService.getConnection();
    const request = pool.request();
    request.input('InvoiceNumber', sql.VarChar, invoiceNumber);
    const result = await request.query(sqlQuery);
    return result.recordset;
}
}
