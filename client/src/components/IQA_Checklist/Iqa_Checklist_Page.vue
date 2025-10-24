<script lang="ts" setup>
import { onMounted, ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import Dialog from 'primevue/dialog';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import { useManageMaterialStore } from '@/stores/manage_material';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import Dropdown from 'primevue/dropdown';
import { FilterMatchMode } from '@primevue/core/api';
import { filterMeta } from '@/interfaces/receive.interfaces';

import { useIqaCheckMaterialStore } from '@/stores/iqa_check_material';

import { useConfirm } from 'primevue/useconfirm';
import { c } from 'node_modules/vite/dist/node/types.d-aGj9QkWt';

const confirm = useConfirm();
const loading = ref(false);
const searchQuery = ref('');
const selectedReceipt = ref<any>(null);
const showDetailDialog = ref(false);
const detailRows = ref<any[]>([]);
const showDetailPageDialog = ref(false);
const iqaCheckMaterialStore = useIqaCheckMaterialStore();
const lotSplitData = ref<any[]>([]);
const lotSplitLoading = ref(false);


// Mock data
onMounted(async () => {
    await iqaCheckMaterialStore.fetchIqaCheckMaterialItems();
    console.log('IQA Items:', iqaCheckMaterialStore.IqaCheckMaterialItems);
    await iqaCheckMaterialStore.status_iqa_check();
    console.log('IQA Status Items2:', iqaCheckMaterialStore._iqaStatus);
});
const isAllLotsSelected = computed(() => {
    const allLots = Object.values(groupedLots.value).flat();
    if (allLots.length === 0) return false;
    return allLots.every((lot) => !!lot.selectedIqaStatus);
});

async function submitIqaCheckAll() {
    confirm.require({
        message: 'Are you sure you want to submit IQA Check for all lots?',
        header: 'Confirm Submission',
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
            for (const lots of Object.values(groupedLots.value)) {
                for (const lot of lots) {
                    if (lot.selectedIqaStatus) {
                        await iqaCheckMaterialStore.submitIqaCheck({
                            invoiceNumber: selectedReceipt.value.InvoiceNumber,
                            ReceiveNo: selectedReceipt.value.ReceiveNo,
                            lotNo: lot.lot_no,
                            status: lot.selectedIqaStatus
                        });
                    }
                }
            }
            showDetailDialog.value = false;
        }
    });
}
const filteredReceiveList = computed(() => {
    if (iqaCheckMaterialStore.selectedStatus === 'all') return iqaCheckMaterialStore.IqaCheckMaterialItems;
    return iqaCheckMaterialStore.items.filter((item) => item.status === iqaCheckMaterialStore.selectedStatus);
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

const filters = ref<{
    global: filterMeta;
    receiveNumber: filterMeta;
    receiveDate: filterMeta;
    invoiceNumber: filterMeta;
    vendorCode: filterMeta;
    vendorName: filterMeta;
    Status: filterMeta;
    countOrder: filterMeta;
}>({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    receiveNumber: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    receiveDate: { value: null, matchMode: FilterMatchMode.DATE_IS },
    invoiceNumber: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    vendorCode: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    Status: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    vendorName: { value: null, matchMode: FilterMatchMode.CONTAINS },
    countOrder: { value: null, matchMode: FilterMatchMode.CONTAINS }
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
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        receiveNumber: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
        receiveDate: { value: null, matchMode: FilterMatchMode.DATE_IS },
        invoiceNumber: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
        vendorCode: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
        vendorName: { value: null, matchMode: FilterMatchMode.CONTAINS },
        Status: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
        countOrder: { value: null, matchMode: FilterMatchMode.CONTAINS }
    };
}
</script>

<template>
    <div class="card">
        <div class="font-semibold text-xl mb-4">IQA Receive Material</div>
        <div class="flex items-center gap-2 mb-2">
            <span class="font-medium">Status:</span>
            <Dropdown v-model="iqaCheckMaterialStore.selectedStatus" :options="iqaCheckMaterialStore.statusOptions" optionLabel="label" placeholder="Status" class="w-60" />
        </div>
    </div>
    <div class="card">
        <div class="font-semibold text-xl mb-4">IQA Receive Material List</div>
        <DataTable
            :value="filteredReceiveList"
            v-model:filters="filters"
            paginator
            :rows="10"
            dataKey="ReceiveNo"
            filterDisplay="menu"
            showGridlines
            rowHover
            @rowClick="onRowClick"
            :globalFilterFields="['ReceiveNo', 'InvoiceNumber', 'Status', 'VendorCode', 'VendorName', 'CountOrder']"
            class="mb-6"
        >
            <template #header>
                <div class="flex justify-end gap-2">
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
                    <span>{{ 'รอการตรวจสอบ' }}</span>
                </template>
            </Column>
            <Column field="CountOrder" header="Count Order" sortable>
                <template #body="{ data }">
                    <span>{{ data.lotcount }}</span>
                </template>
            </Column>

            <Dialog v-model:visible="showDetailDialog" header="IQA Material Detail" :style="{ width: '1100px', maxWidth: '98vw' }">
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
                                            <Dropdown v-model="data.selectedIqaStatus" :options="iqaCheckMaterialStore.iqaCheckOptions" optionLabel="label" optionValue="value" placeholder="Select Status" class="w-60" />
                                        </template>
                                    </Column>
                                    <Column field="Quantity" header="remark" sortable class="w-60">
                                        <template #body="{ data }">
                                            {{ data.remark }}
                                        </template>
                                    </Column>
                                    <Column field="Status" header="Status" sortable class="w-60">
                                        <template #body="{ data }">
                                            {{ data.StatusDescription }}
                                        </template>
                                    </Column>
                                </DataTable>
                            </template>
                        </div>
                    </div>
                </template>
                <template #footer>
                    <Button label="IQA Submit" @click="submitIqaCheckAll" :disabled="loading || !isAllLotsSelected" />
                    <ConfirmDialog />
                    <Button label="Close" @click="showDetailDialog = false" :disabled="loading" />
                </template>
            </Dialog>
        </DataTable>
    </div>
</template>
