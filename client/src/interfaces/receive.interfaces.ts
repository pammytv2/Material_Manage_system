import { item } from '@primeuix/themes/aura/breadcrumb';
import { reactive } from 'vue';


interface IReceiveItem {
    ReceptNumbar: string;
    ReceptNumber: string;
    StatusRecIC: string;
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
    total_detail?: number;
    IQA: number ;


} 
interface SplitMaterial {
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
    id?: number | null;
    no: string;
    lotNo: string;
    qty:  number;
    unit: string;
    expireDate: string;
    takeOutQty?: number;
    problem?: boolean ;
    remark?: string;
}

interface ILotSplitData {
    ItemNo: number ;
    LotSplit: string;
    receiveno: string;
    lot_unit: string;
    exp_date: Date;
    remark: string;
    isProblem: boolean;
    lot_qty: number;
}

interface ReceiveItem {
    itemNo : string | number;
    receiveno: string | number;
    lotNo: string | number;
}
interface ReceiveStoreState {
    items: IReceiveItem[];
    materialSplitItems: IReceiveItem[]; // เพิ่มสำหรับเก็บข้อมูล material-split แยกต่างหาก
    item_split: SplitMaterial[];
    loading: boolean;
    error: string | null;
    detail: any | null;
}



export type { IReceiveItem , filterMeta, IReceiveDetailItem , LotRow, ILotSplitData, ReceiveItem, ReceiveStoreState };