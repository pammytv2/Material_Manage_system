import { Injectable, Post } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import {
  Item,
  ItemListResponse,
  Item_List_LotSplit,
} from 'shared/interfaces/mms-system/Item_List';

import { Item_manual } from 'shared/interfaces/mms-system/ManualReceiv';
import * as sql from 'mssql';
import * as request from 'supertest';

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
    request.input('InvoiceNumber', sql.VarChar, invoiceNumber);
    const result = await request.execute('sp_Receive_Material_Manual');
    return result.recordsets;
  }



 async PostItemList_manual(
    VendorCode: string,
    invoiceNumber: string,
    itemNoList: string[], // เปลี่ยนเป็น array
    ReceiveQty: number[], // เปลี่ยนเป็น array
    LOCATION: string,
): Promise<any[]> {
    const pool = await this.databaseService.getConnection();
    const request = pool.request();
    
    // แปลง array เป็น string คั่นด้วย comma
    const itemNoString = itemNoList.join(',');
    const receiveQtyString = ReceiveQty.join(',');
    
    request.input('VendorCode', sql.VarChar, VendorCode);
    request.input('InvoiceNumber', sql.VarChar, invoiceNumber);
    request.input('ItemNo', sql.VarChar, itemNoString); // ตรงกับ @ItemNo ใน SP
    request.input('ReceiveQtyList', sql.VarChar, receiveQtyString);
    request.input('Location', sql.VarChar, LOCATION); // ตรงกับ @Location ใน SP
    
    const result = await request.execute('sp_Insert_Manual');
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
        IF EXISTS (SELECT 1 FROM accpac_sync_poreceipt_icshipment_detail WHERE ItemNo = @ItemNo AND InvoiceNumber = @InvoiceNumber)
        BEGIN
          UPDATE accpac_sync_poreceipt_icshipment_detail
          SET ReceiveQty = @ReceiveQty
          WHERE ItemNo = @ItemNo AND InvoiceNumber = @InvoiceNumber
        END
        ELSE
        BEGIN
          INSERT INTO accpac_sync_poreceipt_icshipment_detail (ItemNo, ReceiveQty, InvoiceNumber)
          VALUES (@ItemNo, @ReceiveQty, @InvoiceNumber)
        END
            `;
        await request.query(sqlQuery);
      }
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async insertNoPoItems(
    VDCODE: string,
    invoiceNumber: string,
    ReceiveQty: number,
    itemNo: string,
  ): Promise<any> {
    const pool = await this.databaseService.getConnection();
    const transaction = pool.transaction();
    await transaction.begin();
    const request = transaction.request();
    request.input('VDCODE', sql.VarChar, VDCODE);
    request.input('InvoiceNumber', sql.VarChar, invoiceNumber);
    request.input('ReceiveQty', sql.Decimal, ReceiveQty);
    request.input('itemNo', sql.VarChar, itemNo); // Assuming itemNo is passed as a string
    const result = await request.execute('sp_Insert_Manual');
    await transaction.commit();
    return result.recordsets;
  }

  async getNoPoItems(ItemNo: string, LOCATION: string): Promise<any[]> {
    const sqlQuery = `
            SELECT * FROM [dbo].[view_manual_no_po] WHERE ItemNo = @ItemNo AND LOCATION = @LOCATION `;
    const pool = await this.databaseService.getConnection();
    const request = pool.request();
    request.input('ItemNo', sql.VarChar, ItemNo);
    request.input('LOCATION', sql.VarChar, LOCATION);
    const result = await request.query(sqlQuery);
    return result.recordset;
  }

  async showItem_manual(): Promise<any[]> {
    const sqlQuery = `
    SELECT
  InvoiceNumber,
  STUFF(
    (SELECT DISTINCT ',' + LTRIM(RTRIM(PoNumber))
     FROM [dbo].[accpac_sync_poreceipt_icshipment_detail] d2
     WHERE d2.InvoiceNumber = d1.InvoiceNumber AND Ismanual = 1
     FOR XML PATH(''), TYPE).value('.', 'NVARCHAR(MAX)'), 1, 1, ''
  ) AS PoNumber,
  VendorCode,
  VendorName
FROM [dbo].[accpac_sync_poreceipt_icshipment_detail] d1
WHERE Ismanual = 1
GROUP BY InvoiceNumber, VendorCode, VendorName;`;
    return await this.databaseService.query(sqlQuery);
  }
  
  async showItem_manual_detail(invoiceNumber: string, poString?: string): Promise<any[]> {
    const pool = await this.databaseService.getConnection();
    const request = pool.request();
    let sqlQuery = `
      SELECT * FROM [dbo].[accpac_sync_poreceipt_icshipment_detail]
      WHERE InvoiceNumber = @InvoiceNumber
    `;
    request.input('InvoiceNumber', sql.VarChar, invoiceNumber);

    if (poString) {
      sqlQuery += ' OR PoNumber = @PONUMBER';
      request.input('PONUMBER', sql.VarChar, poString);
    }

    const result = await request.query(sqlQuery);
    return result.recordset;
  }
  async insert_single_no_po_item(
    invoiceNumber: string,
    ReceiveQty: number,
    itemNo: string,
  ): Promise<any> {
    const pool = await this.databaseService.getConnection();
    const transaction = pool.transaction();
    await transaction.begin();
    try {
      // เปลี่ยนจาก ReceiveQty = ReceiveQty + @ReceiveQty เป็น ReceiveQty = @ReceiveQty
      const sqlQuery = `UPDATE accpac_sync_poreceipt_icshipment_detail
                         SET ReceiveQty = @ReceiveQty
                         WHERE ItemNo = @ItemNo AND InvoiceNumber = @InvoiceNumber AND Ismanual = 1`;

      const request = transaction.request();
      request.input('ReceiveQty', sql.Decimal, ReceiveQty);
      request.input('ItemNo', sql.VarChar, itemNo);
      request.input('InvoiceNumber', sql.VarChar, invoiceNumber);

      const result = await request.query(sqlQuery);
      await transaction.commit();

      return result.recordset;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  


}
