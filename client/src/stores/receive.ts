import { defineStore } from 'pinia';
import { ref, onMounted } from 'vue';
import { ApiService } from '@/service/api.service';

// If 'Receive' is a default export:
import { IReceiveItem } from '@/interfaces/receive.interfaces';
import { c } from 'node_modules/vite/dist/node/types.d-aGj9QkWt';
// Import or define ReceiveStorState

interface ReceiveStoreState {
    items: IReceiveItem[];
    loading: boolean;
    error: string | null;
    detail: any | null;
}

const default_state: ReceiveStoreState = {
    items: [],
    loading: false,
    error: null,
    detail: null
};

const useReceiveStore = defineStore('receive', {
    state: (): ReceiveStoreState => default_state,
    actions: {


        async syncItems(startDate: string, endDate: string) {
            this.loading = true;
            this.error = null;
            // Example URL, adjust as necessary
            const url: string = `http://localhost:3002/material-receive/sync?startDate=${startDate}&endDate=${endDate}`;
            try {
                const data = await ApiService.get<any>(url);
                this.items = data;
                return data;
            } catch (err: any) {
                this.error = err?.message || 'Failed to sync items';
                return null;
            } finally {
                this.loading = false;
            }
        },
        async getComponents(receiptNumber: string, StatusRecIC: number) {
            this.loading = true;
            this.error = null;

            const url: string = `http://localhost:3002/material-receive/details/${receiptNumber}?StatusRecIC=${StatusRecIC}`;
            try {
                const data = await ApiService.get<any>(url);
                this.detail = data;
                return data;
            } catch (err: any) {
                this.error = err?.message || 'Failed to get components';
                return null;
            } finally {
                this.loading = false;
            }
        },

        async fetchLotStatusIQA(IQAStatusID: number) {
            this.loading = true;
            this.error = null;

            const url: string = `http://localhost:3002/material-receive/lot-status-iqa/${IQAStatusID}?IQAStatusID=${IQAStatusID}`;
            try {
                const data = await ApiService.get<any>(url);
                return data;
            } catch (err: any) {
                this.error = err?.message || 'Failed to fetch lot status IQA';
            } finally {
                this.loading = false;
            }
        },

    }
});

export { useReceiveStore };
