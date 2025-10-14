import { defineStore } from 'pinia';
import { ref, onMounted, reactive } from 'vue';
import { ApiService } from '@/service/api.service';

// If 'Receive' is a default export:
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



const useReceiveStore = defineStore('receive', {
    state: (): ReceiveStoreState => default_state,
    actions: {
        async syncItems(startDate: string, endDate: string) {
            this.loading = true;
            this.error = null;
            // Example URL, adjust as necessary
            const url: string = `${api}/material-receive/sync?startDate=${startDate}&endDate=${endDate}`;
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
        async fetchSyncReceiveDetail(receiptNumber: string, StatusRecIC: string) {
            this.loading = true;
            this.error = null;
            const url = `${api}/material-receive/syncReceiveDetail/${receiptNumber}?StatusRecIC=${StatusRecIC}`;
            try {
                const data = await ApiService.get<any>(url);
                return data;
            } catch (err: any) {
                this.error = err?.message || 'Failed to fetch sync receive detail';
                return null;
            } finally {
                this.loading = false;
            }
        },
       async fetchReceiveItems(receiptNumber: string) {
    this.loading = true;
    this.error = null;
    const url: string = `${api}/material-receive/view-item?ReceptNumber=${receiptNumber}`;
    try {
        const data = await ApiService.get<IReceiveItem[]>(url);
        this.item_split = data;
        return data;
    } catch (err: any) {
        this.error = err?.message || 'Failed to fetch receive items';
        return null;
    } finally {
        this.loading = false;
    }
},
        async getComponents(receiptNumber: string) {
            this.loading = true;
            this.error = null;

            const url: string = `${api}/material-receive/details/${receiptNumber}`;
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

            const url: string = `${api}/material-receive/lot-status-iqa/${IQAStatusID}?IQAStatusID=${IQAStatusID}`;
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

            const url: string = `${api}/material-receive/insert_lot-split`;
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

            const url: string = `${api}/material-receive/update_lot-split`;
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

            const url: string = `${api}/material-receive/lot-split/${receiveItem.receiveno}?itemNo=${receiveItem.itemNo}`;
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

            const url: string = `${api}/material-receive/delete_LotSplit?receiveNo=${reactiveItem.receiveno}&itemNo=${reactiveItem.itemNo}&lotNo=${reactiveItem.lotNo}`;
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
            const url: string = `${api}/material-receive/material-split?startDate=${startDate}&endDate=${endDate}`;
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

            const url: string = `${api}/material-receive/items`;
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
            const url: string = `${api}/material-receive/item/${itemNo}`;
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
            const url = `${api}/material-receive/update-item-list`;
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
        async fetchLotSplit() {
            this.loading = true;
            this.error = null;
            const url = `${api}/material-manage/lot-split`;
            try {
                const data = await ApiService.get<any>(url);
                return data;
            } catch (err: any) {
                this.error = err?.message || 'Failed to fetch lot split';
                return null;
            } finally {
                this.loading = false;
            }
        },
        async fetchExpData() {
            this.loading = true;
            this.error = null;
            const url = `${api}/material-manage/exp-data`;
            try {
                const data = await ApiService.get<any>(url);
                return data;
            } catch (err: any) {
                this.error = err?.message || 'Failed to fetch exp data';
                return null;
            } finally {
                this.loading = false;
            }
        },
        async fetchIQA() {
            this.loading = true;
            this.error = null;
            const url = `${api}/material-manage/iqa`;
            try {
                const data = await ApiService.get<any>(url);
                return data;
            } catch (err: any) {
                this.error = err?.message || 'Failed to fetch IQA';
                return null;
            } finally {
                this.loading = false;
            }
        },

        async fetchType2() {
            this.loading = true;
            this.error = null;
            const url = `${api}/material-manage/type2`;
            try {
                const data = await ApiService.get<any>(url);
                return data;
            } catch (err: any) {
                this.error = err?.message || 'Failed to fetch type2';
                return null;
            } finally {
                this.loading = false;
            }
        },

        async fetchZone() {
            this.loading = true;
            this.error = null;
            const url = `${api}/material-manage/zone`;
            try {
                const data = await ApiService.get<any>(url);
                return data;
            } catch (err: any) {
                this.error = err?.message || 'Failed to fetch zone';
                return null;
            } finally {
                this.loading = false;
            }
        },
        async fetchInactiveItem() {
            this.loading = true;
            this.error = null;

            const url = `${api}/material-manage/inactive-item`;
            try {
                const data = await ApiService.get<any>(url);
                return data;
            } catch (err: any) {
                this.error = err?.message || 'Failed to fetch inactive item';
                return null;
            } finally {
                this.loading = false;
            }
        },

        async fetchExamineNullItem() {
            this.loading = true;
            this.error = null;
            const url = `${api}/material-manage/examine-null-item`;
            try {
                const data = await ApiService.get<any>(url);
                return data;
            } catch (err: any) {
                this.error = err?.message || 'Failed to fetch examine null item';
                return null;
            } finally {
                this.loading = false;
            }
        },

        async fetchGetItem() {
            this.loading = true;
            this.error = null;
            const url = `${api}/material-manage/count-item-null`;
            try {
                const data = await ApiService.get<any>(url);
                return data;
            } catch (err: any) {
                this.error = err?.message || 'Failed to fetch count item null';
                return null;
            } finally {
                this.loading = false;
            }
        },
        async fetchInsertItem(additem: any) {
            this.loading = true;
            this.error = null;
            const url = `${api}/material-manage/add-item`;
            try {
                const data = await ApiService.post<any>(url, additem);
                return data;
            } catch (err: any) {
                this.error = err?.message || 'Failed to insert new item';
                return null;
            } finally {
                this.loading = false;
            }
        },

        async fetchnewItem(itemNo: string) {
            this.loading = true;
            this.error = null;
            const url = `${api}/material-manage/itemnewdetail/${itemNo}`;
            try {
                const data = await ApiService.get<any>(url);
                return data;
            } catch (err: any) {
                this.error = err?.message || 'Failed to fetch new item';
                return null;
            } finally {
                this.loading = false;
            }
        },

        async fetchUpdateItem_Type() {
            this.loading = true;
            this.error = null;
            const url = `${api}/material-manage/item_type_update`;
            try {
                const result = await ApiService.get<any>(url);
                return result;
            } catch (err: any) {
                this.error = err?.message || 'Failed to update item type';
                return null;
            } finally {
                this.loading = false;
            }
        },

        async fetchUpdateItem_New(additem: any) {
            this.loading = true;
            this.error = null;
            const url = `${api}/material-manage/update-item`;
            try {
                const result = await ApiService.post<any>(url, additem);
                return result;
            } catch (err: any) {
                this.error = err?.message || 'Failed to update item new';
                return null;
            } finally {
                this.loading = false;
            }
        },

        async fetchItemactiveUpdate() {
            this.loading = true;
            this.error = null;
            const url = `${api}/material-manage/active-update-item`;
            try {
                const data = await ApiService.get<IActiveUpdateItem>(url);
                return data;
            } catch (err: any) {
                this.error = err?.message || 'Failed to fetch inactive item';
                return null;
            } finally {
                this.loading = false;
            }
        }
    }


    
    
    
});


interface IActiveUpdateItem {
    Message: string;
    UpdatedRows: number;
}

export { useReceiveStore };
