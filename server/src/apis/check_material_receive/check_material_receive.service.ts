import { Injectable, Post } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { IqaCheck } from '../../../shared/interfaces/mms-system/iqa_check';

import {
  Item,
  ItemListResponse,
  Item_List_LotSplit,
} from 'shared/interfaces/mms-system/Item_List';
import * as sql from 'mssql';
import { Iqaabnormal } from 'shared/interfaces/mms-system/iqa_abnormal';

@Injectable()
export class CheckMaterialReceiveService {
  constructor(private readonly databaseService: DatabaseService) {}

  async getItemIQA(): Promise<IqaCheck[]> {
    const sqlQuery = `
  SELECT * FROM view_iqa_check_status `;
    return await this.databaseService.query(sqlQuery);
  }
  async getIttemIQA_inspec(): Promise<IqaCheck[]> {
    const sqlQuery = `
  SELECT * FROM view_iqa_check_status_inspec `;
    return await this.databaseService.query(sqlQuery);
  }
  // async getItemIQA_abnormal(): Promise<Iqaabnormal[]> {
  //   const sqlQuery = `
  // SELECT * FROM view_iqa_abnormal `;
  //   return await this.databaseService.query(sqlQuery);
  // }

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

  async Update_status_iqa_check_Inspec(
    lot_no: string,
    InvoiceNumber: string,
    ReceiveNo: string,
    status_Inspec?: string,
    inspec_user?: string,
    remark_inspec?: string,
  ): Promise<void> {
    const sqlQuery = `UPDATE test_lot_status_iqa_check
  SET status_Inspec = @status_Inspec, remark_inspec = @remark_inspec,lot_no_check = 1, inspec_user = @inspec_user,inspec_date = GETDATE()
  WHERE InvoiceNumber = @InvoiceNumber AND ReceiveNo = @ReceiveNo AND lot_no = @lot_no;`;

    const pool = await this.databaseService.getConnection();
    const request = pool.request();
    request.input('lot_no', sql.VarChar, lot_no);
    request.input('InvoiceNumber', sql.VarChar, InvoiceNumber);
    request.input('ReceiveNo', sql.VarChar, ReceiveNo);
    request.input('status_Inspec', sql.VarChar, status_Inspec);
    request.input('remark_inspec', sql.VarChar, remark_inspec);
    request.input('inspec_user', sql.VarChar, inspec_user);
    await request.query(sqlQuery);
  }

  // qty
  async Update_status_iqa_check(
    lot_no: string,
    status: string,
    remark_iqa: string,
    lot_user: string,
    InvoiceNumber: string,
    ReceiveNo: string,
  ): Promise<void> {
    const sqlQuery = `UPDATE test_lot_status_iqa_check
  SET status = @status, remark_iqa = @remark_iqa,Iqa_check = 1,qty_date = GETDATE(), lot_user = @lot_user
  WHERE InvoiceNumber = @InvoiceNumber AND ReceiveNo = @ReceiveNo AND lot_no = @lot_no;`;
    const pool = await this.databaseService.getConnection();
    const request = pool.request();
    request.input('lot_no', sql.VarChar, lot_no);
    request.input('status', sql.VarChar, status);
    request.input('remark_iqa', sql.VarChar, remark_iqa);
    request.input('InvoiceNumber', sql.VarChar, InvoiceNumber);
    request.input('ReceiveNo', sql.VarChar, ReceiveNo);
    request.input('lot_user', sql.VarChar, lot_user);
    await request.query(sqlQuery);
  }

