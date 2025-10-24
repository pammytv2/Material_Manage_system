import { defineStore } from 'pinia';
import { ApiService } from '@/service/api.service';
import { IReceiveItem, ILotSplitData, ReceiveItem, ReceiveStoreState } from '@/interfaces/receive.interfaces';
import { Iqa_Checklist } from '@/interfaces/iqa.interfaces';
import { s } from 'node_modules/vite/dist/node/types.d-aGj9QkWt';
import Iqa_Checklist_Page from '@/components/IQA_Checklist/Iqa_Checklist_Page.vue';
import { item } from '@primeuix/themes/aura/breadcrumb';

const api = import.meta.env.VITE_API_URL;

const statusOptions = [
    { label: 'ทั้งหมด', value: 'all' },
    { label: 'รอการตรวจสอบ', value: 'pending' },
    { label: 'PASS', value: 'PASS' },
    { label: 'FAIL', value: 'FAIL' }
];

const iqaCheckOptions = [
    { label: 'Pass', value: 'pass', color: 'p-tag p-tag-success' },
    { label: 'Fail', value: 'fail', color: 'p-tag p-tag-danger' }
];

const useIqaCheckMaterialStore = defineStore('iqa_check_material', {
    state: () => ({
        statusOptions, // เก็บ options ไว้ใน state
        // iqaCheckOptions,
        selectedStatus: 'all',
        items: [] as any[],
        itemLotSplits: [] as ILotSplitData[],
        Iqa_Checklists: [] as Iqa_Checklist[],
        IqaCheckMaterialItems: [] as Iqa_Checklist[],
        Iqa_status: [] as Iqa_Checklist[]
    }),
    getters: {
        selectedStatusLabel: (state) => {
            const found = state.statusOptions.find((opt) => opt.value === state.selectedStatus);
            return found ? found.label : '';
        },
        _itemLotSplits: (state) => state.itemLotSplits,
        _sumIqaItem: (state) => state.Iqa_Checklists,
        _iqaItems: (state) => state.IqaCheckMaterialItems,
        _iqaStatus: (state) => state.Iqa_status,
        iqaCheckOptions: (state) =>
            state.Iqa_status.filter((item: any) => item.IsActive) // เฉพาะที่ active
                .map((item: any) => ({ label: item.IQA_Name, value: item.IQA_Name, color: item.IQA_Name === 'PASS' ? 'p-tag p-tag-success' : item.IQA_Name === 'FAIL' ? 'p-tag p-tag-danger' : ''}))
        
    },
    actions: {
        setStatus(status) {
            this.selectedStatus = status;
        },
        async fetchIqaCheckMaterialItems() {
            this.IqaCheckMaterialItems = await ApiService.get<Iqa_Checklist[]>(`${api}/check-material-receive/item-iqa`);
        },
        async sumIqaItems(invoiceNumber: Iqa_Checklist['InvoiceNumber']): Promise<Iqa_Checklist[]> {
            this.Iqa_Checklists = await ApiService.post<Iqa_Checklist[]>(`${api}/check-material-receive/sumitem-iqa`, { invoiceNumber });
            return this.Iqa_Checklists;
        },
        async itemLotSplit(invoiceNumber: ReceiveItem['invoiceNumber']): Promise<void> {
            //dialog
            this.itemLotSplits = await ApiService.get<ILotSplitData[]>(`${api}/check-material-receive/item-lot-split`, { params: { invoiceNumber } });
        },
        async status_iqa_check(): Promise<void> {
            this.Iqa_status = await ApiService.get<Iqa_Checklist[]>(`${api}/check-material-receive/status-iqa-check`);
        },
        async submitIqaCheck({ invoiceNumber, ReceiveNo, lotNo, status }: { invoiceNumber: string; ReceiveNo: string; lotNo: string; status: string }) {
            await ApiService.post(`${api}/check-material-receive/iqa-check-submit`,{},{params: {invoiceNumber,ReceiveNo,lotNo,status}});
        }
    }
});

export { useIqaCheckMaterialStore };
