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
  @Post('update-receive-items')
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
  @Body('VendorCode') VendorCode: string,
  @Body('invoiceNumber') invoiceNumber: string,
  @Body('LOCATION') LOCATION: string,
  @Body('ReceiveQty') ReceiveQty: number,
  @Body('itemNo') itemNo: string,
) {
  // แปลง single values เป็น arrays ตาม signature ของ PostItemList_manual
  const itemNoArray = [itemNo];
  const receiveQtyArray = [ReceiveQty];
  
  return await this.materialReceiveManualService.PostItemList_manual(
    VendorCode,      // VendorCode: string
    invoiceNumber,   // invoiceNumber: string  
    itemNoArray,     // itemNoList: string[]
    receiveQtyArray, // ReceiveQty: number[]
    LOCATION         // LOCATION: string
  );
}


 @Get('show-itemmanual')
  async showItemmanual() {
    return await this.materialReceiveManualService.showItem_manual();

}
@Get('showItem_manual_detail')
  async showItem_manual_detail(
    @Query('invoiceNumber') invoiceNumber: string,
    @Query('PONUMBER') PONUMBER: string
  ) {
    return await this.materialReceiveManualService.showItem_manual_detail(invoiceNumber, PONUMBER);
  }




@Get('showItem_manual_detail_inv')
  async showItem_manual_detail_inv(
    @Query('invoiceNumber') invoiceNumber: string
  ) {
    return await this.materialReceiveManualService.showItem_manual_detail_inv(invoiceNumber);
  }
    

 @Post('insert-single-no-po-item')
  async updateItem_manual(
    @Body('invoiceNumber') invoiceNumber: string,
    @Body('ReceiveQty') ReceiveQty: number,
    @Body('itemNo') itemNo: string,

  ) {
    return await this.materialReceiveManualService.insert_single_no_po_item(
      invoiceNumber,
      ReceiveQty,
      itemNo,
    );
  }


  
  @Post('delete-item-manual')
  async deleteItem_manual(
    @Body('invoiceNumber') invoiceNumber: string,
    @Body('ItemNo') ItemNo: string,
  ) {
    return await this.materialReceiveManualService.DeleteItem_manual(
      invoiceNumber,
      ItemNo,
    );
  }

}