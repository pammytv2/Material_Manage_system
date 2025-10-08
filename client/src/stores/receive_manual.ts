import { defineStore } from 'pinia';
import { ref, onMounted, reactive } from 'vue';
import { ApiService } from '@/service/api.service';
import { IReceiveItem, ILotSplitData, ReceiveItem, ReceiveStoreState } from '@/interfaces/receive.interfaces';
import { item } from '@primeuix/themes/aura/breadcrumb';
const api = import.meta.env.VITE_API_URL;
const default_state: ReceiveStoreState = {
    items: [],
    materialSplitItems: [], // เพิ่มสำหรับเก็บข้อมูล material-split แยกต่างหาก
    item_split: [],
    loading: false,
    error: null,
    detail: null
};
// Declare missing variables

const useReceiveStore_manual = defineStore('receive_manual', {
    state: (): ReceiveStoreState => default_state,
    actions: {
        async fetchVDCODE() {
            try {
                this.loading = true;
                this.error = null;
                const url: string = `${api}/material-receive-manual/vdcode`;

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
        async fetchItemList_spec() {
            try {
                this.loading = true;
                this.error = null;
                const url: string = `${api}/material-receive-manual/item-list-spec`;
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
        async fetchItemList_manual(PONUMBER: string[], VDCODE: string | { code: string }) {
            try {
                this.loading = true;
                this.error = null;
                const poString = PONUMBER.join(',');
                const vdcode = typeof VDCODE === 'string' ? VDCODE : VDCODE.code ?? '';
                const url = `${api}/material-receive-manual/item-list-manual?PONUMBER=${encodeURIComponent(poString)}&VDCODE=${encodeURIComponent(vdcode)}`;
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
        async fetchLocation() {
            try {
                this.loading = true;
                this.error = null;
                const url: string = `${api}/material-receive-manual/location`;
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

       async updateReceiveItems(items: { ItemNo: string; ReceiveQty: number }[], invoiceNumber: string) {
        try {
            this.loading = true;
            this.error = null;
            const url = `${api}/material-receive-manual/update-receive-items`;
            const payload = {
                items,
                invoiceNumber
            };
            const response = await ApiService.put<any>(url, payload);
            this.loading = false;
            return response;
        } catch (error) {
            this.loading = false;
            if (error instanceof Error) {
                this.error = error.message;
            } else {
                this.error = 'Failed to update receive items';
            }
            return null;
        }
    },

    async insertNoPoItems(items: { ItemNo: string; ReceiveQty: number; InvoiceNo: string; VDCODE: string }[], VDCODE: string, invoiceNumber: string) {
        try {
            this.loading = true;
            this.error = null;
            const url = `${api}/material-receive-manual/update-receive-items NO_PO`;
            const payload = {
                items,
                VDCODE,
                invoiceNumber
            };
            const response = await ApiService.put<any>(url, payload);
            this.loading = false;
            return response;
        } catch (error) {
            this.loading = false;
            if (error instanceof Error) {
                this.error = error.message;
            } else {
                this.error = 'Failed to update NO_PO items';
            }
            return null;
        }
    },


    async fetchItemList_lotSplit(ItemNo: string , location: string) {
        try {
            this.loading = true;
            this.error = null;
            const url: string = `${api}/material-receive-manual/item-list-lot-split/${encodeURIComponent(ItemNo)}/${encodeURIComponent(location)}`;
            const response = await ApiService.get<any>(url);
            this.items = response;
            return response;
        } catch (error) {
            this.loading = false;
            if (error instanceof Error) {
                this.error = error.message;
            } else {
                this.error = 'Failed to fetch item list lot split';
            }
            return null;
        }
    }
}
});
export { useReceiveStore_manual };


