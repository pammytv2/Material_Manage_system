interface Iqa_Checklist {
    lot_no: string ;
    InvoiceNumber: string ;
    status: string ;
    created_at: Date ;
    IQA_Status: string ;
    checked_at: Date ;
    remark: string ;
    PORHSEQ?: string;
    ITEMNO?: string;
    ReciveDate?: Date ;
    VendorCode?: string ;
    VendorName: string ;
    lot_qty?: number ;
    ReceiveNo?: string ;
    status_Inspec?: string;
    lot_no_check?: number;
    abnormally_number?: string ;
    inspec_date?: Date ;
    qty_date?: Date ;
}

interface Iqaabnormal {
  Abnormal_Number: string;
  InvoiceNumber: string;
  statusQty: string;
  ReceiceNo: string;
  lot_no: string;
  ITEMNO: string;
  status_Inspec: string;
  lot_qty: number;
  inspec_date: Date;
}



export type { Iqa_Checklist , Iqaabnormal };