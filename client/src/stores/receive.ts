import { defineStore } from 'pinia';
import { ref, onMounted, reactive } from 'vue';
import { ApiService } from '@/service/api.service';

// If 'Receive' is a default export:
import { IReceiveItem, ILotSplitData, ReceiveItem, ReceiveStoreState } from '@/interfaces/receive.interfaces';
import { c } from 'node_modules/vite/dist/node/types.d-aGj9QkWt';

const default_state: ReceiveStoreState = {
    items: [],
    materialSplitItems: [], // เพิ่มสำหรับเก็บข้อมูล material-split แยกต่างหาก
    item_split: [],
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
        async getComponents(receiptNumber: string) {
            this.loading = true;
            this.error = null;

            const url: string = `http://localhost:3002/material-receive/details/${receiptNumber}`;
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

        async createLotSplit(lotSplitData: ILotSplitData) {
            this.loading = true;
            this.error = null;

            const url: string = `http://localhost:3002/material-receive/insert_lot-split`;
            try {
                console.log('Creating Lot Split with data:', lotSplitData);
                const data = await ApiService.post<any>(url, lotSplitData);
                return data;
            } catch (err: any) {
                this.error = err?.message || 'Failed to create lot split';
                return null;
            } finally {
                this.loading = false;
            }
        },
        async updateLotSplit(lotSplitData: any) {
            this.loading = true;
            this.error = null;

            const url: string = `http://localhost:3002/material-receive/update_lot-split`;
            try {
                console.log('Updating Lot Split with data:', lotSplitData);
                const data = await ApiService.post<any>(url, lotSplitData);
                return data;
            } catch (err: any) {
                this.error = err?.message || 'Failed to update lot split';
                return null;
            } finally {
                this.loading = false;
            }
        },
        async fetchLotSplitByRecAndItem(receiveItem: ReceiveItem) {
            this.loading = true;
            this.error = null;

            const url: string = `http://localhost:3002/material-receive/lot-split/${receiveItem.receiveno}?itemNo=${receiveItem.itemNo}`;
            try {
                const data = await ApiService.get<any>(url);
                return data;
            } catch (err: any) {
                this.error = err?.message || 'Failed to fetch lot split';
            } finally {
                this.loading = false;
            }
        },

        async Delete_LotSplit(reactiveItem: ReceiveItem) {
            this.loading = true;
            this.error = null;

            const url: string = `http://localhost:3002/material-receive/delete_LotSplit?receiveNo=${reactiveItem.receiveno}&itemNo=${reactiveItem.itemNo}&lotNo=${reactiveItem.lotNo}`;
            try {
                const data = await ApiService.delete<any>(url);
                return data;
            } catch (err: any) {
                this.error = err?.message || 'Failed to delete lot split';
            } finally {
                this.loading = false;
            }
        },

        async fetchMaterialSplit(startDate: string, endDate: string) {
            this.loading = true;
            this.error = null;
            const url: string = `http://localhost:3002/material-receive/material-split?startDate=${startDate}&endDate=${endDate}`;
            try {
                const data = await ApiService.get<any>(url);
                this.materialSplitItems = data; // ใช้ state แยกสำหรับ material-split
                return data;
            } catch (err: any) {
                this.error = err?.message || 'Failed to fetch material split';
                return null;
            } finally {
                this.loading = false;
            }
        },

        async fetchItemList() {
            this.loading = true;
            this.error = null;

            const url: string = `http://localhost:3002/material-receive/items`;
            try {
                const data = await ApiService.get<any>(url);
                return data;
            } catch (err: any) {
                this.error = err?.message || 'Failed to fetch item list';
                return null;
            } finally {
                this.loading = false;
            }
        },
        async fetchItem_by_itemNo(itemNo: string) {
            this.loading = true;
            this.error = null;
            const url: string = `http://localhost:3002/material-receive/item/${itemNo}`;
            try {
                const data = await ApiService.get<any>(url);
                return data;
            } catch (err: any) {
                this.error = err?.message || 'Failed to fetch item by itemNo';
                return null;
            }
        },

        async updateItemList(itemData: any) {
            this.loading = true;
            this.error = null;
            const url = 'http://localhost:3002/material-receive/update-item-list';
            try {
                const result = await ApiService.post<any>(url, itemData);
                return result;
            } catch (err: any) {
                this.error = err?.message || 'Failed to update item list';
                return null;
            } finally {
                this.loading = false;
            }
        },

        async fetchUnitPacking() {
            this.loading = true;
            this.error = null;
            const url = 'http://localhost:3002/material-receive/unit-packing';
            try {
                const data = await ApiService.get<any>(url);
                return data;
            } catch (err: any) {
                this.error = err?.message || 'Failed to fetch unit packing';
                return null;
            } finally {
                this.loading = false;
            }
        }
    }
});

export { useReceiveStore };
