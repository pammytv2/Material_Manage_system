

interface IReceiveItem {
    ReceptNumbar: string;
    ReceptNumber: string;
    ReciveDate: string;
    Countoder: number;
    ImportDate: Date;
    InveiceNumbar: string;
    InvoiceNumber: string;
    VedorName: string;
    VedorCode: string;
    SyncAt: Date;
    endDate: Date;
    startDate: Date;
    ITEMNO: string;
    iTEMDESC: string;
    RQRECEIVED: Date;
    UNIT: string;
    LotSplitStatus: number;
    ItemStatusIqaID: number;
    LotSplit?: number;
    IQA: number ;


} 
interface filterMeta {
    value: string | null;
    matchMode: string;
}

interface IReceiveDetailItem {
    no: number;
    ReceptNumbar: string;
    ITEMNO: string;
    ITEMDESC: string;
    UNIT: string;
    RQRECEIVED: number;
    SyncAt: Date;
    LotSplitStatus: number;
    ItemStatusIqaID: number;
    iqaStatus: number ;
}
interface LotRow {
    no: string;
    lotNo: string;
    qty: string;
    unit: string;
    expireDate: string;
}

interface LotRowEx extends LotRow {
    takeOutQty?: string;
    problem?: string;
    remark?: string;
}


export type { IReceiveItem , filterMeta, IReceiveDetailItem , LotRow, LotRowEx };