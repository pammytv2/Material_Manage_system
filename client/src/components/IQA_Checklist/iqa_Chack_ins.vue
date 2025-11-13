<script lang="ts" setup>
import { onMounted, ref, computed } from 'vue';
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
import { useIqaCheckMaterialStore } from '@/stores/iqa_check_material';
import { watch } from 'vue';
import Sidebar from 'primevue/sidebar';
import ConfirmPopup from 'primevue/confirmpopup';
import { useToast } from 'primevue/usetoast';
import { getIqaResultClass } from '@/stores/recive_material';
import { label } from '@primeuix/themes/aura/metergroup';
import { useConfirm } from 'primevue/useconfirm';
import { event } from '@primeuix/themes/aura/timeline';
import type { IViewEmployee } from '@/shared/interfaces/template-web-stack-2025/employee.interface';
import { useMainStore } from '@/stores/main.store';
import { c } from 'node_modules/vite/dist/node/types.d-aGj9QkWt';

const mainStore = useMainStore();
const confirm = useConfirm(); // <-- ใช้ตัวนี้
const confirmPopup = ref();
const toast = useToast();
const showDrawer = ref(false);
const drawerData = ref<any>(null);
const loading = ref(false);
const searchQuery = ref('');
const statusFilter = ref<string[]>(['ALL']);
const selectedReceipt = ref<any>({});
const iqaCheckMaterialStore = useIqaCheckMaterialStore();
const manageMaterialStore = useManageMaterialStore();
const { getIQAStatusText } = manageMaterialStore;
const showTopDrawer = ref(false);
// const drawerData = ref<any>(null);

function openTopDrawer(data: any) {
    drawerData.value = data;
    showTopDrawer.value = true;
}

