<script lang="ts" setup>
import { onMounted, ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import Dialog from 'primevue/dialog';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import ConfirmDialog from 'primevue/confirmdialog';
import { useManageMaterialStore } from '@/stores/manage_material';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import Dropdown from 'primevue/dropdown';
import { FilterMatchMode, FilterOperator } from '@primevue/core/api';
import { filterMeta } from '@/interfaces/receive.interfaces';
import { useIqaCheckMaterialStore } from '@/stores/iqa_check_material';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import { getIqaApprovalClass, getIqaResultClass, getIqaResultClassD, getIQAStatusTextD } from '@/stores/recive_material';
import { label } from '@primeuix/themes/aura/metergroup';
import type { IViewEmployee } from '@/shared/interfaces/template-web-stack-2025/employee.interface';
import { useMainStore } from '@/stores/main.store';
import { watch } from 'vue';
import tooltip from 'primevue/tooltip';
import { icon } from '@primeuix/themes/aura/avatar';
import { isVisible } from '@primevue/core';
import { s } from 'node_modules/vite/dist/node/types.d-aGj9QkWt';
const manageMaterialStore = useManageMaterialStore();
const { getIQAStatusText } = manageMaterialStore;
const confirm = useConfirm();
const showTopDrawer = ref(false);
const drawerData = ref<any>(null);
const mainStore = useMainStore();
const toast = useToast();
const showAbnormalDrawer = ref(false);
const loading = ref(false);
const searchQuery = ref('');
const selectedReceipt = ref<any>({});
const statusFilter = ref<string[]>(['ALL']);

const statusOptions = [
    { label: 'All', value: 'ALL', color: '#64748b', class: 'text-slate-500' },
    { label: 'Not Add Abnormal', value: '', color: '#2563eb', class: 'text-blue-500' },
    { label: 'Add Abnormal', value: 'PASS', color: '#22c55e', class: 'text-green-500' },
    { label: 'Rework', value: 'REWORK', color: '#fbbf24', class: 'text-amber-500' },
    { label: 'Reject', value: 'REJECT', color: '#ef4444', class: 'text-red-500' }
];

const iqaCheckMaterialStore = useIqaCheckMaterialStore();

onMounted(async () => {
    loading.value = true;
    await iqaCheckMaterialStore.iqa_view_item_normal();
    loading.value = false;
});

const filteredList = computed(() => {
    let list = iqaCheckMaterialStore._iqaViewNormal || [];
    // Filter by status
    if (!statusFilter.value.includes('ALL')) {
        list = list.filter((item) => {
            // Not Add Abnormal: Abnormal ยังไม่มีค่า
            if (statusFilter.value.includes('')) {
                if (!item.Abnormal_Number || item.Abnormal_Number === '') return true;
            }
            // Add Abnormal: Abnormal มีค่าแล้ว
            if (statusFilter.value.includes('PASS')) {
                if (item.Abnormal_Number && item.Abnormal_Number !== '') return true;
            }
            // Rework, Reject ตามเดิม
            if (statusFilter.value.includes('REWORK')) {
                if (item.status_Inspec === 'REWORK') return true;
            }
            if (statusFilter.value.includes('REJECT')) {
                if (item.status_Inspec === 'REJECT') return true;
            }
            return false;
        });
    }
    // Filter by search
    if (searchQuery.value && searchQuery.value.trim()) {
        const query = searchQuery.value.trim().toLowerCase();
        list = list.filter((item) => (item.InvoiceNumber || '').toLowerCase().includes(query) || (item.lot_no || '').toLowerCase().includes(query));
    }
    return list;
});

const filters = ref({
    global: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
    ReceiveNo: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
    InvoiceNumber: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
    VendorCode: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
    VendorName: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
    Status: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
    lot_count: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] }
});
function clearFilter() {
    filters.value = {
        global: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
        ReceiveNo: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
        InvoiceNumber: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
        VendorCode: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
        VendorName: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
        Status: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
        lot_count: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] }
    };
}

function formatAbnormalNumber(value: string): string {
    let raw = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    let parts = [raw.slice(0, 2), raw.slice(2, 4), raw.slice(4, 6), raw.slice(6, 11)];
    let formatted = parts.filter(Boolean).join('-');
    return formatted.slice(0, 14);
}

watch(
    () => drawerData.value?.remark_inspec,
    (val) => {
        if (val == null) return;
        const formatted = formatAbnormalNumber(val);
        drawerData.value.remark_inspec = formatted;
    }
);
function openTopDrawer(data: any) {
    drawerData.value = data;
    showTopDrawer.value = true;
}

function openAbnormalDrawer(data: any) {
    drawerData.value = data;
    showAbnormalDrawer.value = true;
}

