import { defineStore } from 'pinia';
import { ApiService } from '@/service/api.service';
import { IReceiveItem, ILotSplitData, ReceiveItem, ReceiveStoreState } from '@/interfaces/receive.interfaces';
import { s } from 'node_modules/vite/dist/node/types.d-aGj9QkWt';
import Iqa_Checklist_Page from '@/components/IQA_Checklist/Iqa_Checklist_Page.vue';
import { item } from '@primeuix/themes/aura/breadcrumb';

const api = import.meta.env.VITE_API_URL;

const statusOptions = [
    { label: 'ทั้งหมด', value: 'all' },
    { label: 'รอการตรวจสอบ', value: 'pending' },
    { label: 'ผ่าน', value: 'pass' },
    { label: 'ไม่ผ่าน', value: 'fail' }
];

const useIqaCheckMaterialStore = defineStore('iqa_check_material', {
    state: () => ({
        statusOptions, // เก็บ options ไว้ใน state
        selectedStatus: 'all',
        items: [] as any[]
    }),
    getters: {
        selectedStatusLabel: (state) => {
            const found = state.statusOptions.find((opt) => opt.value === state.selectedStatus);
            return found ? found.label : '';
        }
    },
    actions: {
        setStatus(status) {
            this.selectedStatus = status;
        },
        async IqaCheckMaterialItems() {
            const response = await ApiService.get<any[]>(`${api}/check-material-receive/item-iqa`);
            this.items = response;
            
        },
        async sumIqaItems(invoiceNumber: string) {
            const response = await ApiService.post<any[]>(`${api}/check-material-receive/sumitem-iqa`, { invoiceNumber });
            
            return response;
        },
        async itemLotSplit(invoiceNumber: string) { //dialog
            const response = await ApiService.get<any[]>(`${api}/check-material-receive/item-lot-split`, { params: { invoiceNumber } });
            return response;
        }
    }
});

export { useIqaCheckMaterialStore };
