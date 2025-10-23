import { Body, Controller, Get, Post } from '@nestjs/common';
import { CheckMaterialReceiveService } from './check_material_receive.service';

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
    @Body('invoiceNumber') invoiceNumber: string,
  ): Promise<any[]> {
    return await this.checkMaterialReceiveService.getItemLotSplit(invoiceNumber);
  }
}
