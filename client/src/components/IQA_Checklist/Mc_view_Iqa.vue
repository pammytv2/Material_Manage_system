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
import { useMCviewStatusStore } from '@/stores/mc_view_status';
import { getIqaApprovalClass, getIqaResultClass, getIqaResultClassD, getIQAStatusTextD } from '@/stores/recive_material';

const loading = ref(false);
const searchQuery = ref('');
const selectedReceipt = ref<any>(null);
const showDetailDialog = ref(false);

const iqaCheckMaterialStore = useIqaCheckMaterialStore();
const manageMaterialStore = useManageMaterialStore();
const mcViewStatusStore = useMCviewStatusStore();
const router = useRouter();

const lotSplitLoading = ref(false);
const { getIQAStatusText } = manageMaterialStore;

const filteredReceiveList = computed(() => {
    let status: string | { value: string } = mcViewStatusStore.selectedStatus as string | { value: string };
    if (status && typeof status === 'object' && 'value' in status) {
        status = status.value;
    }
    
    let list = !status || status === 'all' ? mcViewStatusStore._mcViewStatusItems : mcViewStatusStore._mcViewStatusItems.filter((item) => item.IQA_Status === status);
    
    // Apply search query filter
    if (searchQuery.value && searchQuery.value.trim()) {
        const query = searchQuery.value.trim().toLowerCase();
        list = list.filter((item) => {
            const receiveNo = (item.ReceiveNo || '').toLowerCase();
            const invoiceNumber = (item.InvoiceNumber || '').toLowerCase();
            const vendorCode = (item.VendorCode || '').toLowerCase();
            const vendorName = (item.VendorName || '').toLowerCase();
            const iqaStatus = (item.IQA_Status || '').toLowerCase();
            
            return receiveNo.includes(query) ||
                  vendorName.includes(query) ||
                  vendorCode.includes(query) ||  
                  invoiceNumber.includes(query) || 
                  iqaStatus.includes(query);
        });
    }
    
    return list;
});

onMounted(async () => {
    await mcViewStatusStore.mc_view_status_items();
    console.log('MC View Status Items:', mcViewStatusStore._mcViewStatusItems);
    console.log('MC View Status Items Length:', mcViewStatusStore._mcViewStatusItems.length);
    await iqaCheckMaterialStore.status_iqa_check();
    console.log('IQA Status Items2:', iqaCheckMaterialStore._iqaStatus);
});

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
    IQA_Status: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] }
});
async function onRowClick(e: any) {
    if (!e.data) return;
    selectedReceipt.value = e.data;
    lotSplitLoading.value = true;
    try {
        await mcViewStatusStore.mc_recnum(e.data.InvoiceNumber);
        console.log('Receive Number Data:', mcViewStatusStore._mcRcDataItems);
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
        IQA_Status: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] }
    };
}

function navigateToMaterialsSplit() {
    try {
        if (!selectedReceipt.value) {
            console.error('selectedReceipt is null or undefined');
            return;
        }

        const receiveNumber = selectedReceipt.value.ReceiveNo || ''; // Changed from ReceptNumber to ReceiveNo
        const StatusRecIC = selectedReceipt.value.StatusRecIC || '';
        const InvoiceNumber = selectedReceipt.value.InvoiceNumber || '';
        let RecReceiveDate = mcViewStatusStore._mcRcDataItems?.[0]?.ReciveDate || '';
        if (RecReceiveDate instanceof Date) {
            RecReceiveDate = RecReceiveDate.toISOString();
        } else if (typeof RecReceiveDate !== 'string') {
            RecReceiveDate = String(RecReceiveDate);
        }
        const VendorName = selectedReceipt.value.VendorName || '';

        if (!receiveNumber) {
            console.error('ReceiveNo is missing from receipt object');
            return;
        }

        router.push({
            path: `/materials-split-detail/${receiveNumber}`,
            query: { StatusRecIC, InvoiceNumber, RecReceiveDate, VendorName }
        });

        console.log('Navigating with receipt:', selectedReceipt.value);
    } catch (error) {
        console.error('Error in navigateToMaterialsSplit:', error);
    }
}
</script>

<template>
    
    <div class="card">
        <div class="font-semibold text-xl mb-4">IQA Receive Material</div>
        <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-4">
                <div class="flex items-center gap-2">
                    <span class="font-medium">Filter by Status:</span>
                    <Dropdown v-model="mcViewStatusStore.selectedStatus" :options="iqaCheckMaterialStore.statusOptions" optionValue="value" optionLabel="label" placeholder="เลือกสถานะ" class="w-60" showClear />
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
            :globalFilterFields="['ReceiveNo', 'InvoiceNumber', 'IQA_Status', 'VendorCode', 'VendorName']"
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
                                <span class="font-medium">Receive Date:</span>
                                <span class="font-semibold bg-blue-100 text-blue-600 px-2 py-1 rounded">{{ mcViewStatusStore._mcRcDataItems?.[0]?.ReciveDate || 'N/A' }}</span>
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
                                            <span :class="getIqaResultClass(getIQAStatusText(data.selectedIqaStatus))">
                                                {{ getIQAStatusText(data.selectedIqaStatus) }}
                                            </span>
                                        </template>
                                    </Column>
                                    <Column field="remark" header="remark" sortable class="w-60">
                                        <template #body="{ data }">
                                            <input type="text" v-model="data.remark_iqa" class="w-full p-inputtext p-component p-filled" disabled placeholder="Enter remark" />
                                        </template>
                                    </Column>
                                    <Column field="Status" header="Status" sortable class="w-80">
                                        <template #body="{ data }">
                                            <span :class="getIqaResultClassD(data.StatusDescription ?? '')">
                                                {{ getIQAStatusTextD(data.StatusDescription ?? '') }}
                                            </span>
                                        </template>
                                    </Column>
                                </DataTable>
                            </template>
                        </div>
                    </div>
                </template>
                <template #footer>
                    <ConfirmDialog />
                    <Button label="Edit" @click="navigateToMaterialsSplit" icon="pi pi-pencil" />
                    <Button label="Close" @click="showDetailDialog = false" :disabled="loading" />
                </template>
            </Dialog>
        </DataTable>
    </div>
</template>
