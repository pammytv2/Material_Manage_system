import { Injectable } from '@nestjs/common';
import { POReceipt_ICShipment } from 'shared/interfaces/mms-system/POReceipt_ICShipment';
import {
  Item,
  ItemListResponse,
  Item_List_LotSplit,
  CreateItem,
} from 'shared/interfaces/mms-system/Item_List';
import { DatabaseService } from '../../database/database.service';
import * as sql from 'mssql';

@Injectable()
export class MaterialManageService {
  constructor(private readonly databaseService: DatabaseService) {}
  async findAllPOReceipt_ICShipment(): Promise<POReceipt_ICShipment[]> {
    const sqlQuery: string = `SELECT * FROM accpac_sync_poreceipt_icshipment_h`;
    return await this.databaseService.query(sqlQuery);
  }

  async type2(): Promise<any[]> {
    const sqlQuery = 'SELECT Type2ID, Type2Name FROM type2';
    return await this.databaseService.query(sqlQuery);
  }

  async findAll_LotSplit(): Promise<ItemListResponse[]> {
    const sqlQuery = 'SELECT LotSplit_ID,LotSplit_Name FROM  lot_status_split';
    return await this.databaseService.query(sqlQuery);
  }
  async findAll_IQA(): Promise<Item[]> {
    const sqlQuery = 'SELECT IQA_ID,IQA_Name FROM lot_status_iqa';
    return await this.databaseService.query(sqlQuery);
  }
  async findAll_Exp_Data(): Promise<Item_List_LotSplit[]> {
    const sqlQuery = 'SELECT Exp_ID , Exp_Name FROM lot_status_expdata;';
    return await this.databaseService.query(sqlQuery);
  }

  async findAll_zone(): Promise<any[]> {
    const sqlQuery = 'SELECT ZoneID,ZoneName,ZoneCode FROM storage_zone';
    return await this.databaseService.query(sqlQuery);
  }

  async ExamineNull_Item(): Promise<any> {
    const sqlQuery = `EXEC sp_ExamineNull_Item`;
    return await this.databaseService.query(sqlQuery);
  }

  async Count_Item_Null(): Promise<any> {
    const sqlQuery = `EXEC sp_Count_Item_Null`;
    return await this.databaseService.query(sqlQuery);
  }
  async getAllInactiveItem(): Promise<any> {
    const sqlQuery = `SELECT * FROM lot_status_Inactive`;
    console.log(sqlQuery);
    return await this.databaseService.query(sqlQuery);
  }

  async addItem(item: CreateItem): Promise<any> {
    console.log('Received item:', item);
    const sqlQuery = `EXEC sp_InsertData 
    @ItemNo = @ItemNo,
    @Max = @Max,
    @Min = @Min,
    @Type2ID = @Type2ID,
    @Packing = @Packing,
    @ZoneID = @ZoneID,
    @LotSplit = @LotSplit,
    @IQA = @IQA,
    @ExpDate = @ExpDate`;

    const result = await this.databaseService.query(sqlQuery, [
      { name: 'ItemNo', type: sql.VarChar, value: item.ItemNo },
      { name: 'Type2ID', type: sql.Int, value: item.Type2ID },
      { name: 'Packing', type: sql.Int, value: item.Packing },
      { name: 'ZoneID', type: sql.Int, value: item.ZoneID },
      { name: 'LotSplit', type: sql.Int, value: item.LotSplit },
      { name: 'IQA', type: sql.Int, value: item.IQA },
      { name: 'ExpDate', type: sql.Int, value: item.ExpDate },
      { name: 'Min', type: sql.Int, value: item.Min },
      { name: 'Max', type: sql.Int, value: item.Max },
    ]);

    return { success: true, result };
  }
  async updateItem_new(item: CreateItem): Promise<any> {
    console.log('Received item for update:', item);
    const sqlQuery = `UPDATE item_test1
SET
    Type2ID = @Type2ID,
    Packing = @Packing,
    ZoneID = @ZoneID,
    LotSplit = @LotSplit,
    IQA = @IQA,
    ExpDate = @ExpDate,
    Max = @Max,
    Min = @Min,
    UpdateDate = GETDATE(),
    UpdateBy = SYSTEM_USER
WHERE ItemNo = @ItemNo`;
    return await this.databaseService.query(sqlQuery, [
      { name: 'ItemNo', type: sql.VarChar, value: item.ItemNo },
      { name: 'Type2ID', type: sql.Int, value: item.Type2ID },
      { name: 'Packing', type: sql.Int, value: item.Packing },
      { name: 'ZoneID', type: sql.Int, value: item.ZoneID },
      { name: 'LotSplit', type: sql.Int, value: item.LotSplit },
      { name: 'IQA', type: sql.Int, value: item.IQA },
      { name: 'ExpDate', type: sql.Int, value: item.ExpDate },
      { name: 'Min', type: sql.Int, value: item.Min },
      { name: 'Max', type: sql.Int, value: item.Max },
    ]);
  }

  async itemnewdetail(itemNo: string): Promise<any> {
    const sqlQuery = `SELECT * FROM view_item_accpac_all WHERE ITEMNO = @ItemNo`;
    return await this.databaseService.query(sqlQuery, [
      { name: 'itemNo', type: sql.VarChar, value: itemNo },
    ]);
  }

  async itemType2(): Promise<any[]> {
    const sqlQuery = `
    SELECT i.ItemNo, i.Type2ID, t.Type2Name FROM  item_test1 i
    LEFT JOIN 
    type2 t 
    ON i.Type2ID = t.Type2ID`;

    return await this.databaseService.query(sqlQuery);
  }

  async item_type_update(): Promise<any[]> {
    const sqlQuery = `
    UPDATE i
    SET 
    i.GroupMatID = g.GroupmatID,
    i.UnitPackingID = u.UnitPackingID,
    i.GProdID = gp.GProdID
    FROM item_test1 i
    LEFT JOIN view_item_accpac_all v 
    ON i.ItemNo COLLATE Thai_100_CI_AI = v.ITEMNO COLLATE Thai_100_CI_AI
    LEFT JOIN groupmat_accpac g 
    ON v.GROUPMAT COLLATE Thai_100_CI_AI = g.GroupmatName COLLATE Thai_100_CI_AI
    LEFT JOIN unit_packing u 
    ON v.UNIT COLLATE Thai_100_CI_AI = u.UnitPacking COLLATE Thai_100_CI_AI
    LEFT JOIN group_product gp
    ON v.SECTIONGROUP COLLATE Thai_100_CI_AI = gp.GroupProductName COLLATE Thai_100_CI_AI`;
    return await this.databaseService.query(sqlQuery);
  }

  async activeUpdateItem(): Promise<any> {
  const sqlQuery = `EXEC sp_Compare_inactive_Accpac_MMS`;
  return await this.databaseService.query(sqlQuery);
}
}
  