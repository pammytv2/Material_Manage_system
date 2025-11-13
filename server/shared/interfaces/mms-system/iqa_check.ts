
interface IqaCheck {
    lot_no: string ;
    InvoiceNumber: string ;
    status: string ;
    created_at: Date ;
    checked_at: Date ;
    remark: string ;
    PORHSEQ?: string;
    ITEMNO?: string;
    lot_qty?: number ;
    status_Inspec?: string ;
    abnormally_number?: string ;
    lot_no_check: number ;
    ReceiveNo?: string ;
    inspec_date?: Date ;
    qty_date?: Date ;
}



export  type { IqaCheck };