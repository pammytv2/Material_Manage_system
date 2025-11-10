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
const confirm = useConfirm();
const toast = useToast();
const loading = ref(false);
const searchQuery = ref('');
const selectedReceipt = ref<any>(null);
const showDetailDialog = ref(false);
const detailRows = ref<any[]>([]);
const showDetailPageDialog = ref(false);
const iqaCheckMaterialStore = useIqaCheckMaterialStore();
const manageMaterialStore = useManageMaterialStore();
const lotSplitData = ref<any[]>([]);
const lotSplitLoading = ref(false);
const { getIQAStatusText, getIQARequiredClass } = manageMaterialStore;

async function onIqaStatusChangeDropdown(lot: any) {
    console.log('selectedIqaStatus:', lot.selectedIqaStatus);
    if (!lot.selectedIqaStatus || lot.selectedIqaStatus === 'UNDER_REVIEW') {
        toast.add({ severity: 'warn', summary: 'Warning', detail: 'กรุณาเลือก IQA Check ก่อนบันทึก', life: 2000 });
        return;
    }
    if ((lot.selectedIqaStatus === 'REWORK'||lot.selectedIqaStatus === 'REJECT') && !lot.remark_iqa) {
        toast.add({ severity: 'warn', summary: 'Warning', detail: 'กรุณากรอก remark เมื่อเลือก REWORK', life: 2000 });
        return;
    }
    loading.value = true;
    try {
        await iqaCheckMaterialStore.submitIqaCheck({
            invoiceNumber: selectedReceipt.value.InvoiceNumber,
            ReceiveNo: selectedReceipt.value.ReceiveNo,
            lotNo: lot.lot_no,
            status: lot.selectedIqaStatus,
            remark_iqa: lot.remark_iqa || ''
        });
        lot.IQA_Status = lot.selectedIqaStatus;
        await iqaCheckMaterialStore.addItemListTransaction_MC_PROD();
        toast.add({ severity: 'success', summary: 'Success', detail: 'Status saved successfully', life: 2000 });

        await iqaCheckMaterialStore.itemLotSplit(selectedReceipt.value.InvoiceNumber);
        iqaCheckMaterialStore._itemLotSplits.forEach((lot: any) => {
            lot.selectedIqaStatus = lot.status || null;
        });
        await iqaCheckMaterialStore.fetchIqaCheckMaterialItems();
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'An error occurred', life: 2000 });
    } finally {
        loading.value = false;
    }
}
const filteredReceiveList = computed(() => {
    let list = iqaCheckMaterialStore.filteredReceiveList;

    // Apply search query filter
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

    return list;
});

onMounted(async () => {
    iqaCheckMaterialStore.selectedStatus = '';
    await iqaCheckMaterialStore.fetchIqaCheckMaterialItems();
    console.log('IQA Items:', iqaCheckMaterialStore.IqaCheckMaterialItems);
    await iqaCheckMaterialStore.status_iqa_check();
    console.log('IQA Status Items2:', iqaCheckMaterialStore._iqaStatus);
});

