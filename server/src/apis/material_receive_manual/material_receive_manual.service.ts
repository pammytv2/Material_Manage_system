import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import {
  Item,
  ItemListResponse,
  Item_List_LotSplit,
} from 'shared/interfaces/mms-system/Item_List';

import { Item_manual } from 'shared/interfaces/mms-system/ManualReceiv';
import * as sql from 'mssql';

@Injectable()
export class MaterialReceiveManualService {
  constructor(private readonly databaseService: DatabaseService) {}

  async getVDCODE(): Promise<any[]> {
    const sqlQuery = `
            SELECT DISTINCT VDCODE, VDNAME FROM view_vendor`;
    return await this.databaseService.query(sqlQuery);
  }
  async getItemList_manual(
    PONUMBER: string[],
    VDCODE: string,
    invoiceNumber?: string,
  ): Promise<any[]> {
    const pool = await this.databaseService.getConnection();
    const request = pool.request();

    const poString = PONUMBER.join(',');
    request.input('PONUMBER', sql.VarChar, poString);
    request.input('VDCODE', sql.VarChar, VDCODE);
    const result = await request.execute('sp_Receive_Material_Manual');
    return result.recordsets;
  }

  async getItemList_spec(): Promise<any[]> {
    const sqlQuery = `
            SELECT  ItemNo,SPEC FROM view_manual_no_po`;
    return await this.databaseService.query(sqlQuery);
  }

  async getLocation(): Promise<any[]> {
    const sqlQuery = `
            SELECT DISTINCT LOCATION FROM view_manual_no_po`;
    return await this.databaseService.query(sqlQuery);
  }
  async getItemList_lotSplit(ItemNo: string): Promise<Item_List_LotSplit[]> {
    const sqlQuery = `
            SELECT ItemNo,Description,Unit,ReceiveQty,LotNo,ExpireDate,Remark,UnitCost,IQARequired,LotRequired
            FROM view_item_list_lot_split
            WHERE ItemNo = @ItemNo`;
    const pool = await this.databaseService.getConnection();
    const request = pool.request();
    request.input('ItemNo', sql.VarChar, ItemNo);
    const result = await request.query<Item_List_LotSplit>(sqlQuery);
    return result.recordset;
  }

  async updateReceiveItems(
    items: { ItemNo: string; ReceiveQty: number }[],
    invoiceNumber: string,
  ): Promise<void> {
    const pool = await this.databaseService.getConnection();
    const transaction = pool.transaction();
    await transaction.begin();

    try {
      for (const item of items) {
        const request = transaction.request();
        request.input('ItemNo', sql.VarChar, item.ItemNo);
        request.input('ReceiveQty', sql.Decimal, item.ReceiveQty);
        request.input('InvoiceNumber', sql.VarChar, invoiceNumber);

        const sqlQuery = `
        UPDATE accpac_sync_poreceipt_icshipment_detail
        SET ReceiveQty = @ReceiveQty, InvoiceNumber = @InvoiceNumber
        WHERE ItemNo = @ItemNo
      `;
        await request.query(sqlQuery);
      }
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async insertNoPoItems(VDCODE: string, invoiceNumber: string): Promise<void> {
    const pool = await this.databaseService.getConnection();
    const transaction = pool.transaction();
    await transaction.begin();

    const request = transaction.request();
    request.input('VDCODE', sql.VarChar, VDCODE);
    request.input('InvoiceNumber', sql.VarChar, invoiceNumber);
    const result = await request.execute('sp_Insert_Manual');
    return result.recordsets;
  }

  async getNoPoItems(ItemNo: string , LOCATION: string): Promise<any[]> {
    const sqlQuery = `
            SELECT * FROM [dbo].[view_manual_no_po] WHERE ItemNo = @ItemNo AND LOCATION = @LOCATION `;
    const pool = await this.databaseService.getConnection();
    const request = pool.request();
    request.input('ItemNo', sql.VarChar, ItemNo);
    request.input('LOCATION', sql.VarChar, LOCATION);
    const result = await request.query(sqlQuery);
    return result.recordset;
  }
}
