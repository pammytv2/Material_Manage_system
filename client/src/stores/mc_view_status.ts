import { Iqa_Checklist } from '@/interfaces/iqa.interfaces';
import { ReceiveItem } from '@/interfaces/receive.interfaces';
import { defineStore } from 'pinia';
import { ApiService } from '@/service/api.service';

const api = import.meta.env.VITE_API_URL;

const useMCviewStatusStore = defineStore('mc_view_status', {
    state: () => ({
        mcViewStatusItems: [] as Iqa_Checklist[],
        mcRcDataItems: [] as Iqa_Checklist[],
        selectedStatus: 'all' as string
    }),
    getters: {
        _mcViewStatusItems: (state) => state.mcViewStatusItems,
        _mcRcDataItems: (state) => state.mcRcDataItems,
    },

    actions: {
        setStatus(status: string) {
            this.selectedStatus = status;
        },
        async mc_view_status_items() {
            this.mcViewStatusItems = await ApiService.get<Iqa_Checklist[]>(`${api}/check-material-receive/mc-view-iqa-status`);
        },
        async mc_recnum(InvoiceNumber: string) {
           this.mcRcDataItems = await ApiService.get<Iqa_Checklist[]>(`${api}/check-material-receive/mc-recnum?InvoiceNumber=${InvoiceNumber}`);
        }
    }
});

export { useMCviewStatusStore };
