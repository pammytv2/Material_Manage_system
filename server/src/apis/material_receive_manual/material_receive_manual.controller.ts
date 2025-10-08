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
  ) {
    // Convert PONUMBER to string array (assuming comma-separated input)
    const poNumbersArray = PONUMBER
      ? PONUMBER.split(',').map((s) => s.trim())
      : [];
    return await this.materialReceiveManualService.getItemList_manual(
      poNumbersArray,
      VDCODE,
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

  @Put('update-receive-items NO_PO')
  async insertNoPoItems(
    @Body('items')
    items: { ItemNo: string; ReceiveQty: number; InvoiceNo: string; VDCODE: string }[],
    @Body('VDCODE') VDCODE: string,
    @Body('invoiceNumber') invoiceNumber: string,
  ) {
    return await this.materialReceiveManualService.insertNoPoItems(VDCODE, invoiceNumber);
  }

  @Get('item-list-lot-split/:ItemNo')
  async getItemList_lotSplit(@Param('ItemNo') ItemNo: string) {
    return await this.materialReceiveManualService.getItemList_lotSplit(ItemNo);
  }
}
