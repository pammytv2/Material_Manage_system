import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { MaterialReceiveManualService } from './material_receive_manual.service';



@Controller('material-receive-manual')
export class MaterialReceiveManualController {
  constructor(private readonly materialReceiveManualService: MaterialReceiveManualService) {}


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
    const poNumbersArray = PONUMBER ? PONUMBER.split(',').map(s => s.trim()) : [];
    return await this.materialReceiveManualService.getItemList_manual(poNumbersArray, VDCODE);
  }
  @Get('item-list-spec')
  async getItemList_spec() {
    return await this.materialReceiveManualService.getItemList_spec();
  }

  
}
