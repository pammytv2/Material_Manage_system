<script lang="ts" setup>
import { onMounted, ref, computed, reactive } from 'vue';
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
import { icon } from '@primeuix/themes/aura/avatar';
const confirm = useConfirm();
const mainStore = useMainStore();
const toast = useToast();
const loading = ref(false);
const searchQuery = ref('');
const selectedReceipt = ref<any>({});
const statusFilter = ref<string[]>(['ALL']); // เปลี่ยนเป็น array สำหรับหลายค่า

const statusOptions = [
    { label: 'All', value: 'ALL', color: '#64748b', class: 'text-slate-500' },
    { label: 'Under Review', value: '', color: '#2563eb', class: 'text-blue-500' },
    { label: 'PASS', value: 'PASS', color: '#22c55e', class: 'text-green-500' },
    { label: 'Rework', value: 'REWORK', color: '#fbbf24', class: 'text-amber-500' },
    { label: 'Reject', value: 'REJECT', color: '#ef4444', class: 'text-red-500' }
];

const iqaCheckMaterialStore = useIqaCheckMaterialStore();
const manageMaterialStore = useManageMaterialStore();

const { getIQAStatusText } = manageMaterialStore;

async function onIqaStatusChangeDropdown(lot: any) {
    // Add null check for selectedReceipt.value
    if (!selectedReceipt.value) {
        toast.add({ severity: 'warn', summary: 'Warning', detail: 'กรุณาเลือกเอกสารก่อน', life: 2000 });
        return;
    }

    selectedReceipt.value = lot;
    console.log('selectedReceipt:', selectedReceipt.value);
    if (!lot.selectedIqaStatus || lot.selectedIqaStatus === 'UNDER_REVIEW') {
        toast.add({ severity: 'warn', summary: 'Warning', detail: 'กรุณาเลือก IQA Check ก่อนบันทึก', life: 2000 });
        return;
    }


    if ((lot.selectedIqaStatus === 'REWORK' || lot.selectedIqaStatus === 'REJECT') && (!lot.remark_iqa || lot.remark_iqa.trim() === '')) {
        toast.add({ severity: 'warn', summary: 'Warning', detail: 'กรุณากรอก remark เมื่อเลือก REWORK หรือ REJECT', life: 2000 });
        lot.isEditing = true; 
        return;
    }
    loading.value = true;
    try {
        await iqaCheckMaterialStore.submitIqaCheck({
            invoiceNumber: selectedReceipt.value.InvoiceNumber,
            ReceiveNo: selectedReceipt.value.ReceiveNo,
            lotNo: lot.lot_no,
            status: lot.selectedIqaStatus,
            remark_iqa: lot.remark_iqa || '',
            lot_user: (mainStore._userInfo as IViewEmployee).thai_name
        });
        lot.IQA_Status = lot.selectedIqaStatus;
        await iqaCheckMaterialStore.addItemListTransaction_MC_PROD();
        toast.add({ severity: 'success', summary: 'Success', detail: 'Status saved successfully', life: 2000 });

        await iqaCheckMaterialStore.itemLotSplit(selectedReceipt.value.InvoiceNumber);
        iqaCheckMaterialStore._itemLotSplits.forEach((lot: any) => {
            lot.selectedIqaStatus = lot.status || null;
        });
        // await iqaCheckMaterialStore.fetchIqaCheckMaterialItems();
    } catch (error) {
        console.error('IQA Error:', error);
        toast.add({ severity: 'error', summary: 'Error', detail: 'An error occurred', life: 2000 });
    } finally {
        loading.value = false;
    }
}
const filteredReceiveList = computed(() => {
    let list = iqaCheckMaterialStore.filteredReceiveList;
    // Apply search query filter (search all fields)
    if (searchQuery.value && searchQuery.value.trim()) {
        const query = searchQuery.value.trim().toLowerCase();
        list = list.filter((item) => {
            return Object.values(item).some(val =>
                (val !== null && val !== undefined) &&
                String(val).toLowerCase().includes(query)
            );
        });
    }
    // Filter by status (multi-select)
    if (!statusFilter.value.includes('ALL')) {
        list = list.filter((item) => statusFilter.value.includes((item.IQA_Status || item.status || '').toUpperCase()));
    }
    return list;
});

onMounted(async () => {
    iqaCheckMaterialStore.selectedStatus = '';
    await iqaCheckMaterialStore.fetchIqaCheckMaterialItems();
    console.log('IQA Items:', iqaCheckMaterialStore.IqaCheckMaterialItems);
    iqaCheckMaterialStore.filteredReceiveList.forEach((item: any) => {
        item.selectedIqaStatus = item.IQA_Status || item.status || null;
        item.isEditing = !item.selectedIqaStatus; // ถ้ายังไม่เคยเลือก ให้แก้ไขได้
    });
    await iqaCheckMaterialStore.status_iqa_check();
    console.log('IQA Status Items2:', iqaCheckMaterialStore._iqaStatus);
});



const filters = ref({
    global: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
    ReceiveNo: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
    InvoiceNumber: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
    VendorCode: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
    VendorName: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
    Status: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
    lot_count: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
    lot_no: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
    CN: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
    qty_date: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
    ReciveDate: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
    lot_qty: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
    RecheckDate: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
    remark_iqa: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] }
});

function clearFilter() {
    filters.value = {
    global: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
    ReceiveNo: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
    InvoiceNumber: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
    VendorCode: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
    VendorName: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
    Status: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
    lot_count: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
    lot_no: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
    CN: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
    qty_date: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
    RecheckDate: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
    ReciveDate: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
    lot_qty: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
    remark_iqa: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] }
    };
}

