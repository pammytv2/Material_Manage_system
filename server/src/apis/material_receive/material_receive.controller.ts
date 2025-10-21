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
import type { ManualReceive } from 'shared/interfaces/mms-system/ManualReceiv';

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
  syncData_Detail(@Param('receiptNumber') receiptNumber: string) {
    return this.materialReceiveService.syncData_Detail(receiptNumber);
  }
@Get('details-split/:InvoiceNumber')
syncData_Detail_Split(@Param('InvoiceNumber') InvoiceNumber: string) {
    return this.materialReceiveService.syncData_Detail_Split(InvoiceNumber);
}
  @Get('lot-status-iqa/:IQAStatusID')
  lot_statusIQA(@Query('IQAStatusID') IQAStatusID: number) {
    return this.materialReceiveService.lot_statusIQA(Number(IQAStatusID));
  }

  @Get('sync')
  async syncRecHICH(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return await this.materialReceiveService.syncRecHICH(startDate, endDate);
  }

  @Post('insert_lot-split')
  async createLotSplit(@Body() lotSplitData: any) {
    const {
      ItemNo,
      LotSplit,
      receiveno,
      lot_unit,
      exp_date,
      remark,
      isProblem,
      lot_qty,
      InvoiceNumber,
      PORHSEQ,
    } = lotSplitData;
    return await this.materialReceiveService.insert_LotSplit(
      ItemNo,
      LotSplit,
      receiveno,
      lot_unit,
      exp_date,
      remark,
      isProblem,
      lot_qty,
      InvoiceNumber,
      PORHSEQ,
    );
  }
  @Post('update_lot-split')
  async updateLotSplit(@Body() lotSplitData: any) {
    const {
      id,
      ItemNo,
      LotSplit,
      receiveno,
      lot_unit,
      exp_date,
      remark,
      isProblem,
      lot_qty,
      InvoiceNumber,
      PORHSEQ,
    } = lotSplitData;
    return await this.materialReceiveService.update_LotSplit(
      id,
      ItemNo,
      LotSplit,
      receiveno,
      lot_unit,
      exp_date,
      remark,
      isProblem,
      lot_qty,
      InvoiceNumber,
      PORHSEQ,
    );
  }

  @Get('lot-split/:receiveNo')
  lotSplit(
    @Param('receiveNo') receiveNo: string,
    @Query('itemNo') itemNo: string,
  ) {
    return this.materialReceiveService.lot_Split_BY_Rec_and_ItemNo(
      receiveNo,
      itemNo,
    );
  }
  @Get('lot-split/:InvoiceNumber')
  lotSplit_Invoice(
    @Param('InvoiceNumber') InvoiceNumber: string,
    @Query('itemNo') itemNo: string,
  ) {
    return this.materialReceiveService.lot_Split_BY_INV_and_ItemNo(
      InvoiceNumber,
      itemNo,
    );
  }

  @Post('delete_LotSplit')
  deleteLotSplit(
    @Query('invoiceNumber') invoiceNumber: string,
    @Query('itemNo') itemNo: string,
    @Query('lotNo') lotNo: string,
  ) {
    return this.materialReceiveService.delete_LotSplit(
      invoiceNumber,
      itemNo,
      lotNo,
    );
  }

  @Get('material-split')
  material_split(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.materialReceiveService.material_split(startDate, endDate);
  }

  @Get('items')
  async getItemList() {
    return await this.materialReceiveService.item_list();
  }

  @Get('item/:itemNo')
  async getItemByItemNo(@Param('itemNo') itemNo: string) {
    return await this.materialReceiveService.item_by_itemNo(itemNo);
  }
  @Post('update-item-list')
  async updateItemList(@Body() itemData: any) {
    const {
      itemNo,
      Inactive,
      LotSplit,
      Packing,
      Type2,
      IQA,
      ExpDate,
      GroupMatID,
      Min,
      Max,
      GProdID,
      ZoneID,
    } = itemData;
    return await this.materialReceiveService.update_item_List(
      itemNo,
      Inactive,
      LotSplit,
      Packing,
      Type2,
      IQA,
      ExpDate,
      GroupMatID,
      Min,
      Max,
      GProdID,
      ZoneID,
    );
  }
@Get('syncReceiveDetail/:receiveNo')
async syncReceiveDetail(
  @Param('receiveNo') receiveNo: string,
  @Query('StatusRecIC') StatusRecIC: string,
): Promise<any> {
  return await this.materialReceiveService.syncRecD(receiveNo, StatusRecIC);
}
  @Get('unit-packing')
  async unitpacking(): Promise<any> {
    return await this.materialReceiveService.unitpacking();
  }

@Get('view-item')
async view_item(
  @Query('ReceptNumber') ReceptNumber: string,
): Promise<any> {
  return await this.materialReceiveService.view_item(ReceptNumber);
}

@Get('view-item-split')
async view_item_split(
  @Query('InvoiceNumber') InvoiceNumber: string,
): Promise<any> {
  return await this.materialReceiveService.view_item_by_InvoiceNumber(InvoiceNumber);

}
}
