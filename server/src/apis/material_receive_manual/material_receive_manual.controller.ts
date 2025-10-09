import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Put,
} from '@nestjs/common';
import { MaterialReceiveManualService } from './material_receive_manual.service';
import { Item } from 'shared/interfaces/mms-system/Item_List';
import { Item_manual } from 'shared/interfaces/mms-system/ManualReceiv';

@Controller('material-receive-manual')
export class MaterialReceiveManualController {
  constructor(
    private readonly materialReceiveManualService: MaterialReceiveManualService,
  ) {}

  @Get('vdcode')
  async getVDCODE() {
    return await this.materialReceiveManualService.getVDCODE();
  }

  @Get('item-list-manual')
  async getItemList_manual(
    @Query('PONUMBER') PONUMBER: string,
    @Query('VDCODE') VDCODE: string,
    @Query('invoiceNumber') invoiceNumber?: string,
  ) {
    // Convert PONUMBER to string array (assuming comma-separated input)
    const poNumbersArray = PONUMBER
      ? PONUMBER.split(',').map((s) => s.trim())
      : [];
    return await this.materialReceiveManualService.getItemList_manual(
      poNumbersArray,
      VDCODE,
      invoiceNumber,
    );
  }

  @Get('item-list-spec')
  async getItemList_spec() {
    return await this.materialReceiveManualService.getItemList_spec();
  }

  @Get('location')
  async getLocation() {
    return await this.materialReceiveManualService.getLocation();
  }
  @Put('update-receive-items')
  async updateReceiveItems(
    @Body('items') items: { ItemNo: string; ReceiveQty: number }[],
    @Body('invoiceNumber') invoiceNumber: string,
  ) {
    return await this.materialReceiveManualService.updateReceiveItems(
      items,
      invoiceNumber,
    );
  }

@Post('update-receive-items NO_PO')
async insertNoPoItems(
  @Body('items') items: { ItemNo: string; ReceiveQty: number; InvoiceNo: string; VDCODE: string }[],
  @Body('VDCODE') VDCODE: string,
  @Body('invoiceNumber') invoiceNumber: string,
) {
  // Assuming you want to insert the first item from the items array
  if (items && items.length > 0) {
    const { ReceiveQty, ItemNo } = items[0];
    return await this.materialReceiveManualService.insertNoPoItems(VDCODE, invoiceNumber, ReceiveQty, ItemNo);
  } else {
    throw new Error('No items provided');
  }
}

  @Get('item-list-lot-split')
  async getItemList_lotSplit(@Query('ItemNo') ItemNo: string, @Query('LOCATION') LOCATION: string) {
    return await this.materialReceiveManualService.getNoPoItems(ItemNo, LOCATION);
  }

  @Get('item-list-lot-split/:ItemNo/:LOCATION')
  async getItemList_lotSplit_path(
    @Param('ItemNo') ItemNo: string,
    @Param('LOCATION') LOCATION: string
  ) {
    return await this.materialReceiveManualService.getNoPoItems(ItemNo, LOCATION);
  }

  @Post('insert-no-po-items_Post')
  async insertNoPoItems_post(
    @Body('VDCODE') VDCODE: string,
    @Body('invoiceNumber') invoiceNumber: string,
    @Body('LOCATION') LOCATION: string,
    @Body('ReceiveQty') ReceiveQty: number,
    @Body('itemNo') itemNo: string,
  ) {
    return await this.materialReceiveManualService.PostItemList_manual(VDCODE, invoiceNumber, ReceiveQty, itemNo, LOCATION);
  }

}