const showInspectorDialog = ref(false);
const inspectorDialogData = ref<any>(null);

function openTopDrawer(data: any) {
    inspectorDialogData.value = data;
    showInspectorDialog.value = true;
}

function closeTopDrawer() {
    showInspectorDialog.value = false;
    inspectorDialogData.value = null;
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
        <div class="font-semibold text-xl mb-4">IQA Receive Material</div>
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
                                    // ถ้าเลือก ALL ให้ล้างตัวอื่น, ถ้าเลือกตัวอื่นให้เอา ALL ออก
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
                <div class="text-2xl font-bold text-blue-600">
                    {{ filteredReceiveList.length }}
                </div>
            </div>
        </div>
    </div>
    <div class="card">
        <div class="font-semibold text-xl mb-4">IQA Receive Material List</div>
        <DataTable
            :value="filteredReceiveList"
            v-model:filters="filters"
            paginator
            :rows="10"
            filterDisplay="menu"
            showGridlines
            rowHover
            :globalFilter="searchQuery"
            :globalFilterFields="[
                'ReceiveNo',
                'InvoiceNumber',
                'Status',
                'VendorCode',
                'VendorName',
                'lot_count',
                'lot_no',
                'ITEMNO',
                'qty_date',
                'ReciveDate',
                'RecheckDate',
                'lot_qty',
                'remark_iqa',
                'IQA_Status'
            ]"
            class="mb-6"
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
            <Column field="lot_no" header="Lot No" sortable />
            <Column field="ITEMNO" header="Item No" sortable />
            <Column field="ReceiveNo" header="Receive No" sortable />
            <Column field="InvoiceNumber" header="Invoice Number" sortable />
            <Column field="qty_date" header="Recheck Date" sortable>
                <template #body="{ data }">
                    <span>{{ data.qty_date ? new Date(data.qty_date).toISOString().slice(0, 10) : 'N/A' }}</span>
                </template>
            </Column>
            <Column field="ReciveDate" header="Receipt Date" sortable />
            <Column field="VendorName" header="Vendor Name" sortable />
            <Column field="lot_qty" header="Lot Qty" sortable />
            <Column field="IQA_Status" sortField="IQA_Status" header="StatusQty" sortable>
                <template #body="{ data }">
                    <Dropdown v-model="data.selectedIqaStatus" :options="iqaCheckMaterialStore.iqaCheckOptions" :disabled="!data.isEditing" optionLabel="label" optionValue="value" placeholder="Select Status" class="w-50">
                        <template #option="slotProps">
                            <span :class="getIqaResultClass(getIQAStatusText(slotProps.option.value))">
                                {{ getIQAStatusText(slotProps.option.value) }}
                            </span>
                        </template>
                        <template #value="slotProps">
                            <span :class="getIqaResultClass(getIQAStatusText(slotProps.value))">
                                {{ getIQAStatusText(slotProps.value) }}
                            </span>
                        </template>
                    </Dropdown>
                </template>
            </Column>
            <Column field="remark_iqa" header="Remark Qty" sortable>
                <template #body="{ data }">
                    <InputText v-model="data.remark_iqa" placeholder=" remark " class="w-full" :disabled="!data.isEditing" />
                </template>
            </Column>
            <Column header="Action">
                <template #body="{ data }">
                    <div class="flex items-center gap-3" style="font-size: 0.95rem;">
                        <SplitButton
                            :label="data.isEditing ? 'Save' : 'Edit'"
                            :icon="data.isEditing ? 'pi pi-check' : 'pi pi-pencil'"
                            :model="[
                                {
                                    label: data.isEditing ? 'Save' : 'Edit',
                                    icon: data.isEditing ? 'pi pi-check' : 'pi pi-pencil',
                                    
                                    command: () => {
                                        if (!data.isEditing) {
                                            data.isEditing = true;
                                        } else {
                                            selectedReceipt.value = data;
                                            onIqaStatusChangeDropdown(data);
                                            if (!((data.selectedIqaStatus === 'REWORK' || data.selectedIqaStatus === 'REJECT') && (!data.remark_iqa || data.remark_iqa.trim() === ''))) {
                                                data.isEditing = false;
                                            }
                                        }
                                    }
                                }
                            ]"
                            @click="
                                () => {
                                    if (data.isEditing) {
                                        selectedReceipt.value = data;
                                        onIqaStatusChangeDropdown(data);
                                        if (!((data.selectedIqaStatus === 'REWORK' || data.selectedIqaStatus === 'REJECT') && (!data.remark_iqa || data.remark_iqa.trim() === ''))) {
                                            data.isEditing = false;
                                        }
                                    } else {
                                        data.isEditing = true;
                                    }
                                }
                            "
                            v-tooltip.bottom="data.isEditing ? 'Save status' : 'Edit status'"
                        />
                        <Button  icon="pi pi-eye" v-tooltip.bottom="'View User Check'"  @click="openTopDrawer(data)">
                            
                        </Button>
                    </div>
                </template>
            </Column>
        </DataTable>
    </div>
    <Dialog
        v-model:visible="showInspectorDialog"
        :modal="true"
        :closable="true"
        :dismissableMask="true"
        position="right"
        style="width: 400px; max-width: 90vw;"
        :header="'Inspector Records'"
    >
        <div v-if="inspectorDialogData">
            <div><strong>Inspector:</strong> {{ inspectorDialogData.lot_user || 'N/A' }}</div>
            <!-- Add more fields as needed -->
        </div>
    </Dialog>
</template>
