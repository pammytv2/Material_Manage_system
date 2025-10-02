<script lang="ts" setup>
import { onMounted, ref, computed, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useReceiveStore } from '@/stores/receive';
import { FilterMatchMode, FilterOperator } from '@primevue/core/api';
import { filterMeta } from '@/interfaces/receive.interfaces';
import { watch } from 'vue';
import DataTable from 'primevue/datatable';
import { FilterService } from '@primevue/core/api';
import ConfirmPopup from 'primevue/confirmpopup';
import { useToast } from 'primevue/usetoast';
import { Drawer, useConfirm } from 'primevue';
import { item } from '@primeuix/themes/aura/breadcrumb';

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

const filters = ref({
    ItemNo: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
    ITEMDesc: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
    TYPE: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
    UNIT: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
    PARTCHIP: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
    VENDOR: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
    PROJECT: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
    SECTIONGROUP: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
    GROUPMAT: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
    CATEGORY: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
    SPEC: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
    Min: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] }, // ใช้ MIN
    Max: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] }, // ใช้ MAX
    Packing: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
    IQA: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
    ExpDate: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
    LotSplit: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
    Inactive: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
    Type2Name: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] } // เปลี่
});

const itemList = ref<any[]>([]);

onMounted(async () => {
    loading.value = true;
    try {
        const inactiveResult = await receiveStore.fetchItemactiveUpdate();
        console.log('fetchItemInactive result:', inactiveResult);

        console.log('Inactive items updated successfully');
        const data = await receiveStore.fetchItemList();
        itemList.value = data;

        const items = await receiveStore.fetchExamineNullItem();
        if (items && items.length > 0) {
            newItems.value = items;
            showNewItemDialog.value = true;
        }

        const iqaRaw = (await receiveStore.fetchIQA()) ?? [];
        iqaOptions.value = iqaRaw.map((item) => ({
            label: item.IQA_Name,
            value: String(item.IQA_ID)
        }));

        const lotSplitRaw = (await receiveStore.fetchLotSplit()) ?? [];
        lotSplitOptions.value = lotSplitRaw.map((item) => ({
            label: item.LotSplit_Name,
            value: String(item.LotSplit_ID)
        }));

        const expDateRaw = (await receiveStore.fetchExpData()) ?? [];
        expDateOptions.value = expDateRaw.map((item) => ({
            label: item.Exp_Name,
            value: String(item.Exp_ID)
        }));

        const zoneRaw = (await receiveStore.fetchZone()) ?? [];
        zoneOptions.value = zoneRaw.map((item) => ({
            label: item.ZoneCode,
            value: item.ZoneID
        }));

        const inactiveRaw = (await receiveStore.fetchInactiveItem()) ?? [];
        inactiveOptions.value = inactiveRaw.map((item) => ({
            label: item.Inactive_Name,
            value: item.Inactive_ID
        }));

        const type2Raw = (await receiveStore.fetchType2()) ?? [];
        type2Options.value = type2Raw.map((item) => ({
            label: item.Type2Name,
            value: Number(item.Type2ID) // ให้เป็น number
        }));

        // Provide a valid item number as argument, e.g., 'someItemN
    } finally {
        loading.value = false;
    }

    console.log();
});

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
function confirmAddNewItem(event: MouseEvent) {
    if (!validateEditMaterialForm()) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'กรุณากรอกข้อมูลให้ถูกต้อง', life: 3000 });
        return;
    }
    confirmPopup.require({
        target: event.target as HTMLElement,
        message: 'Are you sure you want to save this new item?',
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

function confirm(event) {
    console.log('🔍 confirm function called');
    confirmPopup.require({
        target: event.target,
        message: 'Are you sure you want to save the lot split data?',
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
            console.log('✅ User accepted, calling saveLotSplit');
            await saveLotSplit();
        },
        reject: () => {
            console.log('❌ User rejected');
        }
    });
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
    return 'Not Specified';
}

function getIQARequiredClass(text: string) {
    switch (text) {
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

async function handleRowClick(row: any) {
    loading.value = true;
    try {
        // ดึงข้อมูลล่าสุดจาก API ด้วย itemNo
        const item = await receiveStore.fetchItem_by_itemNo(row.ItemNo);
        console.log('Fetched item details:', item); // เพิ่ม log เพื่อตรวจสอบข้อมูลที่ได้รับ

        // ถ้า API คืนเป็น array ให้ใช้ item[0]
        selectedRow.value = Array.isArray(item) ? item[0] : (item ?? row);
        showDialog.value = true;
        showMaterialDetailsDialog.value = true;
    } finally {
        loading.value = false;
    }
}

async function Edit(row?: any) {
    if (row) {
        const itemNo = row.ItemNo || row.ITEMNO;
        const savedItem = itemList.value.find((i) => (i.ItemNo ?? i.ITEMNO ?? '').toString().trim().toUpperCase() === (itemNo ?? '').toString().trim().toUpperCase());
        // เพิ่ม log เพื่อตรวจสอบข้อมูลที่ถูก preload
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
            // ถ้า API คืนเป็น array ให้ใช้ itemData[0]
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
            UNIT: selectedRow.value.UNIT // <<-- ส่ง UNIT ด้วย
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
            Type2: selectedRow.value.Type2 !== undefined && selectedRow.value.Type2 !== null && selectedRow.value.Type2 !== '' ? Number(selectedRow.value.Type2) : oldType2Id, // ให้ใช้ค่าเดิม ถ้าไม่ได้เลือกใหม่
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

const searchQuery = ref('');

function customFilterFunction(value: any, filter: any): boolean {
    if (filter === undefined || filter === null || filter === '') {
        return true;
    }

    const filterLower = filter.toLowerCase();

    if (value === undefined || value === null || value === '') {
        return filterLower === 'n/a' || filterLower === 'na';
    }

    // ถ้าข้อมูลมีค่า ให้ค้นหาตามปกติ
    const valueLower = value.toString().toLowerCase();
    return valueLower.includes(filterLower);
}

function clearFilter() {
    filters.value = {
        ItemNo: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
        ITEMDesc: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
        TYPE: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
        UNIT: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
        PARTCHIP: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
        VENDOR: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
        PROJECT: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
        SECTIONGROUP: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
        GROUPMAT: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
        CATEGORY: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
        SPEC: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
        Min: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
        Max: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
        Packing: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
        IQA: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
        ExpDate: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
        LotSplit: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
        Inactive: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
        Type2Name: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] }
    };
}
function refreshAllPage() {
    window.location.reload();
}

function rowStyleNA(row: any) {
    const fieldsToCheck = ['Packing', 'Type2Name', 'ZoneID'];
    for (const field of fieldsToCheck) {
        if (row.hasOwnProperty(field) && (row[field] === 'undefined' || row[field] === null || row[field] === '' || row[field] === 'N/A')) {
            return { background: '#fff9c4' }; // สีเหลืองอ่อน
        }
    }
    return {};
}
</script>

<template>
    <div class="card">
        <div class="font-semibold text-xl mb-4">Manage Material</div>
    </div>
    <div class="card">
        <div class="font-semibold text-xl mb-4">Material List</div>
        <div class="flex justify-end">
            <div class="flex items-center gap-2 mr-4">
                <Checkbox v-model="showActive" :binary="true" inputId="active" />
                <label for="active">Active</label>
                <Checkbox v-model="showInactive" :binary="true" inputId="inactive" />
                <label for="inactive">Inactive</label>
            </div>
            <Button label="Refresh" icon="pi pi-refresh" @click="refreshAllPage" severity="secondary" class="mb-4 mr-2" />
            <Button label="Add New Item" icon="pi pi-plus" @click="showNewItemDialog = true" severity="primary" class="mb-4" />
        </div>
        <DataTable
            :value="filteredItemList"
            v-model:filters="filters"
            paginator
            :rows="10"
            dataKey="ReceptNumber"
            filterDisplay="menu"
            showGridlines
            rowHover
            @rowClick="(e) => handleRowClick(e.data)"
            :globalFilterFields="['ItemNo', 'ZoneID', 'Type2Name', 'ExpDate', 'Max', 'Min', 'ITEMDesc', 'TYPE', 'VENDOR', 'UNIT', 'PROJECT', 'PARTCHIP', 'GROUPMAT', 'SECTIONGROUP', 'CATEGORY', 'SPEC', 'Inactive', 'lotsplitStatus']"
            class="mb-6"
            :loading="loading"
            :rowStyle="rowStyleNA"
        >
            <template #header>
                <div class="flex justify-between">
                    <Button type="button" icon="pi pi-filter-slash" label="Clear" variant="outlined" @click="clearFilter()" />

                    <IconField>
                        <InputIcon>
                            <i class="pi pi-search" />
                        </InputIcon>
                        <InputText v-model="searchQuery" placeholder="Keyword Search" />
                    </IconField>
                </div>
            </template>

            <template #empty>No data found.</template>
            <template #loading>
                <div class="flex justify-center items-center py-8">
                    <i class="pi pi-spin pi-spinner text-2xl mr-2" />
                    กำลังโหลดข้อมูล...
                </div>
            </template>

            <Column field="ItemNo" header="Item No" sortable style="min-width: 12rem">
                <template #body="{ data }">
                    {{ data.ItemNo }}
                </template>
                <template #filter="{ filterModel }">
                    <InputText v-model="filterModel.value" type="text" placeholder="Search by Item No" />
                </template>
            </Column>

            <Column field="ITEMDesc" header="Description" sortable style="min-width: 14rem" :filterFunction="customFilterFunction">
                <template #body="{ data }">
                    {{ data.ITEMDesc }}
                </template>
                <template #filter="{ filterModel }">
                    <InputText v-model="filterModel.value" type="text" placeholder="Search by Description" />
                </template>
            </Column>

            <Column field="TYPE" header="Type" sortable style="min-width: 8rem">
                <template #body="{ data }">
                    {{ data.TYPE }}
                </template>
                <template #filter="{ filterModel }">
                    <InputText v-model="filterModel.value" type="text" placeholder="Search by Type" />
                </template>
            </Column>
            <Column field="Type2Name" header="Type2" sortable style="min-width: 8rem" :filterFunction="customFilterFunction">
                <template #body="{ data }">
                    {{ data.Type2Name ?? 'N/A' }}
                </template>
                <template #filter="{ filterModel }">
                    <InputText v-model="filterModel.value" type="text" placeholder="Search by Type2" />
                </template>
            </Column>
            <Column field="UNIT" header="Unit" sortable style="min-width: 8rem" :filterFunction="customFilterFunction">
                <template #body="{ data }">
                    {{ data.UNIT ?? 'N/A' }}
                </template>
                <template #filter="{ filterModel }">
                    <InputText v-model="filterModel.value" type="text" placeholder="Search by Unit" />
                </template>
            </Column>

            <Column field="PARTCHIP" header="Part Chip" sortable style="min-width: 8rem" :filterFunction="customFilterFunction">
                <template #body="{ data }">
                    {{ data.PARTCHIP ?? 'N/A' }}
                </template>
                <template #filter="{ filterModel }">
                    <InputText v-model="filterModel.value" type="text" placeholder="Search by Part Chip" />
                </template>
            </Column>

            <Column field="VENDOR" header="Vendor" sortable style="min-width: 10rem">
                <template #body="{ data }">
                    {{ data.VENDOR }}
                </template>
                <template #filter="{ filterModel }">
                    <InputText v-model="filterModel.value" type="text" placeholder="Search by Vendor" />
                </template>
            </Column>

            <Column field="PROJECT" header="Project" sortable style="min-width: 10rem">
                <template #body="{ data }">
                    {{ data.PROJECT }}
                </template>
                <template #filter="{ filterModel }">
                    <InputText v-model="filterModel.value" type="text" placeholder="Search by Project" />
                </template>
            </Column>

            <!-- แก้ไข Column SECTIONGROUP เพิ่ม :filterFunction -->
            <Column field="SECTIONGROUP" header="Section Group" sortable style="min-width: 10rem" :filterFunction="customFilterFunction">
                <template #body="{ data }">
                    {{ data.SECTIONGROUP ?? 'N/A' }}
                </template>
                <template #filter="{ filterModel }">
                    <InputText v-model="filterModel.value" type="text" placeholder="Search by Section Group" />
                </template>
            </Column>
            <Column field="ZoneID" header="Zone" sortable style="min-width: 8rem">
                <template #body="{ data }">
                    {{ data.ZoneCode ?? 'N/A' }}
                </template>
                <template #filter="{ filterModel }">
                    <InputText v-model="filterModel.value" type="text" placeholder="Search by Zone" />
                </template>
            </Column>

            <Column field="GROUPMAT" header="Group Mat" sortable style="min-width: 10rem" :filterFunction="customFilterFunction">
                <template #body="{ data }">
                    {{ data.GROUPMAT ?? 'N/A' }}
                </template>
                <template #filter="{ filterModel }">
                    <InputText v-model="filterModel.value" type="text" placeholder="Search by Group Mat" />
                </template>
            </Column>

            <Column field="CATEGORY" header="Category" sortable style="min-width: 10rem">
                <template #body="{ data }">
                    {{ data.CATEGORY }}
                </template>
                <template #filter="{ filterModel }">
                    <InputText v-model="filterModel.value" type="text" placeholder="Search by Category" />
                </template>
            </Column>

            <Column field="SPEC" header="Spec" sortable style="min-width: 12rem">
                <template #body="{ data }">
                    {{ data.SPEC }}
                </template>
                <template #filter="{ filterModel }">
                    <InputText v-model="filterModel.value" type="text" placeholder="Search by Spec" />
                </template>
            </Column>

            <Column field="Min" header="Min" sortable style="min-width: 4rem">
                <template #body="{ data }">
                    {{ data.Min ?? '0' }}
                </template>
                <template #filter="{ filterModel }">
                    <InputText v-model="filterModel.value" type="text" placeholder="Search by Min" />
                </template>
            </Column>

            <Column field="Max" header="Max" sortable style="min-width: 4rem">
                <template #body="{ data }">
                    {{ data.Max ?? '0' }}
                </template>
                <template #filter="{ filterModel }">
                    <InputText v-model="filterModel.value" type="text" placeholder="Search by Spec" />
                </template>
            </Column>

            <Column field="Packing" header="Packing" sortable style="min-width: 4rem" :filterFunction="customFilterFunction">
                <template #body="{ data }">
                    {{ data.Packing ?? 'N/A' }}
                </template>
                <template #filter="{ filterModel }">
                    <InputText v-model="filterModel.value" type="text" placeholder="Search by Packing" />
                </template>
            </Column>

            <Column field="IQA" header="IQA Status" sortable style="min-width: 8rem">
                <template #body="{ data }">
                    <span :class="getIQARequiredClass(getIQAStatusText(data.IQA))">
                        {{ getIQAStatusText(data.IQA) }}
                    </span>
                </template>
                <template #filter="{ filterModel }">
                    <InputText v-model="filterModel.value" type="text" placeholder="Search by IQA Status" />
                </template>
            </Column>
            <Column field="ExpDate" header="Exp Date" sortable style="min-width: 10rem">
                <template #body="{ data }">
                    <span :class="getExpireDateStatusClass(getExpireDateStatusText(data.ExpDate))">
                        {{ getExpireDateStatusText(data.ExpDate) }}
                    </span>
                </template>
                <template #filter="{ filterModel }">
                    <InputText v-model="filterModel.value" type="text" placeholder="Search by Exp Date" />
                </template>
            </Column>

            <Column field="LotSplit" header="LotSplit Status" sortable style="min-width: 10rem">
                <template #body="{ data }">
                    <span :class="getLotSplitStatusClass(getLotSplitStatusText(data.LotSplit))">
                        {{ getLotSplitStatusText(data.LotSplit) }}
                    </span>
                </template>
                <template #filter="{ filterModel }">
                    <InputText v-model="filterModel.value" type="text" placeholder="Search by LotSplit Status" />
                </template>
            </Column>

            <Column field="Inactive" header="Active" sortable style="min-width: 8rem">
                <template #body="{ data }">
                    <Tag :value="data.Inactive ? 'Inactive' : 'Active'" :severity="data.Inactive ? 'danger' : 'success'" />
                </template>
                <template #filter="{ filterModel }">
                    <InputText v-model="filterModel.value" type="text" placeholder="Search by Status" />
                </template>
            </Column>
            <Dialog v-model:visible="showMaterialDetailsDialog" modal header="Material Details" :style="{ width: '50vw' }" :dismissableMask="true">
                <div v-if="selectedRow" class="p-4 rounded-lg shadow bg-white border border-gray-200">
                    <div class="flex flex-wrap gap-6">
                        <!-- ซ้าย -->
                        <div class="flex-1 min-w-[220px] h-full">
                            <!-- ...existing fields... -->
                            <div class="mb-2 flex items-center gap-2">
                                <b>Item No:</b>
                                <span class="bg-gray-100 rounded p-2 mt-1 min-w-[40px]">{{ selectedRow?.ItemNo ?? 'N/A' }}</span>
                            </div>
                            <div class="mb-2 flex items-center gap-2">
                                <b>Description:</b>
                                <span class="bg-gray-100 rounded p-2 min-w-[40px]">{{ selectedRow?.ITEMDesc ?? 'N/A' }}</span>
                            </div>
                            <div class="mb-2 flex items-center gap-2">
                                <b>Unit:</b>                
                                <span class="bg-gray-100 rounded p-2 mt-1">{{ selectedRow?.UNIT ?? 'N/A' }}</span>
                            </div>
                            <div class="mb-2 flex items-center gap-2">
                                <b>Part Chip:</b>
                                <span class="bg-gray-100 rounded p-2 mt-1">{{ selectedRow.PARTCHIP ?? 'N/A' }}</span>
                            </div>
                            <div class="mb-2 flex items-center gap-2">
                                <b>Category:</b>
                                <span class="bg-gray-100 rounded p-2 mt-1">{{ selectedRow.CATEGORY ?? 'N/A' }}</span>
                            </div>
                            <div class="mb-2 flex items-center gap-2">
                                <b>Spec:</b>
                                <span class="bg-gray-100 rounded p-2 mt-1">{{ selectedRow?.SPEC ?? 'N/A' }}</span>
                            </div>
                            <div class="mb-2 flex items-center gap-2">
                                <b>Project:</b>
                                <span class="bg-gray-100 rounded p-2 mt-1">{{ selectedRow.PROJECT ?? 'N/A' }}</span>
                            </div>
                            <div class="mb-2 flex items-center gap-2">
                                <b>Type:</b>
                                <span class="bg-gray-100 rounded p-2 mt-1">{{ selectedRow?.TYPE ?? 'N/A' }}</span>
                            </div>
                            <div class="mb-2 flex items-center gap-2">
                                <b>Group Material:</b>
                                <span class="bg-gray-100 rounded p-2 mt-1">{{ selectedRow.GROUPMAT ?? 'N/A' }}</span>
                            </div>
                            <div class="mb-2 flex items-center gap-2">
                                <b>Section Group:</b>
                                <span class="bg-gray-100 rounded p-2 mt-1">{{ selectedRow.SECTIONGROUP ?? 'N/A' }}</span>
                            </div>
                            <div class="mb-2 flex items-center gap-2">
                                <b>Vendor:</b>
                                <span class="bg-gray-100 rounded p-2 mt-1">{{ selectedRow.VENDOR ?? 'N/A' }}</span>
                            </div>
                        </div>
                        <!-- ขวา -->
                        <div class="flex-1 min-w-[220px]">

                            <div class="mb-2">
                                <b>Type2:</b>
                                <div class="bg-gray-100 rounded p-2 mt-1">
                                    <Dropdown v-model="selectedRow.Type2" :options="type2Options" optionLabel="label" optionValue="value" placeholder="Select Type2" class="w-full min-w-[200px] max-w-[350px]">
                                        <template #option="slotProps">
                                            <span>
                                                {{ slotProps.option.label }}
                                            </span>
                                        </template>
                                        <template #value="slotProps">
                                            <span>
                                                {{ type2Options.find((opt) => opt.value === slotProps.value)?.label || selectedRow.Type2Name || 'N/A' }}
                                            </span>
                                        </template>
                                    </Dropdown>
                                    <div v-if="errors.Type2" class="text-red-500 text-xs mt-1">{{ errors.Type2 }}</div>
                                </div>
                            </div>

                            <div class="mb-2">
                                <b>Zone:</b>
                                <div class="bg-gray-100 rounded p-2 mt-1">
                                    <Dropdown v-model="selectedRow.ZoneID" :options="zoneOptions" optionLabel="label" optionValue="value" placeholder="Select Zone" class="w-full min-w-[200px] max-w-[350px]">
                                        <template #option="slotProps">
                                            <span>
                                                {{ slotProps.option.label }}
                                            </span>
                                        </template>
                                        <template #value="slotProps">
                                            <span>
                                                {{ zoneOptions.find((opt) => opt.value === slotProps.value)?.label || selectedRow.ZoneCode || 'N/A' }}
                                            </span>
                                        </template>
                                    </Dropdown>
                                    <div v-if="errors.ZoneID" class="text-red-500 text-xs mt-1">{{ errors.ZoneID }}</div>
                                </div>
                            </div>

                            <div class="mb-2">
                                <b>Lot Split Status:</b>
                                <div class="bg-gray-100 rounded p-2 mt-1">
                                    <span :class="getLotSplitStatusClass(getLotSplitStatusText(selectedRow.LotSplit))">
                                        <Dropdown v-model="selectedRow.LotSplit" :options="lotSplitOptions" optionLabel="label" optionValue="value" placeholder="Select Lot Split Status" class="w-full min-w-[200px] max-w-[350px]">
                                            <template #option="slotProps">
                                                <span :class="getLotSplitStatusClass(getLotSplitStatusText(slotProps.option.value))">
                                                    {{ getLotSplitStatusText(slotProps.option.value) }}
                                                </span>
                                            </template>
                                            <template #value="slotProps">
                                                <span :class="getLotSplitStatusClass(getLotSplitStatusText(slotProps.value))">
                                                    {{ getLotSplitStatusText(slotProps.value) }}
                                                </span>
                                            </template>
                                        </Dropdown>
                                    </span>
                                </div>
                            </div>
                            <div class="mb-2">
                                <b>IQA Status:</b>
                                <div class="bg-gray-100 rounded p-2 mt-1">
                                    <span :class="getIQARequiredClass(getIQAStatusText(selectedRow.IQA))">
                                        <Dropdown v-model="selectedRow.IQA" :options="iqaOptions" optionLabel="label" optionValue="value" placeholder="Select IQA Status" class="w-full min-w-[200px] max-w-[350px]">
                                            <template #option="slotProps">
                                                <span :class="getIQARequiredClass(getIQAStatusText(slotProps.option.value))">
                                                    {{ getIQAStatusText(slotProps.option.value) }}
                                                </span>
                                            </template>
                                            <template #value="slotProps">
                                                <span :class="getIQARequiredClass(getIQAStatusText(slotProps.value))">
                                                    {{ getIQAStatusText(slotProps.value) }}
                                                </span>
                                            </template>
                                        </Dropdown>
                                    </span>
                                </div>
                            </div>
                            <div class="mb-2">
                                <b>Exp Date Status:</b>
                                <div class="bg-gray-100 rounded p-2 mt-1">
                                    <span :class="getExpireDateStatusClass(getExpireDateStatusText(selectedRow.ExpDate))">
                                        <Dropdown v-model="selectedRow.ExpDate" :options="expDateOptions" optionLabel="label" optionValue="value" placeholder="Select Exp Date" class="w-full min-w-[200px] max-w-[350px]">
                                            <template #option="slotProps">
                                                <span :class="getExpireDateStatusClass(getExpireDateStatusText(slotProps.option.value))">
                                                    {{ getExpireDateStatusText(slotProps.option.value) }}
                                                </span>
                                            </template>
                                            <template #value="slotProps">
                                                <span :class="getExpireDateStatusClass(getExpireDateStatusText(slotProps.value))">
                                                    {{ getExpireDateStatusText(slotProps.value) }}
                                                </span>
                                            </template>
                                        </Dropdown>
                                    </span>
                                </div>
                                <div class="mb-2">
                                    <b>Active:</b>
                                    <div class="bg-gray-100 rounded p-2 mt-1">
                                        <span :class="getInactiveStatusClass(selectedRow.Inactive ? 'Inactive' : 'Active')">
                                            <Dropdown v-model="selectedRow.Inactive" :options="inactiveOptions" optionLabel="label" optionValue="value" placeholder="Select Inactive Status" class="w-full min-w-[200px] max-w-[350px]">
                                                <template #option="slotProps">
                                                    <span :class="getInactiveStatusClass(slotProps.option.value ? 'Inactive' : 'Active')">
                                                        {{ slotProps.option.value ? 'Inactive' : 'Active' }}
                                                    </span>
                                                </template>
                                                <template #value="slotProps">
                                                    <span :class="getInactiveStatusClass(slotProps.value ? 'Inactive' : 'Active')">
                                                        {{ slotProps.value ? 'Inactive' : 'Active' }}
                                                    </span>
                                                </template>
                                            </Dropdown>
                                        </span>
                                    </div>
                                </div>
                                <div class="mb-2 flex gap-4">
                                    <div class="flex-1">
                                        <b>Min:</b>
                                        <InputText v-model="selectedRow.Min" placeholder="Min" class="bg-gray-100 rounded p-2 mt-1 w-full" />
                                    </div>
                                    <div class="flex-1">
                                        <b>Max:</b>
                                        <InputText v-model="selectedRow.Max" placeholder="Max" class="bg-gray-100 rounded p-2 mt-1 w-full" />
                                    </div>
                                    <div class="flex-1">
                                        <b>Packing:</b>
                                        <InputText v-model="selectedRow.Packing" placeholder="Packing" class="bg-gray-100 rounded p-2 mt-1 w-full" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="flex justify-end gap-2 mt-6">
                        <Button label="Save" icon="pi pi-check" @click="confirm($event)" severity="success" :disabled="loading" />
                        <Button label="Cancel" icon="pi pi-times" @click="showMaterialDetailsDialog = false" severity="secondary" outlined :disabled="loading" />
                        <ConfirmPopup></ConfirmPopup>
                    </div>
                </div>
            </Dialog>

            <Dialog v-model:visible="showNewItemDialog" modal header="New Items" :style="{ width: '400px', height: '600px' }" :dismissableMask="true">
                <template v-if="newItems.length">
                    <DataTable :value="newItems" :rows="10" paginator>
                        <Column field="ITEMNO" header="Item No" />
                        <Column header="Status">
                            <template #body="{ data }">
                                <span v-if="itemList.some((item) => (item.ItemNo ?? '').toString().trim().toUpperCase() === (data.ITEMNO ?? '').toString().trim().toUpperCase())" class="text-green-600 font-semibold"> save success </span>
                                <span v-else class="text-red-600 font-semibold"> No save </span>
                            </template>
                        </Column>
                        <Column header="Actions" style="width: 100px">
                            <template #body="{ data }">
                                <div class="flex justify-end w-full">
                                    <Button label="Edit" icon="pi pi-pencil" severity="warning" @click="Edit(data)" />
                                </div>
                            </template>
                        </Column>
                    </DataTable>
                </template>
                <template v-else>
                    <div class="p-4 text-center">No new items found.</div>
                </template>
                <div class="flex justify-end mt-4">
                    <Button label="Close" icon="pi pi-times" @click="showNewItemDialog = false" severity="secondary" outlined />
                </div>
            </Dialog>

            <Dialog v-model:visible="showEditMaterialDialog" modal header="Edit Material" :style="{ width: '400px' }" :dismissableMask="true">
                <template v-if="selectedRow">
                    <form class="p-4 space-y-4">
                        <div class="flex items-center gap-2 mb-2">
                            <label class="block font-bold mb-1 min-w-[90px]">Item No:</label>
                            <InputText v-model="selectedRow.ITEMNO" placeholder="Item No" class="flex-1 max-w-[200px]" disabled />
                        </div>
                        <div class="flex items-center gap-2 mb-2">
                            <label class="block font-bold mb-1 min-w-[90px]">Unit:</label>
                            <InputText v-model="selectedRow.UNIT" placeholder="Unit Packing" class="flex-1 max-w-[200px]" disabled />
                        </div>
                        <div class="flex items-center gap-2 mb-2">
                            <label class="block font-bold mb-1 min-w-[90px]">Group Mat:</label>
                            <InputText v-model="selectedRow.GROUPMAT" placeholder="Group Mat" class="flex-1 max-w-[200px]" disabled />
                        </div>
                        <div>
                            <label class="block font-bold mb-1">Type2</label>
                            <Dropdown v-model="selectedRow.Type2" :options="type2Options" optionLabel="label" optionValue="value" placeholder="Select Type2" class="w-full" />
                            <div v-if="errors.Type2" class="text-red-500 text-xs mt-1">{{ errors.Type2 }}</div>
                        </div>
                        <div>
                            <label class="block font-bold mb-1">Zone</label>
                            <Dropdown v-model="selectedRow.ZoneID" :options="zoneOptions" optionLabel="label" optionValue="value" placeholder="Select Zone" class="w-full" />
                            <div v-if="errors.ZoneID" class="text-red-500 text-xs mt-1">{{ errors.ZoneID }}</div>
                        </div>
                        <div>
                            <label class="block font-bold mb-1">Min</label>
                            <InputText v-model="selectedRow.Min" placeholder="Min" class="w-full" />
                            <div v-if="errors.Min" class="text-red-500 text-xs mt-1">{{ errors.Min }}</div>
                        </div>
                        <div>
                            <label class="block font-bold mb-1">Max</label>
                            <InputText v-model="selectedRow.Max" placeholder="Max" class="w-full" />
                            <div v-if="errors.Max" class="text-red-500 text-xs mt-1">{{ errors.Max }}</div>
                        </div>
                        <div>
                            <label class="block font-bold mb-1">Packing</label>
                            <InputText v-model="selectedRow.Packing" placeholder="Packing" class="w-full" />
                            <div v-if="errors.Packing" class="text-red-500 text-xs mt-1">{{ errors.Packing }}</div>
                        </div>

                        <div>
                            <label class="block font-bold mb-1">Lot Split</label>
                            <Dropdown v-model="selectedRow.LotSplit" :options="lotSplitOptions" optionLabel="label" optionValue="value" placeholder="Select Lot Split" class="w-full" />
                            <div v-if="errors.LotSplit" class="text-red-500 text-xs mt-1">{{ errors.LotSplit }}</div>
                        </div>
                        <div>
                            <label class="block font-bold mb-1">IQA</label>
                            <Dropdown v-model="selectedRow.IQA" :options="iqaOptions" optionLabel="label" optionValue="value" placeholder="Select IQA" class="w-full" />
                            <div v-if="errors.IQA" class="text-red-500 text-xs mt-1">{{ errors.IQA }}</div>
                        </div>
                        <div>
                            <label class="block font-bold mb-1">Exp Date</label>
                            <Dropdown v-model="selectedRow.ExpDate" :options="expDateOptions" optionLabel="label" optionValue="value" placeholder="Select Exp Date" class="w-full" />
                        </div>
                    </form>
                </template>
                <template #footer>
                    <div class="flex justify-end gap-2 mt-6">
                        <Button label="Save" icon="pi pi-check" @click="confirmAddNewItem($event)" severity="success" :disabled="loading" />
                        <Button label="Cancel" icon="pi pi-times" @click="showEditMaterialDialog = false" severity="secondary" outlined :disabled="loading" />
                        <ConfirmPopup></ConfirmPopup>
                    </div>
                </template>
            </Dialog>
        </DataTable>
    </div>
</template>
