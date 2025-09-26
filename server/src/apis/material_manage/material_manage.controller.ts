import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { MaterialManageService } from './material_manage.service';
import type { CreateItem } from 'shared/interfaces/mms-system/Item_List';


@Controller('material-manage')
export class MaterialManageController {
  constructor(private readonly materialManageService: MaterialManageService) {}

  @Get('unit-packing')
  async getAllUnitPacking() {
    return this.materialManageService.unitpacking();
  }
  @Get('type2')
  async getAllType2() {
    return this.materialManageService.type2();
  }
  @Get('group-product')
  async getAllGroupProduct() {
    return this.materialManageService.findAll_Group_Product();
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
  @Get('group-material')
  async getAllGroupMaterial() {
    return this.materialManageService.findAll_Group_Material();
  }
  @Get('inactive-item')
  async getAllInactiveItem() {
    return this.materialManageService.getAllInactiveItem();
  }
  // @Post('new-item')
  // async createNewItem(@Body() createItem: any) {
  //   const {
  //     ItemNo,
  //     Type2ID,
  //     Packing,
  //     UnitPackingID,
  //     ZoneID,
  //     GroupMatID,
  //     LotSplit,
  //     IQA,
  //     ExpDate,
  //   } = createItem;
  //   return this.materialManageService.INSERT_New_Item(
  //     ItemNo,
  //     Type2ID,
  //     Packing,
  //     UnitPackingID,
  //     ZoneID,
  //     GroupMatID,
  //     LotSplit,
  //     IQA,
  //     ExpDate,
  //   );
  // }



}


