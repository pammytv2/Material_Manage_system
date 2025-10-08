interface ManualReceive {
    receiveNumber: string,
    receiveDate: string,
    invoiceNumber: string,
    vendorCode: string,
    vendorName: string,
    remark: string,
    items: any[]
}   

interface Item_manual {
    itemNo: string;
    ReceiveQty: number;
    receiptNumber: string;
    InvoiceNumber: string;
    ReceiptNumber: string;
    VendorCode: string;
    VendorName: string;
}
export type { ManualReceive, Item_manual };