function closeTopDrawer() {
    showTopDrawer.value = false;
    drawerData.value = null;
}
const statusOptions = [
    { label: 'All', value: 'ALL', color: '#64748b', class: 'text-slate-500' },
    { label: 'Under Review', value: '', color: '#2563eb', class: 'text-blue-500' },
    { label: 'PASS', value: 'PASS', color: '#22c55e', class: 'text-green-500' },
    { label: 'Rework', value: 'REWORK', color: '#fbbf24', class: 'text-amber-500' },
    { label: 'Reject', value: 'REJECT', color: '#ef4444', class: 'text-red-500' }
];
function confirmSavePopup(event: Event, data: any) {
    confirm.require({
        target: event.currentTarget as HTMLElement,
        message: 'Are you sure you want to save this status?',
        icon: 'pi pi-exclamation-triangle',
        rejectProps: {
            label: 'Cancel',
            severity: 'secondary',
            outlined: true
        },
        acceptProps: {
            label: 'Save',
            severity: 'success'
        },
        accept: () => {
            selectedReceipt.value = data;
            
            saveDrawerRemark();
            
        },
        reject: () => {
            toast.add({ severity: 'info', summary: 'Cancelled', detail: 'Operation cancelled', life: 2000 });
        }
    });
}
async function onIqaStatusChangeDropdown(lot: any) {
    selectedReceipt.value = lot;
    // ถ้าเลือก REWORK หรือ REJECT ให้เปิด Drawer
    if (lot.selectedIqaStatusins === 'PASS' || lot.selectedIqaStatusins === 'REWORK' || lot.selectedIqaStatusins === 'REJECT') {
        drawerData.value = lot;
        // กำหนดค่า default สำหรับ Drawer
        if (drawerData.value.applyAllLot === undefined) drawerData.value.applyAllLot = false;
        if (drawerData.value.applyOnlyThisLot === undefined) drawerData.value.applyOnlyThisLot = true;
        showDrawer.value = true;
        return;
    }
    if (!lot.selectedIqaStatusins || lot.selectedIqaStatusins === 'UNDER_REVIEW') {
        toast.add({ severity: 'warn', summary: 'Warning', detail: 'กรุณาเลือก IQA Check ก่อนบันทึก', life: 2000 });
        return;
    }

    if ((lot.selectedIqaStatusins === 'REWORK' || lot.selectedIqaStatusins === 'REJECT') && !lot.remark_inspec) {
        toast.add({ severity: 'warn', summary: 'Warning', detail: 'กรุณากรอก remark เมื่อเลือก REWORK หรือ REJECT', life: 2000 });
        return;
    }
    if ((lot.selectedIqaStatusins === 'REWORK' || lot.selectedIqaStatusins === 'REJECT') && (!lot.remark_inspec || lot.remark_inspec.trim() === '')) {
        toast.add({ severity: 'warn', summary: 'Warning', detail: 'กรุณากรอก remark เมื่อเลือก REWORK หรือ REJECT', life: 2000 });
        lot.isEditing = true; // ไม่ปิดการแก้ไข
        return;
    }
    loading.value = true;
    try {
        // Only this lot
        await iqaCheckMaterialStore.iqa_check_Inspec({
            invoiceNumber: selectedReceipt.value.InvoiceNumber,
            ReceiveNo: selectedReceipt.value.ReceiveNo,
            lotNo: lot.lot_no,
            abnormally_number: lot.abnormally_number || '',
            status_Inspec: lot.selectedIqaStatusins,
            remark_inspec: lot.remark_inspec || '',
            inspec_user:(mainStore._userInfo as IViewEmployee).thai_name,
            lot_no_check: 1
        });

        console.log('Selected Invoice   :', selectedReceipt.value.InvoiceNumber);
        lot.IQA_Status = lot.selectedIqaStatusins;
        await iqaCheckMaterialStore.addItemListTransaction_MC_PROD();
        toast.add({ severity: 'success', summary: 'Success', detail: 'Status saved successfully', life: 2000 });

        await iqaCheckMaterialStore.itemLotSplit(selectedReceipt.value.InvoiceNumber);
        iqaCheckMaterialStore._itemLotSplits.forEach((l: any) => {
            l.selectedIqaStatusins = l.status || null;
        });
         lot.isEditing = false;
         await iqaCheckMaterialStore.fetchIqaCheckMaterialItems_inspec();
    } catch (error) {
        console.log('Error saving IQA status:', error);
        toast.add({ severity: 'error', summary: 'Error', detail: 'An error occurred', life: 2000 });
    } finally {
        loading.value = false;
    }
}

// ฟังก์ชันสำหรับบันทึก remark จาก Drawer
async function saveDrawerRemark() {
    try {
        if (drawerData.value.selectedIqaStatusins !== 'PASS' && (!drawerData.value.remark_inspec || drawerData.value.remark_inspec.trim() === '')) {
            toast.add({ severity: 'warn', summary: 'Warning', detail: 'กรุณากรอก remark', life: 2000 });
            return;
        }
        loading.value = true;
        showDrawer.value = false;
        showTopDrawer.value = false; // <-- close Inspector Dialog after save
        selectedReceipt.value = drawerData.value;

        // ตรวจสอบว่าเลือก All Lot หรือ Only this lot สำหรับทุกสถานะ (PASS, REWORK, REJECT)
        if (drawerData.value.applyAllLot) {
            // All Lot
            await iqaCheckMaterialStore.iqa_check_Inspec_all({
                ITEMNO: drawerData.value.ITEMNO,
                invoiceNumber: drawerData.value.InvoiceNumber,
                status_Inspec: drawerData.value.selectedIqaStatusins,
                remark_inspec: drawerData.value.remark_inspec,
                inspec_user: (mainStore._userInfo as IViewEmployee).thai_name
            });
            
            await iqaCheckMaterialStore.addItemListTransaction_MC_PROD();
            await iqaCheckMaterialStore.itemLotSplit(selectedReceipt.value.InvoiceNumber);
            await iqaCheckMaterialStore.insert_item_normal();
            toast.add({ severity: 'success', summary: 'Success', detail: 'Success All Lot', life: 2000 });
        } else {
            // Only this lot
            await iqaCheckMaterialStore.iqa_check_Inspec({
                invoiceNumber: selectedReceipt.value.InvoiceNumber,
                ReceiveNo: selectedReceipt.value.ReceiveNo,
                lotNo: drawerData.value.lot_no,
                abnormally_number: drawerData.value.abnormally_number || '',
                status_Inspec: drawerData.value.selectedIqaStatusins,
                inspec_user: (mainStore._userInfo as IViewEmployee).thai_name,
                remark_inspec: drawerData.value.remark_inspec || '',
                lot_no_check: 1
            });
            await iqaCheckMaterialStore.addItemListTransaction_MC_PROD();
            await iqaCheckMaterialStore.itemLotSplit(selectedReceipt.value.InvoiceNumber);
        
            await iqaCheckMaterialStore.insert_item_normal();
            toast.add({ severity: 'success', summary: 'Success', detail: 'Success Only this lot', life: 2000 });
        }
        await iqaCheckMaterialStore.fetchIqaCheckMaterialItems_inspec();
iqaCheckMaterialStore._itemInspec.forEach((item: any) => {
    item.selectedIqaStatusins = item.IQA_Status || item.status_Inspec || null;
    item.isEditing = !item.status_Inspec || item.IQA_Status === 'UNDER_REVIEW';
});// รีโหลดข้อมูล
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'An error occurred', life: 2000 });
    } finally {
        loading.value = false;
    }
}



