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
  ): Promise<any[]> {
    return await this.checkMaterialReceiveService.sumIQA(invoiceNumber);
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
  ): Promise<void> {
    await this.checkMaterialReceiveService.Update_status_iqa_check(lotNo, status, invoiceNumber, ReceiveNo);
  }
}
