import e from "express";

interface Item {
  ItemNo: string;
  LotSplit?: boolean;
  ITEMDesc?: string;
  TYPE?: string;
  VENDOR?: string;
  PROJECT?: string;
  UNIT?: string;
  SECTIONGROUP?: string;
  GROUPMATTYPE?: string;
  CATEGORY?: string;
  
  SPEC?: string;
  GROUPMAT?: string;
  ReceiveQty: number;
  PORHSEQ: string;
  ReceiptNumber: string;
  InvoiceNumber: string;
  VendorCode: string;
  VendorName: string;
  
}



interface ItemListResponse {
  Inactive: number;
  LotSplit: number;
  Packing: number;
  Type2: number;
  IQA: number;
  ExpDate: number;
  GroupMatID: number;
  Min: number;
  Max: number;
  GProdID: number;
}

interface Item_List_LotSplit {
    ItemNo: string,
    LotSplit: string,
    receiveno: string,
    lot_unit: string,
    exp_date: Date,
    remark: string,
    isProblem: boolean | string,
    lot_qty: number,
}



interface CreateItem {
  ItemNo: string;
  Type2ID: number;
  Packing: number;
  Min: number;
  Max: number;
  UnitPackingID: number;
  ZoneID: number;
  GroupMatID: number;
  LotSplit: number;
  IQA: number;
  ExpDate: number;
}

  

export type { Item, Item_List_LotSplit, ItemListResponse, CreateItem };






