interface receiveForm
    {
        PoNumber: (string | number);
        receiveNumberList: (string)[];
        receiveDate: string | number;
        ItemCount: number | string ;
        InvoiceNo?: string | number;
        VDCODE?: string | { code: string; name?: string };
        VDNAME?: string ;
        location?: string | { code: string; name?: string  };

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
}


export type { receiveForm, receiveItems};