async function IqaComplete() {
    confirm.require({
        message: 'Are you sure you want to submit IQA Check for all lots?',
        header: 'Confirm Submission',
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
            loading.value = true;
            try {
                for (const lots of Object.values(groupedLots.value)) {
                    for (const lot of lots) {
                        if (lot.selectedIqaStatus) {
                            await iqaCheckMaterialStore.completeIqaCheck({
                                invoiceNumber: selectedReceipt.value.InvoiceNumber,
                                ReceiveNo: selectedReceipt.value.ReceiveNo,
                                lotNo: lot.lot_no
                            });
                        }
                    }
                }
                // รีเฟรชข้อมูล Lot และ Receive Material List
                await iqaCheckMaterialStore.itemLotSplit(selectedReceipt.value.InvoiceNumber);
                await iqaCheckMaterialStore.fetchIqaCheckMaterialItems();
                toast.add({ severity: 'success', summary: 'Success', detail: 'ตรวจสอบสำเร็จ', life: 3000 });
                showDetailDialog.value = false;
            } catch (error) {
                toast.add({ severity: 'error', summary: 'Error', detail: 'เกิดข้อผิดพลาดการยืนยันตรวจ', life: 3000 });
            } finally {
                loading.value = false;
            }
        }
    });
}
const groupedLots = computed(() => {
    const groups: Record<string, any[]> = {};
    iqaCheckMaterialStore._itemLotSplits.forEach((lot: any) => {
        const key = lot.ITEMNO || lot.itemno || lot.item_no || 'UNKNOWN';
        if (!groups[key]) groups[key] = [];
        groups[key].push(lot);
    });
    return groups;
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
async function onRowClick(e: any) {
    if (!e.data) return;
    selectedReceipt.value = e.data;
    lotSplitLoading.value = true;
    try {
        await iqaCheckMaterialStore.itemLotSplit(e.data.InvoiceNumber);
        iqaCheckMaterialStore._itemLotSplits.forEach((lot: any) => {
            lot.selectedIqaStatus = lot.status || null;
        });
        console.log('Lot Split Data:', iqaCheckMaterialStore._itemLotSplits);
    } finally {
        lotSplitLoading.value = false;
        showDetailDialog.value = true;
    }
}
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
    <div class="card">
        <div class="font-semibold text-xl mb-4">IQA Receive Material</div>
        <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-4">
                <div class="flex items-center gap-2">
                    <span class="font-medium">Filter by Status:</span>
                    <Dropdown v-model="iqaCheckMaterialStore.selectedStatus" :options="iqaCheckMaterialStore.statusOptions" optionValue="value" optionLabel="label" placeholder="เลือกสถานะ" class="w-60" showClear />
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
            @rowClick="onRowClick"
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
            <Column field="ReceiveNo" header="Receive Number" sortable>
                <template #filter="{ filterModel }">
                    <InputText v-model="filterModel.value" type="text" class="p-column-filter" placeholder="Search by receive number" />
                </template>
            </Column>

            <Column field="InvoiceNumber" header="Invoice Number" sortable>
                <template #body="{ data }">
                    <span>{{ data.InvoiceNumber || 'N/A' }}</span>
                </template>
            </Column>

            <Column field="VendorCode" header="Vendor Code" sortable />
            <Column field="VendorName" header="Vendor Name" sortable />
            <Column field="Status" header="Status" sortable>
                <template #body="{ data }">
                    <span :class="getIqaApprovalClass(data.IQA_Status)">
                        {{ data.IQA_Status }}
                    </span>
                </template>
            </Column>
            <Column field="lot_count" header="Count Order" sortable>
                <template #body="{ data }">
                    <span>{{ data.lot_count }}</span>
                </template>
                <template #filter="{ filterModel }">
                    <InputText v-model="filterModel.value" type="text" class="p-column-filter" placeholder="Search by count" />
                </template>
            </Column>

            <Dialog v-model:visible="showDetailDialog" header="IQA Material Detail" :style="{ width: '1100px', maxWidth: '98vw' }" modal>
                <template #default>
                    <div class="mb-4">
                        <div class="flex flex-wrap gap-4">
                            <!-- {{iqaCheckMaterialStore._itemLotSplits }} -->
                            <div>
                                <span class="font-medium">Receive Number:</span>
                                <span class="font-semibold bg-blue-100 text-blue-600 px-2 py-1 rounded">{{ selectedReceipt.ReceiveNo }}</span>
                            </div>
                            <div>
                                <span class="font-medium">Invoice Number:</span>
                                <span class="font-semibold bg-blue-100 text-blue-600 px-2 py-1 rounded">{{ selectedReceipt.InvoiceNumber }}</span>
                            </div>
                            <div>
                                <span class="font-medium">Vendor Name:</span>
                                <span class="font-semibold bg-blue-100 text-blue-600 px-2 py-1 rounded">{{ selectedReceipt.VendorName || 'N/A' }}</span>
                            </div>
                            <div>
                                <span class="font-medium">Vendor Code:</span>
                                <span class="font-semibold bg-blue-100 text-blue-600 px-2 py-1 rounded">{{ selectedReceipt.VendorCode || 'N/A' }}</span>
                            </div>
                        </div>
                        <div class="mt-5">
                            <template v-for="(lots, itemNo) in groupedLots" :key="itemNo">
                                <div class="text-base font-bold mb-2" style="font-family: 'Segoe UI', 'Arial', sans-serif">
                                    [{{ itemNo }}]
                                    <span v-if="lots[0]?.ITEMDesc">{{ lots[0].ITEMDesc }}</span>
                                    <span v-else-if="lots[0]?.MaterialName">{{ lots[0].MaterialName }}</span>
                                </div>
                                <DataTable :value="lots" :loading="lotSplitLoading" showGridlines class="mb-6">
                                    <Column field="lot_no" header="Lot No" sortable class="w-60">
                                        <template #body="{ data }">
                                            {{ data.lot_no }}
                                        </template>
                                    </Column>
                                    <Column field="MaterialCode" header="Lot Quantity" sortable class="w-60">
                                        <template #body="{ data }">
                                            {{ data.lot_qty.toLocaleString() }}
                                        </template>
                                    </Column>
                                    <Column field="MaterialName" header="IQA Check" sortable class="w-60">
                                        <template #body="{ data }">
                                            <Dropdown v-model="data.selectedIqaStatus" :options="iqaCheckMaterialStore.iqaCheckOptions" optionLabel="label" optionValue="value" placeholder="Select Status" class="w-50">
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
                                    <Column field="remark" header="remark" sortable class="w-60">
                                        <template #body="{ data }">
                                            <input type="text" v-model="data.remark_iqa" class="w-full p-inputtext p-component p-filled" placeholder="Enter remark" />
                                        </template>
                                    </Column>
                                    <Column field="Status" header="Status" sortable class="w-80">
                                        <template #body="{ data }">
                                            <span :class="getIqaResultClassD(data.StatusDescription ?? '')">
                                                {{ getIQAStatusTextD(data.StatusDescription ?? '') }}
                                            </span>
                                            <!-- {{ data.StatusDescription }} -->
                                        </template>
                                    </Column>
                                    <Column field="Action" header="Action" sortable class="w-60">
                                        <template #body="{ data }">
                                            <Button
                                                label="Save"
                                                icon="pi pi-check"
                                                class="p-button-success"
                                                @click="onIqaStatusChangeDropdown(data)"
                                                :disabled="data.selectedIqaStatus === 'UNDER_REVIEW' || loading || ((data.selectedIqaStatus === 'REWORK' || data.selectedIqaStatus === 'REJECT') && !data.remark_iqa)"
                                            />
                                        </template>
                                    </Column>
                                </DataTable>
                            </template>
                        </div>
                    </div>
                </template>
                <template #footer>
                    <!-- <Button label="IQA Submit" @click="IqaComplete" :disabled="loading" /> -->
                    <ConfirmDialog />
                    <Button label="Close" @click="showDetailDialog = false" :disabled="loading" />
                </template>
            </Dialog>
        </DataTable>
    </div>
</template>
