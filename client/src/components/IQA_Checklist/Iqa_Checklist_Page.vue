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

const searchQuery = ref('');
const selectedReceipt = ref<any>(null);
const showDetailDialog = ref(false);
const iqaCheckMaterialStore = useIqaCheckMaterialStore();



// Mock data
const filteredReceiveListRaw = ref([
    {
        ReceptNumber: 'RCV001',
        ReciveDate: '2024-06-01',
        InvoiceNumber: 'INV123',
        VendorCode: 'V001',
        VendorName: 'Vendor A',
        CountOrder: 10,
        total_detail: 8,
        status: 'pending'
    },
    {
        ReceptNumber: 'RCV002',
        ReciveDate: '2024-06-02',
        InvoiceNumber: 'INV124',
        VendorCode: 'V002',
        VendorName: 'Vendor B',
        CountOrder: 5,
        total_detail: 5,
        status: 'pass'
    },
    {
        ReceptNumber: 'RCV003',
        ReciveDate: '2024-06-03',
        InvoiceNumber: 'INV125',
        VendorCode: 'V003',
        VendorName: 'Vendor C',
        CountOrder: 7,
        total_detail: 7,
        status: 'fail'
    }
]);

const filteredReceiveList = computed(() => {
    if (iqaCheckMaterialStore.selectedStatus === 'all') return filteredReceiveListRaw.value;
    return filteredReceiveListRaw.value.filter(item => item.status === iqaCheckMaterialStore.selectedStatus);
});
const filters = ref<{
    global: filterMeta;
    receiveNumber: filterMeta;
    receiveDate: filterMeta;
    invoiceNumber: filterMeta;
    vendorCode: filterMeta;
    vendorName: filterMeta;
    countOrder: filterMeta;
}>({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    receiveNumber: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    receiveDate: { value: null, matchMode: FilterMatchMode.DATE_IS },
    invoiceNumber: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    vendorCode: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
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
        countOrder: { value: null, matchMode: FilterMatchMode.CONTAINS }
    };
}
</script>

<template>
    <div class="card">
        <div class="font-semibold text-xl mb-4">IQA Receive Material</div>
        <div class="flex items-center gap-2 mb-2">
           <select v-model="iqaCheckMaterialStore.selectedStatus" showClear optionLabel="name" placeholder="Select a City" class="w-full md:w-56">
    <option v-for="opt in iqaCheckMaterialStore.statusOptions" :key="opt.value" :value="opt.value">
     สถานะ : {{ opt.label }}
    </option>
  </select>

        </div>
    </div>
    <div class="card">
        <div class="font-semibold text-xl mb-4">IQA Receive Material List</div>

        <DataTable
            :value="filteredReceiveList"
            v-model:filters="filters"
            paginator
            :rows="10"
            dataKey="ReceptNumber"
            filterDisplay="menu"
            showGridlines
            rowHover
            @rowClick="
                (e) => {
                    selectedReceipt = e.data;
                    showDetailDialog = true;
                }
            "
            :globalFilterFields="['ReceptNumber', 'ReciveDate', 'InvoiceNumber', 'VendorCode', 'VendorName', 'CountItem', 'CountOrder']"
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
            <Column field="ReceptNumber" header="Receive Number" sortable>
                <template #filter="{ filterModel }">
                    <InputText v-model="filterModel.value" type="text" class="p-column-filter" placeholder="Search by receive number" />
                </template>
            </Column>

            <Column field="InvoiceNumber" header="Invoice Number" sortable> </Column>

            <Column field="VendorCode" header="Vendor Code" sortable> </Column>

            <Column field="VendorName" header="Vendor Name" sortable> </Column>

            <Column field="CountOrder" header="Count Order" sortable> </Column>
        </DataTable>
    </div>
</template>
