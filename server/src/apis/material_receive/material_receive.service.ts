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
 
 async syncRecD (receiceNumbde:string , StatusRecIC:string): Promise<any> {
  const sqlQuery = `EXEC sp_Sync_RecD_ICD @ReceptNumber = @receiceNumbde, @StatusRecIC = @StatusRecIC`;
  await this.databaseService.query(sqlQuery, [
    { name: 'receiceNumbde', type: sql.NVarChar, value: receiceNumbde },
    { name: 'StatusRecIC', type: sql.NVarChar, value: StatusRecIC },
  ]);
  const selectQuery = `SELECT * FROM dbo.accpac_sync_poreceipt_icshipment_detail WHERE ReceptNumber = @ReceptNumber`;
  return await this.databaseService.query(selectQuery, [
    { name: 'ReceptNumber', type: sql.VarChar, value: receiceNumbde },
    { name: 'StatusRecIC', type: sql.VarChar, value: StatusRecIC },
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
    const selectQuery = `SELECT * FROM dbo.view_accpac_sync_poreceipt_icshipment_h WHERE ReciveDate BETWEEN @StartDate AND @EndDate`;
    return await this.databaseService.query(selectQuery, [
      { name: 'StartDate', type: sql.VarChar, value: startDate },
      { name: 'EndDate', type: sql.VarChar, value: endDate },
    ]);
  }

   async syncneeddate(): Promise<any> {
    const sqlQuery = `
    EXEC sp_Sync_needdate
  `;
    return await this.databaseService.query(sqlQuery);
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

async syncData_Detail_Split(InvoiceNumber: string): Promise<any> {
    // Sync data
    const syncQuery = `
   WITH ranked_lot AS (
  SELECT
    d.*,
    -- Replace t.status with IQA_Name logic
    CASE 
      WHEN d.IQA = 0 AND m.ITEMNO IS NOT NULL THEN 'PASS'
      WHEN d.IQA = 0 THEN 'NOT_REQUIRED'
      ELSE s.IQA_Name
    END AS status,
    m.isProblem,
    t.remark_iqa,
    ROW_NUMBER () OVER (
      PARTITION BY d.ReceptNumber, d.ITEMNO 
      ORDER BY CASE WHEN t.status = 'FAIL' THEN 1 ELSE 2 END
    ) AS rn 
  FROM
    accpac_sync_poreceipt_icshipment_detail d
    LEFT JOIN test_lot_status_iqa_check t 
      ON d.ReceptNumber = t.ReceiveNo 
      AND d.InvoiceNumber = t.InvoiceNumber 
      AND d.ITEMNO = t.ITEMNO
    LEFT JOIN lot_status_iqa_check s 
      ON t.status = s.IQA_Name
    LEFT JOIN mat_lot_Split m 
      ON d.ITEMNO = m.ITEMNO 
  WHERE
    d.InvoiceNumber = @InvoiceNumber
)
SELECT
  *
FROM
  ranked_lot 
WHERE
  rn = 1
    `;
    await this.databaseService.query(syncQuery, [
      { name: 'InvoiceNumber', type: sql.NVarChar, value: InvoiceNumber },
    ]);
    // Return detail
    const selectQuery = `
    WITH ranked_lot AS (
  SELECT
    d.*,
    -- Replace t.status with IQA_Name logic
    CASE 
      WHEN d.IQA = 0 AND m.ITEMNO IS NOT NULL THEN 'PASS'
      WHEN d.IQA = 0 THEN 'NOT_REQUIRED'
      ELSE s.IQA_Name
    END AS status,
    m.isProblem,
    t.remark_iqa,
    ROW_NUMBER () OVER (
      PARTITION BY d.ReceptNumber, d.ITEMNO 
      ORDER BY CASE WHEN t.status = 'FAIL' THEN 1 ELSE 2 END
    ) AS rn 
  FROM
    accpac_sync_poreceipt_icshipment_detail d
    LEFT JOIN test_lot_status_iqa_check t 
      ON d.ReceptNumber = t.ReceiveNo 
      AND d.InvoiceNumber = t.InvoiceNumber 
      AND d.ITEMNO = t.ITEMNO
    LEFT JOIN lot_status_iqa_check s 
      ON t.status = s.IQA_Name
    LEFT JOIN mat_lot_Split m 
      ON d.ITEMNO = m.ITEMNO 
  WHERE
    d.InvoiceNumber = @InvoiceNumber
)
SELECT
  *
FROM
  ranked_lot 
WHERE
  rn = 1`;
    return await this.databaseService.query(selectQuery, [
      { name: 'InvoiceNumber', type: sql.VarChar, value: InvoiceNumber },
    ]);
}

  // Sync Dates
  async syncDates(): Promise<any> {
    const sqlQuery = `
    EXEC sp_CompareActiveItemNo
  `;
    return await this.databaseService.query(sqlQuery);
  }

  // async lot_statusIQA(IQAStatusID: number): Promise<any> {
  //   const sqlQuery = `
  //     SELECT * FROM lot_status_IQA  WHERE @IQAStatusID = IQAStatusID
  //   `;
  //   return await this.databaseService.query(sqlQuery, [
  //     { name: 'IQAStatusID', type: sql.Int, value: IQAStatusID },
  //   ]);
  // }
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
    exp_date: Date ,
    remark: string,
    isProblem: boolean | string,
    lot_qty: number,
    InvoiceNumber?: string,
    PORHSEQ?: string | number,
    IQA?: number,
  ): Promise<Item_List_LotSplit[]> {
    // Log เพื่อ debug
    console.log('Received isProblem:', isProblem, 'Type:', typeof isProblem);

    const sqlQuery = `
      IF NOT EXISTS (
  SELECT 1 FROM mat_lot_Split
  WHERE lot_no = @LotSplit
    AND ITEMNO = @ItemNo
    AND ReceiveNo = @ReceptNumber
    AND InvoiceNumber = @InvoiceNumber
)
BEGIN
  INSERT INTO mat_lot_Split (
    lot_no, ITEMNO, ReceiveNo, lot_unit, exp_date, 
    created_at, remark, isProblem, lot_qty, InvoiceNumber, PORHSEQ, IQA
  ) VALUES (
    @LotSplit, @ItemNo, @ReceptNumber, @LotUnit, @ExpDate,
    GETDATE(), @Remark, @IsProblem, @LotQty, @InvoiceNumber, @PORHSEQ, @IQA
  )
END                       
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
      { name: 'LotQty', type: sql.Decimal(18,2), value: lot_qty },
      { name: 'InvoiceNumber', type: sql.NVarChar, value: InvoiceNumber || null },
      { name: 'PORHSEQ', type: sql.NVarChar, value: PORHSEQ ? String(PORHSEQ) : null },
      { name: 'IQA', type: sql.Int, value: IQA},
    ]);
  }

  async lot_Split_BY_INV_and_ItemNo(
    InvoiceNumber: string,
    itemNo: string,
  ): Promise<Item_List_LotSplit[]> {
    const sqlQuery = `
    EXEC sp_Get_mat_lot_Split_by_Inv_and_ItemNo
  `;
   return await this.databaseService.query(sqlQuery, [
      { name: 'InvoiceNumber', type: sql.NVarChar, value: InvoiceNumber },
      { name: 'ItemNo', type: sql.NVarChar, value: itemNo },
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
    exp_date: Date|string|null,
    remark: string,
    isProblem: boolean | string,
    lot_qty: number,
    InvoiceNumber?: string,
    PORHSEQ?: string | number,
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
  MERGE mat_lot_Split AS target
USING (
  SELECT 
    @Id AS id,
    @LotSplit AS lot_no,
    @ReceptNumber AS ReceiveNo,
    @LotUnit AS lot_unit,
    @ExpDate AS exp_date,
    @Remark AS remark,
    @IsProblem AS isProblem,
    @InvoiceNumber AS InvoiceNumber,
    @PORHSEQ AS PORHSEQ,
    @LotQty AS lot_qty
) AS source
ON target.id = source.id
WHEN MATCHED THEN
  UPDATE SET
    lot_no = source.lot_no,
    ReceiveNo = source.ReceiveNo,
    lot_unit = source.lot_unit,
    exp_date = source.exp_date,
    updated_at = GETDATE(),
    remark = source.remark,
    isProblem = source.isProblem,
    InvoiceNumber = source.InvoiceNumber,
    PORHSEQ = source.PORHSEQ,
    lot_qty = source.lot_qty
WHEN NOT MATCHED THEN
  INSERT (
    id, lot_no, ReceiveNo, lot_unit, exp_date, updated_at, remark, isProblem, InvoiceNumber, PORHSEQ, lot_qty
  )
  VALUES (
    source.id, source.lot_no, source.ReceiveNo, source.lot_unit, source.exp_date, GETDATE(), source.remark, source.isProblem, source.InvoiceNumber, source.PORHSEQ, source.lot_qty
  );
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
      { name: 'InvoiceNumber', type: sql.NVarChar, value: InvoiceNumber || null },
      { name: 'PORHSEQ', type: sql.NVarChar, value: PORHSEQ ? String(PORHSEQ) : null },
      { name: 'LotQty', type: sql.Decimal(18,2), value: lot_qty },
    ]);
  }

  async delete_LotSplit(
    invoiceNumber: string,
    itemNo: string,
    lotNo: string,
  ): Promise<any> {
    const sqlQuery = `
    DELETE FROM mat_lot_Split WHERE InvoiceNumber = @InvoiceNumber AND ITEMNO = @ItemNo AND lot_no = @LotNo
  `;
    return await this.databaseService.query(sqlQuery, [
      { name: 'InvoiceNumber', type: sql.NVarChar, value: invoiceNumber },
      { name: 'ItemNo', type: sql.NVarChar, value: itemNo },
      { name: 'LotNo', type: sql.NVarChar, value: lotNo },
    ]);
  }

  async material_split(startDate: string, endDate: string): Promise<any> {
    const sqlQuery = `SELECT * FROM view_item_detail WHERE ReciveDate BETWEEN @StartDate AND @EndDate
`;

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

  async view_item(ReceptNumber: string): Promise<Item[]> {
    const sqlQuery = `  `;
    return await this.databaseService.query(sqlQuery, [
      { name: 'ReceptNumber', type: sql.NVarChar, value: ReceptNumber },
    ]);

  }
  async view_item_by_InvoiceNumber(InvoiceNumber: string): Promise<Item[]> {
    const sqlQuery = `  
    SELECT * FROM view_item_lotsplit WHERE InvoiceNumber = @InvoiceNumber  ORDER BY ITEMNO ASC `  
    return await this.databaseService.query(sqlQuery, [
      { name: 'InvoiceNumber', type: sql.NVarChar, value: InvoiceNumber },
    ]);
  }

  async unitpacking(): Promise<any> {
    const sqlQuery = `EXEC sp_Get_Dropdown`;
    return await this.databaseService.query(sqlQuery);
  }


}
