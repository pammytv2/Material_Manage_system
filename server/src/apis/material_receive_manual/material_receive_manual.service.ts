import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import {
  Item,
  ItemListResponse,
  Item_List_LotSplit,
} from 'shared/interfaces/mms-system/Item_List';
import * as sql from 'mssql';

@Injectable()
export class MaterialReceiveManualService {
  constructor(private readonly databaseService: DatabaseService) {}

  async getVDCODE(): Promise<any[]> {
    const sqlQuery = `
            SELECT DISTINCT VDCODE, VDNAME FROM view_vendor`;
    return await this.databaseService.query(sqlQuery);
  }
    async getItemList_manual(PONUMBER: string[], VDCODE: string): Promise<any[]> {
  const pool = await this.databaseService.getConnection();
  const request = pool.request();
  // แปลง array เป็น comma-separated string
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
}

