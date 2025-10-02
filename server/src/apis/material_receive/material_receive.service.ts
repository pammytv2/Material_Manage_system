import { Injectable, Param } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { POReceipt_ICShipment } from 'shared/interfaces/mms-system/POReceipt_ICShipment';
import {
  Item,
  ItemListResponse,
  Item_List_LotSplit,
} from 'shared/interfaces/mms-system/Item_List';
import * as sql from 'mssql';

@Injectable()
export class MaterialReceiveService {
  constructor(private readonly databaseService: DatabaseService) {}
  //  POReceipt_ICShipment
  async findAllPOReceipt_ICShipment(): Promise<POReceipt_ICShipment[]> {
    const sqlQuery: string = `SELECT * FROM accpac_sync_poreceipt_icshipment_h`;
    return await this.databaseService.query(sqlQuery);
  }

  async findOnePOReceipt_ICShipment(
    receiptNumber: string,
  ): Promise<POReceipt_ICShipment[]> {
    const sqlQuery: string = `SELECT * FROM accpac_sync_poreceipt_icshipment_h WHERE ReceptNumbar = @receiptNumber`;
    return await this.databaseService.query(sqlQuery, [
      { name: 'receiptNumber', type: sql.VarChar, value: receiptNumber },
    ]);
  }

  // Sync RecH_ICH
  async syncRecHICH(startDate: string, endDate: string): Promise<any> {
    const sqlQuery = `
    EXEC sp_Sync_RecH_ICH @StartDate = @startDate, @EndDate = @endDate
  `;
    await this.databaseService.query(sqlQuery, [
      { name: 'startDate', type: sql.VarChar, value: startDate },
      { name: 'endDate', type: sql.VarChar, value: endDate },
    ]);
    const selectQuery = `SELECT * FROM dbo.accpac_sync_poreceipt_icshipment_h WHERE ReciveDate BETWEEN @StartDate AND @EndDate`;
    return await this.databaseService.query(selectQuery, [
      { name: 'StartDate', type: sql.VarChar, value: startDate },
      { name: 'EndDate', type: sql.VarChar, value: endDate },
    ]);
  }

  // Sync RecD_ICH
  async syncData_Detail(receiptNumber: string): Promise<any> {
    // Sync data
    const syncQuery = `
      SELECT * FROM accpac_sync_poreceipt_icshipment_detail WHERE ReceptNumber = @ReceptNumber
    `;
    await this.databaseService.query(syncQuery, [
      { name: 'ReceptNumber', type: sql.NVarChar, value: receiptNumber },
    ]);
    // Return detail
    const selectQuery = `SELECT * FROM accpac_sync_poreceipt_icshipment_detail WHERE ReceptNumber = @receiptNumber`;
    return await this.databaseService.query(selectQuery, [
      { name: 'receiptNumber', type: sql.VarChar, value: receiptNumber },
    ]);
  }

  // Sync Dates
  async syncDates(): Promise<any> {
    const sqlQuery = `
    EXEC sp_CompareActiveItemNo
  `;
    return await this.databaseService.query(sqlQuery);
  }

  async lot_statusIQA(IQAStatusID: number): Promise<any> {
    const sqlQuery = `
      SELECT * FROM lot_status_IQA  WHERE @IQAStatusID = IQAStatusID
    `;
    return await this.databaseService.query(sqlQuery, [
      { name: 'IQAStatusID', type: sql.Int, value: IQAStatusID },
    ]);
  }
  async lot_SplitStatus(ItemNo: number): Promise<any> {
    const sqlQuery = `
      SELECT ItemNo , LotSplit FROM item_test WHERE ItemNo = @ItemNo
    `;
    return await this.databaseService.query(sqlQuery, [
      { name: 'ItemNo', type: sql.Int, value: ItemNo },
    ]);
  }