const filteredReceiveList = computed(() => {
    let list = iqaCheckMaterialStore._itemInspec;
    if (searchQuery.value && searchQuery.value.trim()) {
        const query = searchQuery.value.trim().toLowerCase();
        list = list.filter((item) => {
            const receiveNo = (item.ReceiveNo || '').toLowerCase();
            const invoiceNumber = (item.InvoiceNumber || '').toLowerCase();
            const vendorCode = (item.VendorCode || '').toLowerCase();
            const vendorName = (item.VendorName || '').toLowerCase();
            const iqaStatus = (item.IQA_Status || '').toLowerCase();
            return receiveNo.includes(query) || invoiceNumber.includes(query) || vendorCode.includes(query) || vendorName.includes(query) || iqaStatus.includes(query);
        });
    }
    if (!statusFilter.value.includes('ALL')) {
        list = list.filter((item) => statusFilter.value.includes((item.status_Inspec || '').toUpperCase()));
    }
    return list;
});

// เพิ่ม computed สำหรับรายการที่ยังไม่ save
const unsavedReceiveList = computed(() => {
    // เฉพาะรายการที่ยังไม่ save (IQA_Status ว่าง หรือ UNDER_REVIEW)
    return filteredReceiveList.value.filter(item => !item.IQA_Status || item.IQA_Status === 'UNDER_REVIEW');
});

