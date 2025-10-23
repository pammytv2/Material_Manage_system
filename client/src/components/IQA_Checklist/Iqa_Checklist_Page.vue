<script lang="ts" setup>
import { onMounted, ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import Dialog from 'primevue/dialog';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import Dropdown from 'primevue/dropdown';

import { FilterMatchMode } from '@primevue/core/api';
import { filterMeta } from '@/interfaces/receive.interfaces';
import { useIqaCheckMaterialStore } from '@/stores/iqa_check_material';
import { s } from 'node_modules/vite/dist/node/types.d-aGj9QkWt';

const searchQuery = ref('');
const selectedReceipt = ref<any>(null);
const showDetailDialog = ref(false);
const iqaCheckMaterialStore = useIqaCheckMaterialStore();



// Mock data
onMounted(async () => {
  await iqaCheckMaterialStore.IqaCheckMaterialItems();

  console.log('IQA Check Material Items:', iqaCheckMaterialStore.items);
});

const filteredReceiveList = computed(() => {
  if (iqaCheckMaterialStore.selectedStatus === 'all') return iqaCheckMaterialStore.items;
  return iqaCheckMaterialStore.items.filter(item => item.status === iqaCheckMaterialStore.selectedStatus);
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
    @rowClick="
        (e) => {
            selectedReceipt = e.data;
            showDetailDialog = true;
        }
    "
    :globalFilterFields="['ReceiveNo', 'InvoiceNumber','Status','VendorCode', 'VendorName', 'CountOrder']"
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
    <Column field="Status" header="Status" sortable >
        <template #body="{ data }">
            <span>{{'รอการตรวจสอบ'}}</span>
        </template>
    </Column>
    <Column field="CountOrder" header="Count Order" sortable >
        <template #body="{ data }">
            <span>{{ data.lotcount}}</span>
        </template>
    </Column>
</DataTable>
    </div>
</template>
