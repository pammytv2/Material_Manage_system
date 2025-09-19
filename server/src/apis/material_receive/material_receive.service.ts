import { Injectable, Param } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { POReceipt_ICShipment } from 'shared/interfaces/mms-system/POReceipt_ICShipment';
import { POReceipt_ICShipment_Detail } from 'shared/interfaces/mms-system/POReceipt_ICShipment_Detail';
import * as sql from 'mssql';
@Injectable()
export class MaterialReceiveService {

  constructor(private readonly databaseService: DatabaseService) {}
  //  POReceipt_ICShipment
  async findAllPOReceipt_ICShipment(): Promise<POReceipt_ICShipment[]> {
    const sqlQuery: string = `SELECT * FROM POReceipt_ICShipment`;
    return await this.databaseService.query(sqlQuery);
  }

  async findOnePOReceipt_ICShipment(receiptNumber: string): Promise<POReceipt_ICShipment[]> {
    const sqlQuery: string = `SELECT * FROM POReceipt_ICShipment WHERE ReceptNumbar = @receiptNumber`;
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
    const selectQuery = `SELECT * FROM dbo.POReceipt_ICShipment WHERE ReciveDate BETWEEN @StartDate AND @EndDate`;
    return await this.databaseService.query(selectQuery, [
      { name: 'StartDate', type: sql.VarChar, value: startDate },
      { name: 'EndDate', type: sql.VarChar, value: endDate },
    ]); 
  }
  

  // Sync RecD_ICH
async syncData_Detail(receiptNumber: string ,StatusRecIC: number): Promise<any> {
    // Sync data
    const syncQuery = `
      EXEC sp_Sync_RecD_ICD @ReceptNumber = @ReceptNumber, @StatusRecIC = @StatusRecIC
    `;
    await this.databaseService.query(syncQuery, [
      { name: 'ReceptNumber', type: sql.NVarChar, value: receiptNumber },
      { name: 'StatusRecIC', type: sql.Int, value: StatusRecIC },
    ]);
    // Return detail
    const selectQuery = `SELECT * FROM POReceipt_ICShipment_Detail WHERE ReceptNumber = @receiptNumber`;
    return await this.databaseService.query(selectQuery, [
      { name: 'receiptNumber', type: sql.VarChar, value: receiptNumber }
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
      { name: 'IQAStatusID', type: sql.Int, value: IQAStatusID }
    ]);
  }
  async lot_SplitStatus (ItemNo: number): Promise<any> {
    const sqlQuery = `
      SELECT ItemNo , LotSplit FROM view_item_mms_active WHERE ItemNo = @ItemNo
    `;
    return await this.databaseService.query(sqlQuery);
  }

}
