import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { CheckMaterialReceiveService } from './check_material_receive.service';
import {IqaCheck} from '../../../shared/interfaces/mms-system/iqa_check';

@Controller('check-material-receive')
export class CheckMaterialReceiveController {
  constructor(private readonly checkMaterialReceiveService: CheckMaterialReceiveService) {}

  @Get('item-iqa')
  async getItemIQA(): Promise<any[]> {
    return await this.checkMaterialReceiveService.getItemIQA();
  }
  @Post('sumitem-iqa')
  async sumItemIQA(
    @Body('invoiceNumber') invoiceNumber: string,
    @Body('itemNo') itemNo: string,
  ): Promise<any[]> {
    return await this.checkMaterialReceiveService.sumIQA(invoiceNumber,itemNo);
  }
  @Get('item-lot-split')
  async getItemLotSplit(
    @Query('invoiceNumber') invoiceNumber: string,
  ): Promise<IqaCheck[]> {
    return await this.checkMaterialReceiveService.getItemLotSplit(invoiceNumber);
  }
  @Get('status-iqa-check')
  async get_status_iqa_check(): Promise<IqaCheck[]> {
    return await this.checkMaterialReceiveService.get_status_iqa_check();
  }
@Post('iqa-check-submit')
async iqa_check_submit(
    @Query('invoiceNumber') invoiceNumber: string,
    @Query('ReceiveNo') ReceiveNo: string,
    @Query('lotNo') lotNo: string,
    @Query('status') status: string,
    @Query('remark_iqa') remark_iqa: string,
): Promise<void> {
    // ต้องส่ง remark เป็น parameter ที่สาม
    await this.checkMaterialReceiveService.Update_status_iqa_check(lotNo, status, remark_iqa, invoiceNumber, ReceiveNo);
}
  @Post('iqa-check-complete')
  async iqa_check_complete(
    @Query('invoiceNumber') invoiceNumber: string,
    @Query('ReceiveNo') ReceiveNo: string,
    @Query('lotNo') lotNo: string,
  ): Promise<void> {
    await this.checkMaterialReceiveService.Complete_iqa_check(lotNo, invoiceNumber, ReceiveNo);
  }

  @Get('add-item-transaction-mc-prod')
  async addItemListTransaction_MC_PROD(): Promise<IqaCheck[]> {
    return await this.checkMaterialReceiveService.addItemListTransaction_MC_PROD();
  }
  @Get('mc-view-iqa-status')
  async mc_view_iqa_status(): Promise<IqaCheck[]> {
    return await this.checkMaterialReceiveService.mc_view_iqa_status();
  }
  @Get('mc-recnum')
  async mc_recnum(
    @Query('InvoiceNumber') InvoiceNumber: string,
  ): Promise<any[]> {
    return await this.checkMaterialReceiveService.mc_recnum(InvoiceNumber);
  }

}