  async Update_status_iqa_check_Inspec_all(
    ITEMNO: string,
    InvoiceNumber: string,
    inspec_user?: string,
    status_Inspec?: string,
    remark_inspec?: string,
  ): Promise<void> {
    const sqlQuery = `UPDATE test_lot_status_iqa_check
  SET status_Inspec = @status_Inspec, remark_inspec = @remark_inspec, inspec_user = @inspec_user,lot_no_check = 1, inspec_date = GETDATE()
  WHERE InvoiceNumber = @InvoiceNumber AND  ITEMNO = @ITEMNO;`;
    const pool = await this.databaseService.getConnection();
    const request = pool.request();
    request.input('ITEMNO', sql.VarChar, ITEMNO);
    request.input('InvoiceNumber', sql.VarChar, InvoiceNumber);
    request.input('status_Inspec', sql.VarChar, status_Inspec);
    request.input('remark_inspec', sql.VarChar, remark_inspec);
    request.input('inspec_user', sql.VarChar, inspec_user);
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

  async Add_Abnormal_Number(
    abnormal_user: string,
    Abnormal_Number: string,
    InvoiceNumber: string,
    lot_no: string,
    ITEMNO: string,
  ): Promise<void> {
    const sqlQuery = `UPDATE iqa_abnormal_aumber  

SET Abnormal_Number = @Abnormal_Number ,abnormal_user = @abnormal_user
WHERE InvoiceNumber = @InvoiceNumber AND lot_no = @lot_no AND ITEMNO = @ITEMNO;`;
    const pool = await this.databaseService.getConnection();
    const request = pool.request();
    request.input('abnormal_user', sql.VarChar, abnormal_user);
    request.input('Abnormal_Number', sql.VarChar, Abnormal_Number);
    request.input('InvoiceNumber', sql.VarChar, InvoiceNumber);
    request.input('lot_no', sql.VarChar, lot_no);
    request.input('ITEMNO', sql.VarChar, ITEMNO);
    await request.query(sqlQuery);
  }
  async Add_Abnormal_Number_all(
    abnormal_user: string,
    Abnormal_Number: string,
    InvoiceNumber: string,
    ITEMNO: string,
  ): Promise<void> {
    const sqlQuery = `UPDATE iqa_abnormal_aumber  

SET Abnormal_Number = @Abnormal_Number , abnormal_user = @abnormal_user
WHERE InvoiceNumber = @InvoiceNumber AND ITEMNO = @ITEMNO;`;

    const pool = await this.databaseService.getConnection();
    const request = pool.request();
    request.input('abnormal_user', sql.VarChar, abnormal_user);
    request.input('Abnormal_Number', sql.VarChar, Abnormal_Number);
    request.input('InvoiceNumber', sql.VarChar, InvoiceNumber);
    request.input('ITEMNO', sql.VarChar, ITEMNO);
    await request.query(sqlQuery);
  }

  async addItemListTransaction_MC_PROD(): Promise<any[]> {
    const pool = await this.databaseService.getConnection();
    const request = pool.request();
    const result = await request.execute('sp_transaction_MC_PROD');
    return result.recordsets;
  }
  async mc_view_iqa_status(): Promise<IqaCheck[]> {
    const sqlQuery = `SELECT * FROM view_iqa_stuts  `;
    return await this.databaseService.query(sqlQuery);
  }
  async mc_recnum(InvoiceNumber: string): Promise<Item[]> {
    const sqlQuery = `SELECT h.ReciveDate FROM accpac_sync_poreceipt_icshipment_detail d
    LEFT JOIN accpac_sync_poreceipt_icshipment_h h
    ON d.InvoiceNumber = h.InvoiceNumber
    WHERE h.InvoiceNumber = @InvoiceNumber
    GROUP BY h.ReciveDate
`;
    const pool = await this.databaseService.getConnection();
    const request = pool.request();
    request.input('InvoiceNumber', sql.VarChar, InvoiceNumber);
    const result = await request.query(sqlQuery);
    return result.recordset;
  }

  async iqa_view_item_normal(): Promise<Iqaabnormal[]> {
    const sqlQuery = `SELECT * FROM  view_iqa_abnormal  `;
    return await this.databaseService.query(sqlQuery);
  }

  async insert_item_normal(): Promise<Iqaabnormal[]> {
    const pool = await this.databaseService.getConnection();
    const transaction = pool.transaction();
    await transaction.begin();
    const request = transaction.request();
    const result = await request.execute('sp_iqa_insert_abnormal');
    await transaction.commit();
    return result.recordsets;
  }
}
