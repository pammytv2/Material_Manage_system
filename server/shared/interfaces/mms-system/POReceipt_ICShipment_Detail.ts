interface POReceipt_ICShipment_Detail {
    ReceptNumber: string; // PO Receipt Number
    ITEMNO: string; // Item Code
    ITEMDESC: string; // Item Name
    RQRECEIVED: number;
    UNIT: string; // Unit
    SyncAt : Date;
    LotSplitStatus: number; // Lot Split Status
    ItemStatusIqaID: number; // Item Status IQA ID


} export type { POReceipt_ICShipment_Detail };