function closeTopDrawer() {
    showTopDrawer.value = false;
    drawerData.value = null;
}
function rowClass(data: any) {
    if (data.Abnormal_Number === '' || data.Abnormal_Number == null || data.Abnormal_Number === 'N/A') {
        return 'highlight-yellow-row';
    }
    return '';
}

function handleSaveAbnormal() {
    if (!drawerData.value) return;
    if (!drawerData.value.remark_inspec || drawerData.value.remark_inspec.length !== 14) {
        toast.add({ severity: 'warn', summary: 'Warning', detail: 'Please enter a valid Abnormal Number (14 characters)', life: 2000 });
        loading.value = false;
        return;
    }
    const abnormalNumber = drawerData.value.remark_inspec;
    const { lot_no, InvoiceNumber, ITEMNO } = drawerData.value;
    loading.value = true;
    const reloadTable = async () => {
        await iqaCheckMaterialStore.iqa_view_item_normal();
    };
    if (drawerData.value.applyAllLot) {
        // All Lot
        iqaCheckMaterialStore
            .iqa_add_abnormal_number_all({
                invoiceNumber: InvoiceNumber,
                ITEMNO: ITEMNO,
                Abnormal_Number: abnormalNumber,
                abnormal_user: (mainStore._userInfo as IViewEmployee).thai_name
            })
            .then(async () => {
                console.log('iqa_add_abnormal_number_all:', ITEMNO);
                toast.add({ severity: 'success', summary: 'Success', detail: 'Abnormal number added for all lots', life: 2000 });
                showAbnormalDrawer.value = false;
                await reloadTable();
            })
            .finally(() => {
                loading.value = false;
            });
    } else if (drawerData.value.applyOnlyThisLot) {
        // Only this lot
        iqaCheckMaterialStore
            .iqa_add_abnormal_number({
                lotNo: lot_no,
                invoiceNumber: InvoiceNumber,
                ITEMNO: ITEMNO,
                Abnormal_Number: abnormalNumber,
                abnormal_user: (mainStore._userInfo as IViewEmployee).thai_name
            })
            .then(async () => {
                console.log('abnormal_user:', (mainStore._userInfo as IViewEmployee).thai_name);

                toast.add({ severity: 'success', summary: 'Success', detail: 'Abnormal number added for this lot', life: 2000 });
                showAbnormalDrawer.value = false;
                await reloadTable();
            })
            .finally(() => {
                loading.value = false;
            });
    } else {
        toast.add({ severity: 'warn', summary: 'Warning', detail: 'Please select lot option', life: 2000 });
        loading.value = false;
    }
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
        <div class="font-semibold text-xl mb-4">IQA Abnormal Material</div>
        <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-4">
                <!-- เปลี่ยนเป็น Checkbox หลายตัว -->
                <div class="flex gap-6">
                    <div v-for="option in statusOptions" :key="option.value" class="flex items-center">
                        <Checkbox
                            :inputId="'status-' + option.value"
                            :value="option.value"
                            v-model="statusFilter"
                            :binary="false"
                            :checked="statusFilter.includes(option.value)"
                            @change="
                                () => {
                                    if (option.value === 'ALL') {
                                        statusFilter.splice(0, statusFilter.length, 'ALL');
                                    } else {
                                        const idx = statusFilter.indexOf('ALL');
                                        if (idx !== -1) statusFilter.splice(idx, 1);
                                        if (statusFilter.length === 0) statusFilter.push('ALL');
                                    }
                                }
                            "
                        />
                        <label :for="'status-' + option.value" class="ml-1" :class="option.class">
                            {{ option.label }}
                        </label>
                    </div>
                </div>
            </div>
            <div class="text-right">
                <div class="text-sm text-gray-600 mb-1">Total Items</div>
                <div class="text-2xl font-bold text-blue-600">{{ filteredList.length }}</div>
            </div>
        </div>
    </div>
    <div class="card">
        <div class="font-semibold text-xl mb-4">IQA Abnormal Material List</div>
        <DataTable
            :value="filteredList"
            v-model:filters="filters"
            paginator
            :rows="10"
            filterDisplay="menu"
            showGridlines
            rowHover
            :globalFilter="searchQuery"
            :globalFilterFields="['ReceiveNo', 'InvoiceNumber', 'Status', 'VendorCode', 'VendorName', 'lot_no']"
            class="mb-6"
            :rowClass="rowClass"
        >
            <template #header>
                <div class="flex justify-between items-center">
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
            <Column field="lot_no" header="Lot No" sortable>
                <template #body="{ data }">
                    <span>{{ data.lot_no || 'N/A' }}</span>
                </template>
            </Column>
            <Column field="ITEMNO" header="Item No" sortable>
                <template #body="{ data }">
                    <span>{{ data.ITEMNO || 'N/A' }}</span>
                </template>
            </Column>
            <Column field="InvoiceNumber" header="Invoice Number" sortable>
                <template #body="{ data }">
                    <span>{{ data.InvoiceNumber || 'N/A' }}</span>
                </template>
            </Column>
            <Column field="inspec_date" header="Recheck Date" sortable>
                <template #body="{ data }">
                    <span>
                        {{ data.inspec_date ? new Date(data.inspec_date).toISOString().slice(0, 10) : 'N/A' }}
                    </span>
                </template>
            </Column>
            <Column field="ReciveDate" header="Receipt Date" sortable>
                <template #body="{ data }">
                    <span>{{ data.ReciveDate || 'N/A' }}</span>
                </template>
            </Column>
            <Column field="VendorName" header="Vendor Name" sortable>
                <template #body="{ data }">
                    <span>{{ data.VendorName || 'N/A' }}</span>
                </template>
            </Column>
            <Column field="lot_qty" header="Lot Qty" sortable>
                <template #body="{ data }">
                    <span>{{ data.lot_qty || 'N/A' }}</span>
                </template>
            </Column>
            <Column field="status_Inspec" header="StatusInspec" sortable>
                <template #body="{ data }">
                    <span :class="getIqaResultClass(getIQAStatusText(data.status_Inspec))">
                        {{ data.status_Inspec }}
                    </span>
                </template>
            </Column>
            <Column field="Abnormal" header="Abnormal Number" sortable>
                <template #body="{ data }">
                    <span>{{ data.Abnormal_Number }}</span>
                </template>
            </Column>
            <Column header="Action">
                <template #body="{ data }">
                    <div class="flex items-center gap-2" style="font-size: 0.95rem">
                        <Button icon="pi pi-eye" @click="openTopDrawer(data)" v-tooltip.bottom="'View User Check'" />
                        <Button icon="pi pi-pencil" @click="openAbnormalDrawer(data)" v-tooltip.bottom="'Edit Add Abnormal'" />
                    </div>
                </template>
            </Column>
        </DataTable>
    </div>
    <Dialog v-model:visible="showTopDrawer" :modal="true" :closable="true" position="right" style="width: 400px; max-width: 90vw" :dismissableMask="true" :header="'Inspector Records'" @hide="closeTopDrawer">
        <div v-if="drawerData">
            <div><strong>Inspector user:</strong> {{ drawerData.abnormal_user || 'N/A' }}</div>
        </div>
    </Dialog>
    <Dialog v-model:visible="showAbnormalDrawer" :modal="true" :closable="true" position="right" style="width: 400px; max-width: 90vw" :dismissableMask="true" :header="'Inspector Records'">
        <template #header>
            <span class="font-semibold">Select Lot</span>
        </template>
        <div v-if="drawerData">
            <div class="mb-4">
                <div class="flex items-center gap-4 mb-2">
                    <Checkbox
                        inputId="drawer-all-lot"
                        v-model="drawerData.applyAllLot"
                        :binary="true"
                        @change="
                            drawerData.applyAllLot = true;
                            drawerData.applyOnlyThisLot = false;
                        "
                    />
                    <label for="drawer-all-lot" class="font-medium">All Lot</label>
                    <Checkbox
                        inputId="drawer-only-lot"
                        v-model="drawerData.applyOnlyThisLot"
                        :binary="true"
                        @change="
                            drawerData.applyOnlyThisLot = true;
                            drawerData.applyAllLot = false;
                        "
                    />
                    <label for="drawer-only-lot" class="font-medium">Only this lot </label>
                </div>
                <label class="block mb-2 font-medium" for="remark-inspec">Abnormal Number:</label>
                <InputText
                    v-model="drawerData.remark_inspec"
                    maxlength="14"
                    placeholder="Enter Abnormal Number"
                    class="w-full"
                    :class="{
                        'p-invalid': drawerData?.remark_inspec?.length !== 14
                    }"
                />
            </div>
            <div class="flex justify-end gap-2">
                <Button label="Cancel" severity="secondary" @click="showAbnormalDrawer = false" />
                <Button
                    label="Save"
                    icon="pi pi-check"
                    @click="handleSaveAbnormal"
                    :disabled="!drawerData?.remark_inspec || drawerData?.remark_inspec?.length !== 14"
                />
            </div>
            <ConfirmPopup />
        </div>
    </Dialog>
</template>

<style scoped>
:deep(.highlight-yellow-row) {
    background-color: #f7f1c6 !important;
}
:deep(.highlight-yellow-row:hover) {
    background-color: #f5ebbc !important;
}
:deep(.highlight-yellow-row td) {
    background-color: #fcf1a2 !important;
}
:deep(.highlight-yellow-row:hover td) {
    background-color: #f3e390 !important;
}
</style>
