import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { MaterialRequestService } from './material_request.service';
import { MaterialRequest } from '../../../shared/interfaces/mms-system/material_request';
import { get } from 'http';
@Controller('material-request')
export class MaterialRequestController {
  constructor(private readonly materialRequestService: MaterialRequestService) {}

  @Get('material-requests')
  async getMaterialRequests(
    @Query('Sectgroup') Sectgroup: number,
    @Query('GROUPMAT') GROUPMAT: string,
    @Query('Type2Name') Type2Name: string,
  ): Promise<MaterialRequest[]> {
    return await this.materialRequestService.getMaterialRequests(Sectgroup, GROUPMAT, Type2Name);
  }
  @Get('item-details')  
  async getItemDetails(
    @Query('Type2Name') Type2Name: string,
    @Query('Sectgroup') Sectgroup: number,
  ): Promise<MaterialRequest[]> {
    return await this.materialRequestService.getItemDetails(Type2Name, Sectgroup);
  }
  @Get('groupmat')  
  async getGroupmat(
    @Query('Sectgroup') Sectgroup: number,
  ): Promise<MaterialRequest[]> {
    return await this.materialRequestService.getGroupmat(Sectgroup);
  }
  @Get('type2name')  
  async getType2Name(
    @Query('Sectgroup') Sectgroup: number,
    @Query('GROUPMAT') GROUPMAT: string,
  ): Promise<MaterialRequest[]> {
    return await this.materialRequestService.getType2Name(Sectgroup, GROUPMAT);
  }

}
