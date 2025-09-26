import { Injectable } from '@nestjs/common';
import { POReceipt_ICShipment } from 'shared/interfaces/mms-system/POReceipt_ICShipment';
import {
  Item,
  ItemListResponse,
  Item_List_LotSplit,
  CreateItem
} from 'shared/interfaces/mms-system/Item_List';
import { DatabaseService } from '../../database/database.service';
import * as sql from 'mssql';
import { databaseName } from '../../database/constant/database';
import e from 'express';

@Injectable()
export class MaterialManageService {
  constructor(private readonly databaseService: DatabaseService) {}
  async findAllPOReceipt_ICShipment(): Promise<POReceipt_ICShipment[]> {
    const sqlQuery: string = `SELECT * FROM accpac_sync_poreceipt_icshipment_h`;
    return await this.databaseService.query(sqlQuery);
  }

  async unitpacking(): Promise<any> {
    const sqlQuery = `SELECT UnitPackingID, UnitPacking FROM unit_packing;`;
    return await this.databaseService.query(sqlQuery);
  }
  async type2(): Promise<any[]> {
    const sqlQuery = 'SELECT Type2ID, Type2Name FROM type2';
    return await this.databaseService.query(sqlQuery);
  }
  async findAll_Group_Product(): Promise<any[]> {
    const sqlQuery = 'SELECT GProdID,GroupProductName FROM group_product';
    return await this.databaseService.query(sqlQuery);
  }
  async findAll_Group_Material(): Promise<any[]> {
    const sqlQuery = 'SELECT GroupmatID,GroupmatName FROM groupmat_accpac';
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
    const sqlQuery = 'SELECT ZoneID,ZoneName FROM storage_zone';
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

//   async INSERT_New_Item(  
//   ItemNo: string,
//   Type2ID: number,
//   Packing: number,
//   UnitPackingID: number,
//   ZoneID: number,
//   GroupMatID: number,
//   LotSplit: number,
//   IQA: number,
//   ExpDate: number,
// ): Promise<CreateItem[]> {
//   const sqlQuery = `EXEC sp_InsertData`;
//     return await this.databaseService.query(sqlQuery, [
//       {name:'ItemNo', type: sql.VarChar, value: ItemNo},
//       {name:'Type2ID', type: sql.Int, value: Type2ID},
//       {name:'Packing', type: sql.Int, value: Packing},
//       {name:'UnitPackingID', type: sql.Int, value: UnitPackingID},
//       {name:'ZoneID', type: sql.Int, value: ZoneID},
//       {name:'GroupMatID', type: sql.Int, value: GroupMatID},
//       {name:'LotSplit', type: sql.Int, value: LotSplit},
//       {name:'IQA', type: sql.Int, value: IQA},
//       {name:'ExpDate', type: sql.Int, value: ExpDate},
     
//     ]);
// }
}