  async insert_LotSplit(
    ItemNo: string,
    LotSplit: string,
    receiveno: string,
    lot_unit: string,
    exp_date: Date,
    remark: string,
    isProblem: boolean | string,
    lot_qty: number,
  ): Promise<Item_List_LotSplit[]> {
    // Log เพื่อ debug
    console.log('Received isProblem:', isProblem, 'Type:', typeof isProblem);

    const sqlQuery = `
      INSERT INTO mat_lot_Split (
      lot_no, ITEMNO, ReceiveNo, lot_unit, exp_date, 
      created_at, remark, isProblem, lot_qty
    ) VALUES (
      @LotSplit, @ItemNo, @ReceptNumber, @LotUnit, @ExpDate,
      GETDATE(), @Remark, @IsProblem, @LotQty
    )                                
  `;
    let booleanValue: boolean;
    if (typeof isProblem === 'string') {
      booleanValue = (isProblem as string).toLowerCase() === 'true';
    } else {
      booleanValue = Boolean(isProblem);
    }

    const isProblemValue = booleanValue === true ? 1 : 0;
    console.log('Converted isProblem to:', isProblemValue);

    return await this.databaseService.query(sqlQuery, [
      { name: 'ItemNo', type: sql.NVarChar, value: ItemNo },
      { name: 'LotSplit', type: sql.NVarChar, value: LotSplit },
      { name: 'ReceptNumber', type: sql.NVarChar, value: receiveno },
      { name: 'LotUnit', type: sql.NVarChar, value: lot_unit },
      { name: 'ExpDate', type: sql.Date, value: exp_date },
      { name: 'Remark', type: sql.NVarChar, value: remark },
      { name: 'IsProblem', type: sql.Bit, value: isProblemValue },
      { name: 'LotQty', type: sql.Int, value: lot_qty },
    ]);
  }

  async lot_Split_BY_Rec_and_ItemNo(
    receiveno: string,
    itemNo: string,
  ): Promise<Item_List_LotSplit[]> {
    const sqlQuery = `
    EXEC sp_Get_mat_lot_Split @ReceiveNo = @ReceptNumber, @ITEMNO = @ItemNo
  `;
    return await this.databaseService.query(sqlQuery, [
      { name: 'ReceptNumber', type: sql.NVarChar, value: receiveno },
      { name: 'ItemNo', type: sql.NVarChar, value: itemNo },
    ]);
  }

  async update_LotSplit(
    id: number,
    ItemNo: string,
    LotSplit: string,
    receiveno: string,
    lot_unit: string,
    exp_date: Date,
    remark: string,
    isProblem: boolean | string,
    lot_qty: number,
  ): Promise<Item_List_LotSplit[]> {
    console.log(
      'Update Lot Split - ID:',
      id,
      'isProblem:',
      isProblem,
      'Type:',
      typeof isProblem,
    );

    const sqlQuery = `
    UPDATE mat_lot_Split 
    SET 
      lot_no = @LotSplit,
      ReceiveNo = @ReceptNumber,
      lot_unit = @LotUnit,
      exp_date = @ExpDate,
      updated_at = GETDATE(),       
      remark = @Remark,
      isProblem = @IsProblem,
      lot_qty = @LotQty
    WHERE id = @Id           
  `;

    let isProblemValue: number;
    if (typeof isProblem === 'string') {
      isProblemValue = isProblem.toLowerCase() === 'true' ? 1 : 0;
    } else {
      isProblemValue = isProblem === true ? 1 : 0;
    }

    console.log('Converted isProblem to:', isProblemValue);

    return await this.databaseService.query(sqlQuery, [
      { name: 'Id', type: sql.Int, value: id },
      { name: 'ItemNo', type: sql.NVarChar, value: ItemNo },
      { name: 'LotSplit', type: sql.NVarChar, value: LotSplit },
      { name: 'ReceptNumber', type: sql.NVarChar, value: receiveno },
      { name: 'LotUnit', type: sql.NVarChar, value: lot_unit },
      { name: 'ExpDate', type: sql.Date, value: exp_date },
      { name: 'Remark', type: sql.NVarChar, value: remark },
      { name: 'IsProblem', type: sql.Bit, value: isProblemValue },
      { name: 'LotQty', type: sql.Int, value: lot_qty },
    ]);
  }

  async delete_LotSplit(
    receiveno: string,
    itemNo: string,
    lotNo: string,
  ): Promise<any> {
    const sqlQuery = `
    DELETE FROM mat_lot_Split WHERE  ReceiveNo = @ReceptNumber AND ITEMNO = @ItemNo AND lot_no = @LotNo
  `;
    return await this.databaseService.query(sqlQuery, [
      { name: 'ReceptNumber', type: sql.NVarChar, value: receiveno },
      { name: 'ItemNo', type: sql.NVarChar, value: itemNo },
      { name: 'LotNo', type: sql.NVarChar, value: lotNo },
    ]);
  }

