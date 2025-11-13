import { defineStore } from 'pinia';
import { ApiService } from '@/service/api.service';
import { IReceiveItem, ILotSplitData, ReceiveItem, ReceiveStoreState } from '@/interfaces/receive.interfaces';
import { Iqa_Checklist,Iqaabnormal } from '@/interfaces/iqa.interfaces';
import { s } from 'node_modules/vite/dist/node/types.d-aGj9QkWt';
import Iqa_Checklist_Page from '@/components/IQA_Checklist/Iqa_Checklist_Page.vue';
import { item } from '@primeuix/themes/aura/breadcrumb';
import { console } from 'inspector';

const api = import.meta.env.VITE_API_URL;

const statusOptions = [
    { label: 'ทั้งหมด', value: 'all' }, // ค่าเริ่มต้น
    { label: 'รอการตรวจสอบ', value:  '' },
    { label: 'ตรวจสอบผ่านแล้ว', value: 'Inspected by IQA' },
    { label: 'ตรวจสอบยังไม่ผ่าน', value: 'Failed Inspection' },
];

const useIqaCheckMaterialStore = defineStore('iqa_check_material', {
    state: () => ({
        statusOptions, // เก็บ options ไว้ใน state
        selectedStatus: 'all',
        items: [] as any[],
        itemLotSplits: [] as ILotSplitData[],
        Iqa_Checklists: [] as Iqa_Checklist[],
        IqaCheckMaterialItems: [] as Iqa_Checklist[],
        Iqa_check_Inspec: [] as Iqa_Checklist[],
        item_Inspec: [] as Iqa_Checklist[],
        Iqa_status: [] as Iqa_Checklist[],
        iqa_view_normal: [] as  Iqaabnormal[],
        ItemListTransaction_MC_PROD: [] as Iqa_Checklist[],
        insert_item_normal_iqa: [] as Iqaabnormal[],
        
    }),
    getters: {
        selectedStatusLabel: (state) => {
            const found = state.statusOptions.find((opt) => opt.value === state.selectedStatus);
            return found ? found.label : '';
        },                                
       filteredReceiveList: (state) => {
    let status: string | { value: string } = state.selectedStatus as string | { value: string };
    if (status && typeof status === 'object' && 'value' in status) {
        status = status.value;
    }
    return !status || status === 'all'
        ? state.IqaCheckMaterialItems
        : state.IqaCheckMaterialItems.filter((item) => item.IQA_Status === status);
},
        _itemLotSplits: (state) => state.itemLotSplits,
        _sumIqaItem: (state) => state.Iqa_Checklists,
        _iqaItems: (state) => state.IqaCheckMaterialItems,
        _iqaStatus: (state) => state.Iqa_status,
        _iqaCheckInspec: (state) => state.Iqa_check_Inspec,
        _itemInspec: (state) => state.item_Inspec,
        _itemListTransaction_MC_PROD: (state) => state.ItemListTransaction_MC_PROD,
        _iqaViewNormal: (state) => state.iqa_view_normal,
        _insertItemNormal: (state) => state.insert_item_normal_iqa,
        iqaCheckOptions: (state) =>
            state.Iqa_status.filter((item: any) => item.IsActive) // เฉพาะที่ active
                .map((item: any) => ({ label: item.IQA_Name, value: item.IQA_Name, color: item.IQA_Name === 'PASS' ? 'p-tag p-tag-success' : item.IQA_Name === 'REWORK' ? 'p-tag p-tag-warning' : item.IQA_Name === 'REJECT' ? 'p-tag p-tag-danger' : 'p-tag p-tag-info' })),
       
    },
    actions: {
        
        setStatus(status) {
            this.selectedStatus = status;
        },
        async fetchIqaCheckMaterialItems() {
            this.IqaCheckMaterialItems = await ApiService.get<Iqa_Checklist[]>(`${api}/check-material-receive/item-iqa`);
        },
        async fetchIqaCheckMaterialItems_inspec() {
            this.item_Inspec = await ApiService.get<Iqa_Checklist[]>(`${api}/check-material-receive/item-iqa-inspec`);
        },
        async sumIqaItems(invoiceNumber: string, itemNo: string): Promise<Iqa_Checklist[]> {
            this.Iqa_Checklists = await ApiService.post<Iqa_Checklist[]>(`${api}/check-material-receive/sumitem-iqa`, { invoiceNumber, itemNo });
            return this.Iqa_Checklists;
        },
        async itemLotSplit(invoiceNumber: ReceiveItem['invoiceNumber']): Promise<void> {
            this.itemLotSplits = await ApiService.get<ILotSplitData[]>(`${api}/check-material-receive/item-lot-split`, { params: { invoiceNumber } });
        },
        async status_iqa_check(): Promise<void> {
            this.Iqa_status = await ApiService.get<Iqa_Checklist[]>(`${api}/check-material-receive/status-iqa-check`);
        },
        async submitIqaCheck({ invoiceNumber, ReceiveNo, lotNo, status, remark_iqa, lot_user }: { invoiceNumber: string; ReceiveNo: string; lotNo: string; status: string; remark_iqa: string; lot_user: string }) {
            // status จะเป็น "PASS" หรือ "FAIL" ตามที่เลือกใน dropdown
            await ApiService.post(`${api}/check-material-receive/iqa-check-submit`, {}, { params: { invoiceNumber, ReceiveNo, lotNo, status, remark_iqa, lot_user } });
        },
        async completeIqaCheck({ invoiceNumber, ReceiveNo, lotNo }: { invoiceNumber: string; ReceiveNo: string; lotNo: string }) {
            // ค่า status ที่บันทึกลง DB จะเป็น "PASS" หรือ "FAIL" ตามที่เลือก
            await ApiService.post(`${api}/check-material-receive/iqa-check-complete`, {}, { params: { invoiceNumber, ReceiveNo, lotNo} });
        },
        
        async addItemListTransaction_MC_PROD(): Promise<void> {
            this.ItemListTransaction_MC_PROD = await ApiService.get<Iqa_Checklist[]>(`${api}/check-material-receive/add-item-transaction-mc-prod`);
        },

        async iqa_check_Inspec({ lotNo, invoiceNumber, ReceiveNo, status_Inspec, remark_inspec, lot_no_check,abnormally_number, inspec_user }: { lotNo: string; invoiceNumber: string; ReceiveNo: string; status_Inspec: string; remark_inspec: string; lot_no_check: number; abnormally_number: string,inspec_user:string }) {
            this.Iqa_check_Inspec= await ApiService.post(`${api}/check-material-receive/iqa-check-Inspec`, {}, { params: { lotNo, invoiceNumber, ReceiveNo, status_Inspec, remark_inspec, lot_no_check, abnormally_number, inspec_user } });
        },
        // View iqa view normal check
        async iqa_view_item_normal(): Promise<void> {
            this.iqa_view_normal = await ApiService.get<Iqaabnormal[]>(`${api}/check-material-receive/iqa-view-normal-check`);
        },
        async iqa_check_Inspec_all({ ITEMNO, invoiceNumber, status_Inspec, remark_inspec, inspec_user }: { ITEMNO: string; invoiceNumber: string; status_Inspec: string; remark_inspec: string; inspec_user: string }) {
            await ApiService.post(`${api}/check-material-receive/iqa-check-Inspec-all`, {}, { params: { ITEMNO, invoiceNumber, status_Inspec, remark_inspec, inspec_user } });
        },
        // Insert iqa view normal check
        async insert_item_normal(): Promise<void> {
            this.insert_item_normal_iqa= await ApiService.get<Iqaabnormal[]>(`${api}/check-material-receive/insert-iqa-view-normal-check`);
        },
        async iqa_add_abnormal_number({ lotNo, invoiceNumber, ITEMNO, Abnormal_Number,abnormal_user }: { lotNo: string; invoiceNumber: string; ITEMNO: string; Abnormal_Number: string ,abnormal_user:string}) {
            await ApiService.post(`${api}/check-material-receive/iqa-add-abnormal-number`, {}, { params: { lotNo, invoiceNumber, ITEMNO, Abnormal_Number, abnormal_user } });
        },
        async iqa_add_abnormal_number_all({ invoiceNumber, ITEMNO, Abnormal_Number,abnormal_user }: { invoiceNumber: string; ITEMNO: string; Abnormal_Number: string, abnormal_user:string }) {
            await ApiService.post(`${api}/check-material-receive/iqa-add-abnormal-number-all`, {}, { params: { invoiceNumber, ITEMNO, Abnormal_Number, abnormal_user } });
    }
}
});
    
export { useIqaCheckMaterialStore };
