import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useReceiveStore } from '@/stores/receive';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';

export function useManageMaterialStore() {
    const loading = ref(false);
    const showActive = ref(true);
    const showInactive = ref(false);
    const router = useRouter();
    const errors = ref<{ [key: string]: string }>({});
    const confirmPopup = useConfirm();
    const toast = useToast();
    const showNewItemDialog = ref(false);
    const newItems = ref<any[]>([]);
    const showDialog = ref(false);
    const selectedRow = ref<any>(null);
    const selectedItems = ref<any[]>([]);
    const receiveStore = useReceiveStore();
    const unitPackingOptions = ref([]);
    const type2Options = ref<{ label: string; value: string }[]>([]);
    const inactiveOptions = ref([]);
    const groupProductOptions = ref([]);
    const zoneOptions = ref<{ label: string; value: string | number }[]>([]);
    const lotSplitOptions = ref([]);
    const iqaOptions = ref([]);
    const showMaterialDetailsDialog = ref(false);
    const showEditMaterialDialog = ref(false);
    const expDateOptions = ref([]);
    const itemList = ref<any[]>([]);
    const searchQuery = ref('');

    const filteredItemList = computed(() => {
        let list = itemList.value.filter((item) => {
            if (showActive.value && showInactive.value) return true;
            if (showActive.value) return !item.Inactive;
            if (showInactive.value) return !!item.Inactive;
            return false;
        });

        if (searchQuery.value && searchQuery.value.trim() !== '') {
            const keyword = searchQuery.value.trim().toLowerCase();
            list = list.filter((item) => {
                const convertValue = (value: any) => {
                    if (value === null || value === undefined || value === '') {
                        return 'n/a';
                    }
                    return value.toString().toLowerCase();
                };

                return (
                    convertValue(item.ItemNo).includes(keyword) ||
                    convertValue(item.ITEMDesc).includes(keyword) ||
                    convertValue(item.TYPE).includes(keyword) ||
                    convertValue(item.Type2Name).includes(keyword) ||
                    convertValue(item.UNIT).includes(keyword) ||
                    convertValue(item.PARTCHIP).includes(keyword) ||
                    convertValue(item.VENDOR).includes(keyword) ||
                    convertValue(item.PROJECT).includes(keyword) ||
                    convertValue(item.GROUPMAT).includes(keyword) ||
                    convertValue(item.SECTIONGROUP).includes(keyword) ||
                    convertValue(item.CATEGORY).includes(keyword) ||
                    convertValue(item.SPEC).includes(keyword) ||
                    convertValue(item.ZoneID).includes(keyword) ||
                    convertValue(item.ZoneCode).includes(keyword) ||
                    convertValue(item.Packing).includes(keyword)
                );
            });
        }

        return list;
    });

    function validateEditMaterialForm() {
        errors.value = {};
        if (!selectedRow.value.Type2) {
            errors.value.Type2 = 'กรุณาเลือก Type2';
        }
        if (!selectedRow.value.Min || isNaN(Number(selectedRow.value.Min))) {
            errors.value.Min = 'กรุณากรอก Min เป็นตัวเลข';
        }
        if (!selectedRow.value.Max || isNaN(Number(selectedRow.value.Max))) {
            errors.value.Max = 'กรุณากรอก Max เป็นตัวเลข';
        }
        if (!selectedRow.value.Packing || isNaN(Number(selectedRow.value.Packing))) {
            errors.value.Packing = 'กรุณากรอก Packing เป็นตัวเลข';
        }
        if (!selectedRow.value.ZoneID) {
            errors.value.ZoneID = 'กรุณาเลือก Zone';
        }
        if (!selectedRow.value.LotSplit && selectedRow.value.LotSplit !== 0) {
            errors.value.LotSplit = 'กรุณาเลือก Lot Split';
        }
        if (!selectedRow.value.IQA && selectedRow.value.IQA !== 0) {
            errors.value.IQA = 'กรุณาเลือก IQA';
        }
        if (!selectedRow.value.ExpDate && selectedRow.value.ExpDate !== 0) {
            errors.value.ExpDate = 'กรุณาเลือก Exp Date';
        }

        return Object.keys(errors.value).length === 0;
    }

    function getLotSplitStatusText(LotSplit: any) {
        if (LotSplit === true || LotSplit === 1 || LotSplit === '1') return 'Yes';
        if (LotSplit === false || LotSplit === 0 || LotSplit === '0') return 'No';
        return 'Not Specified';
    }

    function getInactiveStatusText(Inactive: any) {
        if (Inactive === true || Inactive === 1 || Inactive === '1') return 'Inactive';
        if (Inactive === false || Inactive === 0 || Inactive === '0') return 'Active';
        return 'Not Specified';
    }

    function getInactiveStatusClass(status: string | number | boolean) {
        if (status === true || status === 1 || status === '1' || status === 'Inactive') {
            return 'p-tag p-tag-danger';
        }
        if (status === false || status === 0 || status === '0' || status === 'Active') {
            return 'p-tag p-tag-success';
        }
        if (status === 'Not Specified') {
            return 'p-tag p-tag-secondary';
        }
        return 'p-tag';
    }

    function getLotSplitStatusClass(status: string) {
        switch (status) {
            case 'Yes':
                return 'p-tag p-tag-success';
            case 'No':
                return 'p-tag p-tag-danger';
            case 'Not Specified':
                return 'p-tag p-tag-secondary';
            default:
                return 'p-tag';
        }
    }



    

    function getIQAStatusText(iqa: any) {
        if (iqa === true || iqa === 1 || iqa === '1') return 'Yes';
        if (iqa === false || iqa === 0 || iqa === '0') return 'No';
        if (iqa === 'PASS') return 'PASS';
        if (iqa === 'REJECT') return 'REJECT';
        if (iqa ==='REWORK' ) return 'REWORK';
        return 'Select Status';
    }

    function getIQARequiredClass(text: string) {
        switch (text) {
            case 'Yes':
                return 'p-tag p-tag-success';
            case 'PASS':
                return 'p-tag p-tag-success';
            case 'REJECT':
                return 'p-tag p-tag-danger';
            case 'REWORK':
                return 'p-tag p-tag-warning';
            case 'No':
                return 'p-tag p-tag-danger';
            case 'Not Specified':
                return 'p-tag p-tag-secondary';
            
            default:
                return 'p-tag p-tag-secondary';
        }
    }




    function getExpireDateStatusText(ExpDate: any) {
        if (ExpDate === true || ExpDate === 1 || ExpDate === '1') return 'Yes';
        if (ExpDate === false || ExpDate === 0 || ExpDate === '0') return 'No';
        return 'Not Specified';
    }

    function getExpireDateStatusClass(status: string) {
        switch (status) {
            case 'No':
                return 'p-tag p-tag-danger';
            case 'Yes':
                return 'p-tag p-tag-success';
            case 'Not Specified':
                return 'p-tag p-tag-secondary';
            default:
                return 'p-tag';
        }
    }

    function customFilterFunction(value: any, filter: any): boolean {
        if (filter === undefined || filter === null || filter === '') {
            return true;
        }

        const filterLower = filter.toLowerCase();

        if (value === undefined || value === null || value === '') {
            return filterLower === 'n/a' || filterLower === 'na';
        }

        const valueLower = value.toString().toLowerCase();
        return valueLower.includes(filterLower);
    }

    function confirmAddNewItem(event: MouseEvent) {
        if (!validateEditMaterialForm()) {
            toast.add({ severity: 'error', summary: 'Error', detail: 'กรุณากรอกข้อมูลให้ถูกต้อง', life: 3000 });
            return;
        }
        confirmPopup.require({
            target: event.target as HTMLElement,
            message: 'Are you sure you want to save this new material?',
            icon: 'pi pi-exclamation-triangle',
            rejectProps: {
                label: 'Cancel',
                severity: 'secondary',
                outlined: true
            },
            acceptProps: {
                label: 'Save'
            },
            accept: async () => {
                await addNewItem();
            }
        });
    }

    async function Edit(row?: any) {
        if (row) {
            const itemNo = row.ItemNo || row.ITEMNO;
            const savedItem = itemList.value.find((i) => (i.ItemNo ?? i.ITEMNO ?? '').toString().trim().toUpperCase() === (itemNo ?? '').toString().trim().toUpperCase());
            
            selectedRow.value = {
                ...row,
                Max: savedItem?.Max ?? row.Max ?? '',
                Min: savedItem?.Min ?? row.Min ?? '',
                Packing: savedItem?.Packing ?? row.Packing ?? '',
                Type2: savedItem?.Type2ID !== undefined ? savedItem.Type2ID : savedItem?.Type2 !== undefined ? savedItem.Type2 : row.Type2ID !== undefined ? row.Type2ID : row.Type2 !== undefined ? row.Type2 : '',
                ZoneID: savedItem?.ZoneID ?? row.ZoneID ?? '',
                LotSplit: savedItem?.LotSplit !== undefined ? String(Number(savedItem.LotSplit)) : row.LotSplit !== undefined ? String(Number(row.LotSplit)) : '',
                IQA: savedItem?.IQA !== undefined ? String(Number(savedItem.IQA)) : row.IQA !== undefined ? String(Number(row.IQA)) : '',
                ExpDate: savedItem?.ExpDate !== undefined ? String(Number(savedItem.ExpDate)) : row.ExpDate !== undefined ? String(Number(row.ExpDate)) : ''
            };

            try {
                const itemData = await receiveStore.fetchnewItem(itemNo);
                if (Array.isArray(itemData) && itemData.length > 0) {
                    selectedRow.value = { ...selectedRow.value, ...itemData[0] };
                } else if (itemData) {
                    selectedRow.value = { ...selectedRow.value, ...itemData };
                }

                showEditMaterialDialog.value = true;
            } catch (error) {
                toast.add({ severity: 'error', summary: 'Error', detail: 'ไม่พบข้อมูล item หรือ API มีปัญหา', life: 3000 });
            }
        } else {
            showEditMaterialDialog.value = false;
            selectedRow.value = null;
        }
    }

    async function addNewItem() {
        loading.value = true;
        try {
            const additem = {
                ItemNo: selectedRow.value.ItemNo || selectedRow.value.ITEMNO || '',
                Type2ID: selectedRow.value.Type2,
                Packing: selectedRow.value.Packing,
                ZoneID: selectedRow.value.ZoneID,
                LotSplit: selectedRow.value.LotSplit,
                IQA: selectedRow.value.IQA,
                ExpDate: selectedRow.value.ExpDate,
                Min: selectedRow.value.Min,
                Max: selectedRow.value.Max,
                UNIT: selectedRow.value.UNIT
            };
            console.log('Payload for new item:', additem);
            const result = await receiveStore.fetchInsertItem(additem);
            if (result && result.success) {
                toast.add({ severity: 'success', summary: 'Success', detail: 'Add item successful', life: 3000 });
                itemList.value = await receiveStore.fetchItemList();
                showEditMaterialDialog.value = false;
                await receiveStore.fetchUpdateItem_Type();
            } else {
                toast.add({ severity: 'error', summary: 'Error', detail: 'Add item failed', life: 3000 });
            }
        } finally {
            loading.value = false;
        }
    }

    async function saveLotSplit() {
        loading.value = true;
        const oldType2Id = selectedRow.value.Type2ID ?? selectedRow.value.Type2 ?? 0;
        try {
            let type2Id = selectedRow.value.Type2;
            if (selectedRow.value.Type2Name && selectedRow.value.Type2Name !== 'N/A') {
                const found = type2Options.value.find((opt) => opt.label === selectedRow.value.Type2Name);
                if (found) {
                    type2Id = found.value;
                }
            }
            const itemData = {
                itemNo: selectedRow.value.ItemNo,
                Inactive: Number(selectedRow.value.Inactive ?? 0),
                LotSplit: Number(selectedRow.value.LotSplit ?? 0),
                Packing: Number(selectedRow.value.Packing ?? 0),
                Type2: selectedRow.value.Type2 !== undefined && selectedRow.value.Type2 !== null && selectedRow.value.Type2 !== '' ? Number(selectedRow.value.Type2) : oldType2Id,
                IQA: Number(selectedRow.value.IQA ?? 0),
                ExpDate: Number(selectedRow.value.ExpDate ?? 0),
                GroupMatID: Number(selectedRow.value.GroupMatID ?? 0),
                Min: Number(selectedRow.value.Min ?? 0),
                ZoneID: Number(selectedRow.value.ZoneID ?? 0),
                Max: Number(selectedRow.value.Max ?? 0),
                GProdID: Number(selectedRow.value.GProdID ?? 0)
            };
            console.log('Payload for updateItemList:', itemData);
            const result = await receiveStore.updateItemList(itemData);

            if (result !== undefined && result !== null) {
                toast.add({ severity: 'success', summary: 'Success', detail: 'Update successful', life: 3000 });
                const data = await receiveStore.fetchItemList();
                itemList.value = data;
                showMaterialDetailsDialog.value = false;
            } else {
                toast.add({ severity: 'error', summary: 'Error', detail: 'Update failed', life: 3000 });
            }
        } finally {
            loading.value = false;
        }
    }

    return {
        loading,
        showActive,
        showInactive,
        errors,
        showNewItemDialog,
        newItems,
        showDialog,
        selectedRow,
        selectedItems,
        showMaterialDetailsDialog,
        showEditMaterialDialog,
        searchQuery,
        itemList,
        unitPackingOptions,
        type2Options,
        inactiveOptions,
        groupProductOptions,
        zoneOptions,
        lotSplitOptions,
        iqaOptions,
        expDateOptions,
        filteredItemList,
        validateEditMaterialForm,
        getLotSplitStatusText,
        getInactiveStatusText,
        getInactiveStatusClass,
        getLotSplitStatusClass,
        getIQAStatusText,
        getIQARequiredClass,
        
        getExpireDateStatusText,
        getExpireDateStatusClass,
        customFilterFunction,
        confirmAddNewItem,
        Edit,
        addNewItem,
        saveLotSplit
    };
}
