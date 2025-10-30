interface receiveForm {
    PoNumber: string | number;
    receiveNumberList: string[];
    receiveDate: Date ;
    ItemCount: number | string;
    InvoiceNo?: string | number;
    vdcode?: string | { code: string; name?: string };
    location?: string | { code: string; name?: string };
}

interface receiveItems {
    itemNo: string;
    description: string;
    unit: number | string;
    receiveQty: number | string;
    lotNo: string | number;
    expireDate: string | number;
    remark: string | number;
    unitCost: string | number;
    iqaRequired: boolean;
    lotRequired: boolean;
    ReceiveQty: number | string;
    PoNumber: string | number;
    InvoiceNo?: string | number;
    location?: string;
    vdcode?: string | { code: string; name?: string };
    PORHSEQ?: number;
    QTYONORDER?: number;
}

interface NoPoItemType {
    itemNo: string | { label: string; value: string };
    description: string;
    unit: string;
    receiveQty: number;
    unitCost: number;
    location: string | { label: string; value: string };
    vdcode: string | { code: string; name: string };
    invoiceNo: string;
    QTYONORDER: number;
}

export type { receiveForm, receiveItems, NoPoItemType };