onMounted(async () => {
    await iqaCheckMaterialStore.fetchIqaCheckMaterialItems_inspec();
    iqaCheckMaterialStore.selectedStatus = '';
    iqaCheckMaterialStore._itemInspec.forEach((item: any) => {
        item.selectedIqaStatusins = item.IQA_Status || item.status_Inspec || null;
        item.remark_inspec = item.remark_inspec || '';
        item.abnormally_number = item.abnormally_number || '';
       item.isEditing = !item.status_Inspec || item.IQA_Status === 'UNDER_REVIEW';
    });
    await iqaCheckMaterialStore.status_iqa_check();
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
</script>

<template>
    
    <div v-if="loading" class="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50" style="backdrop-filter: blur(2px); z-index: 1000">
        <div class="flex flex-col items-center">
            <i class="pi pi-spin pi-spinner text-4xl text-white mb-4" />
            <span class="text-white text-xl">กำลังโหลดข้อมูล...</span>
        </div>
    </div>

<Dialog
    v-model:visible="showDrawer"
    :modal="true"
    :closable="true"
    position="right"
    style="width: 400px; max-width: 90vw;"
    :dismissableMask="true"
    :header="'Remark Required'"
>
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
            <label class="block mb-2 font-medium" for="remark-inspec">Remark Inspection:</label>
            <InputText v-model="drawerData.remark_inspec" placeholder="Enter remark" class="w-full" />
        </div>
        <div class="flex justify-end gap-2">
            <Button label="Cancel" severity="secondary" @click="showDrawer = false" />
            <Button label="Save" icon="pi pi-check" @click="(event) => confirmSavePopup(event, drawerData)" />
        </div>
        <ConfirmPopup />
    </div>
</Dialog>
    <div class="card">
        <div class="font-semibold text-xl mb-4">IQA Material Inspection</div>
        <div class="flex items-center justify-between mb-4">
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
        <div class="font-semibold text-xl mb-4">IQA Inspection Material List</div>
        <DataTable
            :value="unsavedReceiveList"
            v-model:filters="filters"
            paginator
            :rows="10"
            filterDisplay="menu"
            showGridlines
            rowHover
            :globalFilter="searchQuery"
            :globalFilterFields="['ReceiveNo', 'InvoiceNumber', 'Status', 'VendorCode', 'VendorName', 'lot_count']"
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
            <Column field="RecheckDate" header="Recheck Date" sortable>
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
            <Column field="IQA_Status" header="StatusQty" sortable>
                <template #body="{ data }">
                    <span :class="getIqaResultClass(getIQAStatusText(data.status))">
                        {{ getIQAStatusText(data.status) }}
                    </span>
                </template>
            </Column>
            <Column field="selectedIqaStatusins" header="StatusInspec" sortable>
                <template #body="{ data }">
                    <Dropdown
                        v-model="data.selectedIqaStatusins"
                        :options="iqaCheckMaterialStore.iqaCheckOptions"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Select Status"
                        :disabled="!data.isEditing"
                        class="w-50"
                        :class="getIqaResultClass(getIQAStatusText(data.selectedIqaStatusins))"
                    >
                        <template #value="slotProps">
                            <span v-if="slotProps.value" :class="getIqaResultClass(getIQAStatusText(slotProps.value))">
                                {{ getIQAStatusText(slotProps.value) }}
                            </span>
                            <span v-else class="text-gray-400">Select Status</span>
                        </template>
                        <template #option="slotProps">
                            <span :class="getIqaResultClass(getIQAStatusText(slotProps.option.value))">
                                {{ getIQAStatusText(slotProps.option.value) }}
                            </span>
                        </template>
                    </Dropdown>
                </template>
            </Column>
            <!-- <Column field="remark_inspec" header="Remark Inspection" sortable>
                <template #body="{ data }">
                    
                    <InputText v-if="!(data.selectedIqaStatusins === 'REWORK' || data.selectedIqaStatusins === 'REJECT')" v-model="data.remark_inspec" placeholder="Enter remark" class="w-full"  />
                    <span v-else class="italic text-gray-400">กรอกใน Drawer</span>
                </template>
            </Column> -->

            <Column header="Actions">
                <template #body="{ data }">
                     <div class="flex items-center gap-3" style="font-size: 0.95rem;">
                    <Button
                        label="Save"
                        :disabled="!data.isEditing"
                        icon="pi pi-check"
                        v-tooltip.bottom="'Save status '"
                        @click="
                            () => {
                                selectedReceipt.value = data;
                                onIqaStatusChangeDropdown(data);
                            }
                        "
                    />
                    <Button icon="pi pi-eye" v-tooltip.bottom="'View User Check'"  @click="openTopDrawer(data)">
                          
                    </Button>
                </div>
                </template>
            </Column>

        </DataTable>
        <Dialog
        v-model:visible="showTopDrawer"
        :modal="true"
        :closable="true"
        position="right"
        style="width: 400px; max-width: 90vw;"
        :dismissableMask="true"
        :header="'Inspector Records'"
        @hide="closeTopDrawer"
    >
        <div v-if="drawerData">
            <div><strong>Inspector user:</strong> {{ drawerData.inspec_user || 'N/A' }}</div>
            
        </div>
    </Dialog>
    </div>
</template>
