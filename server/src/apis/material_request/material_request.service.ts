import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { MaterialRequest } from '../../../shared/interfaces/mms-system/material_request';

@Injectable()
export class MaterialRequestService {
  constructor(private readonly databaseService: DatabaseService) {}

  async getMaterialRequests(Sectgroup: number, GROUPMAT: string, Type2Name: string): Promise<MaterialRequest[]> {
    const sqlQuery = `
    SELECT
  Type2Name,GROUPMAT,SPEC,Total_After_qty,Sectgroup,UNIT
FROM
  [dbo].[view_item_prod] 
WHERE
  Sectgroup = @Sectgroup AND  GROUPMAT = @GROUPMAT AND Type2Name = @Type2Name
  GROUP BY 
 Type2Name,
 GROUPMAT,
 SPEC,
 Total_After_qty,
 Sectgroup,
 UNIT
 `;
    const pool = await this.databaseService.getConnection();
    const request = pool.request();
    request.input('Sectgroup', Sectgroup);
    request.input('GROUPMAT', GROUPMAT);
    request.input('Type2Name', Type2Name);
    const result = await request.query(sqlQuery);
    return result.recordset;
  }
  async getItemDetails(
    Type2Name: string,
    Sectgroup: number,
  ): Promise<MaterialRequest[]> {
    const sqlQuery = `
    SELECT *
    FROM [dbo].[view_item_prod]
    WHERE Type2Name = @Type2Name  AND Sectgroup = @Sectgroup`;
    const pool = await this.databaseService.getConnection();
    const request = pool.request();
    request.input('Type2Name', Type2Name);
    request.input('Sectgroup', Sectgroup);
    const result = await request.query(sqlQuery);
    return result.recordset;
  }
  async getGroupmat(Sectgroup: number): Promise<MaterialRequest[]> {
    const sqlQuery = `
       SELECT DISTINCT GROUPMAT, Sectgroup
      FROM view_item_prod
      WHERE Sectgroup = @Sectgroup`;
    const pool = await this.databaseService.getConnection();
    const request = pool.request();
    request.input('Sectgroup', Sectgroup);
    const result = await request.query(sqlQuery);
    return result.recordset;
  }

  async getType2Name(
    Sectgroup: number,
    GROUPMAT: string,
  ): Promise<MaterialRequest[]> {
    const sqlQuery = `
      SELECT DISTINCT Type2Name,Sectgroup
      FROM view_item_prod
      WHERE  GROUPMAT = @GROUPMAT  and Sectgroup = @Sectgroup
`;
    const pool = await this.databaseService.getConnection();
    const request = pool.request();
    request.input('Sectgroup', Sectgroup);
    request.input('GROUPMAT', GROUPMAT);
    const result = await request.query(sqlQuery);
    return result.recordset;
  }
}
