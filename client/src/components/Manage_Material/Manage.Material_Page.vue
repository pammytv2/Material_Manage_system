<script lang="ts" setup>
import { onMounted, ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useReceiveStore } from '@/stores/receive';
import { useManageMaterialStore } from '@/stores/manage_material';
import { FilterMatchMode, FilterOperator } from '@primevue/core/api';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Dialog from 'primevue/dialog';
import Dropdown from 'primevue/dropdown';
import Checkbox from 'primevue/checkbox';
import Tag from 'primevue/tag';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import ConfirmPopup from 'primevue/confirmpopup';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';

// Initialize stores and utilities
const receiveStore = useReceiveStore();
const manageMaterialStore = useManageMaterialStore();
const router = useRouter();
const confirm = useConfirm();

// Destructure from the store
const {
    loading,
    showActive,
    showInactive,
    errors,
    showNewItemDialog,
    newItems,
    showDialog,
    selectedRow,
    showMaterialDetailsDialog,
    showEditMaterialDialog,
    searchQuery,
    itemList,
    type2Options,
    inactiveOptions,
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
} = manageMaterialStore;



// Filter metadata
const filters = ref({
    global: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
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
    Type2Name: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
    ZoneID: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
    lotsplitStatus: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
    ZoneCode: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] }
});


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

function confirmSave(event) {
    confirm.require({
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
            await saveLotSplit();
        }
    });
}

function clearFilter() {
    filters.value = {
        global: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
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
        Type2Name: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
        ZoneID: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
        lotsplitStatus: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
        ZoneCode: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] }
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
     <div v-if="loading" class="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50" style="backdrop-filter: blur(2px); z-index: 1000">
            <div class="flex flex-col items-center">
                <i class="pi pi-spin pi-spinner text-4xl text-white mb-4" />
                <span class="text-white text-xl">กำลังโหลดข้อมูล...</span>
            </div>
        </div>
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
            <Button label="Add New Material" icon="pi pi-plus" @click="showNewItemDialog = true" severity="primary" class="mb-4" />
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
            :globalFilterFields="['ItemNo', 'ZoneCode', 'Type2Name', 'ExpDate', 'Max', 'Min', 'ITEMDesc', 'TYPE', 'VENDOR', 'UNIT', 'PROJECT', 'PARTCHIP', 'GROUPMAT', 'SECTIONGROUP', 'CATEGORY', 'SPEC', 'Inactive', 'lotsplitStatus']"
            class="mb-6"
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
            <Column :field="(data: any) => data.Type2Name ?? 'N/A'" header="Type2" sortable style="min-width: 8rem" />
                <Column :field="(data: any) => data.UNIT ?? 'N/A'" header="Unit" sortable style="min-width: 8rem" />
           
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
            <Column field="ZoneCode" header="Zone" sortable style="min-width: 8rem" :filterFunction="customFilterFunction">
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
                        <Button label="Save" icon="pi pi-check" @click="confirmSave($event)" severity="success" :disabled="loading" />
                        <Button label="Cancel" icon="pi pi-times" @click="showMaterialDetailsDialog = false" severity="secondary" outlined :disabled="loading" />
                        <ConfirmPopup></ConfirmPopup>
                    </div>
                </div>
            </Dialog>

            <Dialog v-model:visible="showNewItemDialog" modal header="New Material" :style="{ width: '400px', height: '600px' }" :dismissableMask="true">
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
