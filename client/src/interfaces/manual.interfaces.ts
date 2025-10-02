interface receiveForm
    {
        PoNumber: (string | number);
        receiveNumberList: (string)[];
        receiveDate: string | number;
        ItemCount: number | string ;
        InvoiceNo?: string | number;
        VDCODE?: string | number | null;
        VDNAME?: string ;

    }

interface receiveItems {
        itemNo: string;
        description: string;
        unit: number | string;
        receiveQty: number | string;
        lotNo: string | number;
        expireDate: string | number;
        remark: string | number;
        iqaRequired: boolean;
        lotRequired: boolean;
}


export type { receiveForm, receiveItems};