  async material_split(startDate: string, endDate: string): Promise<any> {
    const sqlQuery = `SELECT * FROM accpac_sync_poreceipt_icshipment_h WHERE ReciveDate BETWEEN @StartDate AND @EndDate`;

    return await this.databaseService.query(sqlQuery, [
      { name: 'StartDate', type: sql.VarChar, value: startDate },
      { name: 'EndDate', type: sql.VarChar, value: endDate },
    ]);
  }

  async item_list(): Promise<Item[]> {
    const sqlQuery = `
         SELECT 
        i.*,        
        t.Type2Name,
        z.ZoneCode,
        v.ITEMDesc,
        v.TYPE,
        v.UNIT,
        v.SECTIONGROUP,
        v.GROUPMAT,
        v.VENDOR,
        v.PROJECT,
        v.CATEGORY,
        v.PARTCHIP,
        v.SPEC
       
        
    FROM item_test1 i
    LEFT JOIN view_item_accpac_all v ON i.ItemNo COLLATE Thai_100_CI_AI = v.ITEMNO COLLATE Thai_100_CI_AI
    LEFT JOIN  type2 t ON i.Type2ID = t.Type2ID
    LEFT JOIN storage_zone z ON i.ZoneID = z.ZoneID 
    `;

    return await this.databaseService.query(sqlQuery);
  }
  async item_by_itemNo(itemNo: string): Promise<Item[]> {
    const sqlQuery = ` SELECT 
        i.*,
        t.Type2Name,
        z.ZoneCode,
        v.UNIT,
        v.GROUPMAT,
        v.SECTIONGROUP,
        v.ITEMDesc,
        v.TYPE,
        v.VENDOR,
        v.PROJECT,
        v.CATEGORY,
        v.PARTCHIP,
        v.SPEC
       
        
    FROM item_test1 i
    LEFT JOIN view_item_accpac_all v ON i.ItemNo COLLATE Thai_100_CI_AI = v.ITEMNO COLLATE Thai_100_CI_AI
    LEFT JOIN  type2 t ON i.Type2ID = t.Type2ID
    LEFT JOIN storage_zone z ON i.ZoneID = z.ZoneID 
    
   
    
     WHERE i.ITEMNO = @itemNo`;
    return await this.databaseService.query(sqlQuery, [
      { name: 'ItemNo', type: sql.NVarChar, value: itemNo },
    ]);
  }

  async update_item_List(
    itemNo: string,
    Inactive: number,
    LotSplit: number,
    Packing: number,
    Type2: number,
    IQA: number,
    ExpDate: number,
    GroupMatID: number,
    Min: number,
    Max: number,
    GProdID: number,
    ZoneID: number,
  ): Promise<ItemListResponse[]> {
    const sqlQuery = `
    EXEC sp_Get_Item
      @itemNo = @ItemNo,
      @Inactive = @Inactive,
      @LotSplit = @LotSplit,
      @Packing = @Packing,
      @Type2 = @Type2,
      @IQA = @IQA,
      @ExpDate = @ExpDate,
      @GroupMatID = @GroupMatID,
      @Min = @Min,
      @Max = @Max,
      @GProdID = @GProdID,
      @ZoneID = @ZoneID
  `;
    return await this.databaseService.query(sqlQuery, [
      { name: 'ItemNo', type: sql.NVarChar, value: itemNo },
      { name: 'Inactive', type: sql.Int, value: Inactive },
      { name: 'LotSplit', type: sql.Int, value: LotSplit },
      { name: 'Packing', type: sql.Int, value: Packing },
      { name: 'Type2', type: sql.Int, value: Type2 },
      { name: 'IQA', type: sql.Int, value: IQA },
      { name: 'ExpDate', type: sql.Int, value: ExpDate },
      { name: 'GroupMatID', type: sql.Int, value: GroupMatID },
      { name: 'Min', type: sql.Int, value: Min },
      { name: 'Max', type: sql.Int, value: Max },
      { name: 'GProdID', type: sql.Int, value: GProdID },
      { name: 'ZoneID', type: sql.Int, value: ZoneID },
    ]);
  }

  async unitpacking(): Promise<any> {
    const sqlQuery = `EXEC sp_Get_Dropdown`;
    return await this.databaseService.query(sqlQuery);
  }
}
