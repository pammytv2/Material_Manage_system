import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { CheckMaterialReceiveService } from './check_material_receive.service';
import { IqaCheck } from '../../../shared/interfaces/mms-system/iqa_check';
import { Iqaabnormal } from 'shared/interfaces/mms-system/iqa_abnormal';

@Controller('check-material-receive')
export class CheckMaterialReceiveController {
  constructor(
    private readonly checkMaterialReceiveService: CheckMaterialReceiveService,
  ) {}

  @Get('item-iqa')
  async getItemIQA(): Promise<any[]> {
    return await this.checkMaterialReceiveService.getItemIQA();
  }
  @Get('item-iqa-inspec')
  async getItemIQA_inspec(): Promise<any[]> {
    return await this.checkMaterialReceiveService.getIttemIQA_inspec();
  }
  @Post('sumitem-iqa')
  async sumItemIQA(
    @Body('invoiceNumber') invoiceNumber: string,
    @Body('itemNo') itemNo: string,
  ): Promise<any[]> {
    return await this.checkMaterialReceiveService.sumIQA(invoiceNumber, itemNo);
  }
  @Get('item-lot-split')
  async getItemLotSplit(
    @Query('invoiceNumber') invoiceNumber: string,
  ): Promise<IqaCheck[]> {
    return await this.checkMaterialReceiveService.getItemLotSplit(
      invoiceNumber,
    );
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
  @Query('lot_user') lot_user: string,
  @Query('remark_iqa') remark_iqa: string,
): Promise<void> {
  await this.checkMaterialReceiveService.Update_status_iqa_check(
    lotNo,
    status,
    remark_iqa,
    lot_user,         // <-- ตำแหน่งนี้
    invoiceNumber,    // <-- ตำแหน่งนี้
    ReceiveNo,
  );
}
  @Post('iqa-check-Inspec')
  async iqa_check_Inspec(
    @Query('lotNo') lotNo: string,
    @Query('invoiceNumber') invoiceNumber: string,
    @Query('ReceiveNo') ReceiveNo: string,
    @Query('inspec_user') inspec_user: string,
    @Query('status_Inspec') status_Inspec: string,
    @Query('remark_inspec') remark_inspec: string,
  ): Promise<void> {
    await this.checkMaterialReceiveService.Update_status_iqa_check_Inspec(
      lotNo,
      invoiceNumber,
      ReceiveNo,
      status_Inspec,
      inspec_user,
      remark_inspec,
    );
  }

  @Post('iqa-check-Inspec-all')
  async iqa_check_Inspec_all(
    @Query('ITEMNO') ITEMNO: string,
    @Query('invoiceNumber') invoiceNumber: string,
    @Query('status_Inspec') status_Inspec: string,
    @Query('inspec_user') inspec_user: string,
    @Query('remark_inspec') remark_inspec: string,
  ): Promise<void> {
    await this.checkMaterialReceiveService.Update_status_iqa_check_Inspec_all(
      ITEMNO,
      invoiceNumber,
      inspec_user,
      status_Inspec,
      remark_inspec,
      
    );
  }
  @Post('iqa-add-abnormal-number')
  async iqa_add_abnormal_number(
    @Query('abnormal_user') abnormal_user: string,
    @Query('lotNo') lotNo: string,
    @Query('invoiceNumber') invoiceNumber: string,
    @Query('ITEMNO') ITEMNO: string,
    @Query('Abnormal_Number') Abnormal_Number: string,
  ): Promise<void> {
    await this.checkMaterialReceiveService.Add_Abnormal_Number(
      abnormal_user,
      Abnormal_Number,
      invoiceNumber,
      lotNo,
      ITEMNO
    ); 
  }
@Post('iqa-add-abnormal-number-all')
async iqa_add_abnormal_number_all(
  @Query('abnormal_user') abnormal_user: string,
  @Query('invoiceNumber') invoiceNumber: string,
  @Query('ITEMNO') ITEMNO: string,
  @Query('Abnormal_Number') Abnormal_Number: string,
): Promise<void> {
  await this.checkMaterialReceiveService.Add_Abnormal_Number_all(
    abnormal_user,
    Abnormal_Number, // <-- ต้องมาก่อน
    invoiceNumber,
    ITEMNO
  ); 
}
  @Post('iqa-check-complete')
  async iqa_check_complete(
    @Query('invoiceNumber') invoiceNumber: string,
    @Query('ReceiveNo') ReceiveNo: string,
    @Query('lotNo') lotNo: string,
  ): Promise<void> {
    await this.checkMaterialReceiveService.Complete_iqa_check(
      lotNo,
      invoiceNumber,
      ReceiveNo,
    );
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
  @Get('iqa-view-normal-check')//

  async iqa_view_normal(): Promise<Iqaabnormal[]> {
    return await this.checkMaterialReceiveService.iqa_view_item_normal();
  }
  @Get('insert-iqa-view-normal-check')
  async insert_iqa_view_normal(): Promise<Iqaabnormal[]> {
    return await this.checkMaterialReceiveService.insert_item_normal();
  }
}
