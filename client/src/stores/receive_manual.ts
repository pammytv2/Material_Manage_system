import { defineStore } from 'pinia';
import { ref, onMounted, reactive } from 'vue';
import { ApiService } from '@/service/api.service';
import { IReceiveItem, ILotSplitData, ReceiveItem, ReceiveStoreState } from '@/interfaces/receive.interfaces';
import { item } from '@primeuix/themes/aura/breadcrumb';

const default_state: ReceiveStoreState = {
    items: [],
    materialSplitItems: [], // เพิ่มสำหรับเก็บข้อมูล material-split แยกต่างหาก
    item_split: [],
    loading: false,
    error: null,
    detail: null
};

const useReceiveStore_manual = defineStore('receive_manual', {
    state: (): ReceiveStoreState => default_state,
    actions: {
        async fetchVDCODE() {
            try {
                this.loading = true;
                this.error = null;
                const url: string = `http://localhost:3002/material-receive-manual/vdcode`;

                const response = await ApiService.get<any>(url);
                this.items = response;
                return response;
            } catch (error) {
                if (error instanceof Error) {
                    this.error = error.message;
                } else {
                    this.error = 'Failed to sync items';
                }
                return null;
            }
        },
        async fetchItemList_manual(PONUMBER: string[], VDCODE: string) {
            try {
                this.loading = true;
                this.error = null;
                const poString = PONUMBER.join(',');
                const url: string = `http://localhost:3002/material-receive-manual/item-list-manual?PONUMBER=${encodeURIComponent(poString)}&VDCODE=${encodeURIComponent(VDCODE)}`;

                const response = await ApiService.get<any>(url);
                this.items = response;
                return response;
            } catch (error) {
                if (error instanceof Error) {
                    this.error = error.message;
                } else {
                    this.error = 'Failed to sync items';
                }
       
                return null;
            
            }
        }
    }
});
export { useReceiveStore_manual };
