import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { MaterialManageService } from './material_manage.service';
import type { CreateItem } from 'shared/interfaces/mms-system/Item_List';


@Controller('material-manage')
export class MaterialManageController {
  constructor(private readonly materialManageService: MaterialManageService) {}


  @Get('type2')
  async getAllType2() {
    return this.materialManageService.type2();
  }

  @Get('lot-split')
  async getAllLotSplit() {
    return this.materialManageService.findAll_LotSplit();
  }@Get('iqa')
  async getAllIQA() {
    return this.materialManageService.findAll_IQA();
  }
  @Get('exp-data')
  async getAllExpData() {
    return this.materialManageService.findAll_Exp_Data();
  }@Get('examine-null-item') 
  async getAllExamineNullItem() {
    return this.materialManageService.ExamineNull_Item();
  }
  @Get('count-item-null')
  async getCountItemNull() {
    return this.materialManageService.Count_Item_Null();
  }
  @Get('zone')
  async getAllZone() {
    return this.materialManageService.findAll_zone();
  }

  @Get('inactive-item')
  async getAllInactiveItem() {
    return this.materialManageService.getAllInactiveItem();
  }

@Post('add-item')
async createItem(@Body() body: CreateItem) {
  console.log('Received body:', body); // ต้อง log ได้ object ที่มี ItemNo
  return this.materialManageService.addItem(body);
}
@Get('itemnewdetail/:ItemNo')
async getItemNewDetail(@Param('ItemNo') ItemNo: string) {
  return this.materialManageService.itemnewdetail(ItemNo);


}

@Get('itemType2')
async getItemItemType2() {
  return this.materialManageService.itemType2();
}
@Get('item_type_update')
async getItemItemType() {
  return this.materialManageService.item_type_update(); 
}

@Post('update-item')
async updateItem(@Body() body: CreateItem) {
  console.log('Received body for update:', body); // ต้อง log ได้ object ที่มี ItemNo
  return this.materialManageService.updateItem_new(body);
}
@Get('active-update-item')
async activeUpdateItem() {
  return this.materialManageService.activeUpdateItem();
}
}
