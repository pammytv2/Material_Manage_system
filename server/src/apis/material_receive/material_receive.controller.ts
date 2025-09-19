import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { MaterialReceiveService } from './material_receive.service';

@Controller('material-receive')
export class MaterialReceiveController {
  constructor(
    private readonly materialReceiveService: MaterialReceiveService,
  ) {}

  @Get()
  findAll() {
    return this.materialReceiveService.findAllPOReceipt_ICShipment();
  }



@Get('details/:receiptNumber')
syncData_Detail(
  @Param('receiptNumber') receiptNumber: string,
  @Query('StatusRecIC') StatusRecIC: number,
) {
  return this.materialReceiveService.syncData_Detail(
    receiptNumber,
    Number(StatusRecIC),
  );
}
  @Get('lot-status-iqa/:IQAStatusID')
  lot_statusIQA(
    @Query('IQAStatusID') IQAStatusID: number,
  ) {
    return this.materialReceiveService.lot_statusIQA(
    Number(IQAStatusID));
  }

  @Get('sync')
  async syncRecHICH(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return await this.materialReceiveService.syncRecHICH(startDate, endDate);
  }
}
 