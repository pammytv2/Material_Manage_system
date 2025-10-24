interface Iqa_Checklist {
    lot_no: string ;
    InvoiceNumber: string ;
    status: string ;
    created_at: Date ;
    checked_at: Date ;
    remark: string ;
    PORHSEQ?: string;
    ITEMNO?: string;
    lot_qty?: number ;
    ReceiveNo?: string ;
}

export type { Iqa_Checklist };