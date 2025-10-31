import { Injectable, Post } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { IqaCheck } from '../../../shared/interfaces/mms-system/iqa_check';
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
  i.IQA_Status,
  COUNT(DISTINCT t.ITEMNO) AS lotcount
FROM
  test_lot_status_iqa_check t
  LEFT JOIN accpac_sync_poreceipt_icshipment_detail a ON t.ReceiveNo = a.ReceptNumber
  LEFT JOIN view_iqa_check_status i ON t.ReceiveNo = i.ReceiveNo
GROUP BY
  t.InvoiceNumber,
  a.VendorCode,
  a.VendorName,
  t.ReceiveNo,
  i.IQA_Status `;
    return await this.databaseService.query(sqlQuery);
  }

  async sumIQA(invoiceNumber: string, itemNo: string): Promise<any[]> {
    const pool = await this.databaseService.getConnection();
    const transaction = pool.transaction();
    await transaction.begin();
    const request = transaction.request();
    request.input('InvoiceNumber', sql.VarChar, invoiceNumber);
    request.input('ITEMNO', sql.VarChar, itemNo);
    const result = await request.execute('sp_Submit_to_IQA');
    await transaction.commit();
    return result.recordsets;
  }

  async getItemLotSplit(invoiceNumber: string): Promise<IqaCheck[]> {
    const sqlQuery = `SELECT 
      t.InvoiceNumber,
      t.ReceiveNo,
      t.lot_no,
      t.ITEMNO,
      v.ITEMDesc,
      t.remark,
      t.remark_iqa,
      t.lot_qty,
      t.status,
      s.Description AS StatusDescription
  FROM test_lot_status_iqa_check t
  LEFT JOIN view_item_accpac_all v
      ON t.ITEMNO = v.ITEMNO COLLATE Thai_100_CI_AI
      
  LEFT JOIN  lot_status_iqa_check s 
        ON t.status  = s.IQA_Name
  WHERE t.InvoiceNumber = @InvoiceNumber`;
    const pool = await this.databaseService.getConnection();
    const request = pool.request();
    request.input('InvoiceNumber', sql.VarChar, invoiceNumber);
    const result = await request.query(sqlQuery);
    return result.recordset;
  }
  async get_status_iqa_check(): Promise<IqaCheck[]> {
    const sqlQuery = `SELECT * FROM lot_status_iqa_check
                    WHERE IQA_ID IN (3, 4 , 9);`;
    return await this.databaseService.query(sqlQuery);
  }
  async Update_status_iqa_check(
    lot_no: string,
    status: string,
    remark_iqa: string,
    InvoiceNumber: string,
    ReceiveNo: string,
  ): Promise<void> {
    const sqlQuery = `UPDATE test_lot_status_iqa_check
  SET status = @status, remark_iqa = @remark_iqa,Iqa_check = 1
  WHERE InvoiceNumber = @InvoiceNumber AND ReceiveNo = @ReceiveNo AND lot_no = @lot_no;`;
    const pool = await this.databaseService.getConnection();
    const request = pool.request();
    request.input('lot_no', sql.VarChar, lot_no);
    request.input('status', sql.VarChar, status);
    request.input('remark_iqa', sql.VarChar, remark_iqa);
    request.input('InvoiceNumber', sql.VarChar, InvoiceNumber);
    request.input('ReceiveNo', sql.VarChar, ReceiveNo);
    await request.query(sqlQuery);
  }

  async Complete_iqa_check(
    lot_no: string,
    InvoiceNumber: string,
    ReceiveNo: string,
  ): Promise<void> {
    const sqlQuery = `UPDATE test_lot_status_iqa_check
  SET  Iqa_check = 1
  WHERE InvoiceNumber = @InvoiceNumber AND ReceiveNo = @ReceiveNo AND lot_no = @lot_no;`;
    const pool = await this.databaseService.getConnection();
    const request = pool.request();
    request.input('lot_no', sql.VarChar, lot_no);
    request.input('InvoiceNumber', sql.VarChar, InvoiceNumber);
    request.input('ReceiveNo', sql.VarChar, ReceiveNo);
    await request.query(sqlQuery);
  }

  async addItemListTransaction_MC_PROD(): Promise<any[]> {
    const pool = await this.databaseService.getConnection();
    const request = pool.request();
    const result = await request.execute('sp_transaction_MC_PROD');
    return result.recordsets;
  }
}
