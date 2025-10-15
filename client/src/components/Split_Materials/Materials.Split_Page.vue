<script lang="ts" setup>
import { onMounted, ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useReceiveStore } from '@/stores/receive';
import { useMaterialSplit } from '@/stores/split_material';
import { FilterMatchMode, FilterOperator } from '@primevue/core/api';
import { filterMeta } from '@/interfaces/receive.interfaces';
// Add missing PrimeVue imports
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import DatePicker from 'primevue/datepicker';
import Dropdown from 'primevue/dropdown';

// Use the composable
const {
    router,
    receiveStore,
    handleRowClick,
    startDate,
    endDate,
    onDateSearch,
    filteredReceiveList,
    searchQuery,
    loading,
    ReceptNumber,
    formatDate
} = useMaterialSplit();

// const loading = receiveStore.loading;
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

onMounted(async () => {
    try {
        loading.value = true;
        await receiveStore.fetchReceiveItems(ReceptNumber.value);
        console.log('Fetched items for ReceptNumber:', ReceptNumber.value);
    } catch (error) {
        console.error('Error in onMounted:', error);
    } finally {
        loading.value = false;
    }
});

// Add rowClass for orange highlight
function rowClass(data: any) {

    if (data.lot_no_status_id === 2) {
        return 'highlight-blue-row';
    }
    if (data.split_status === 2) {
        return 'highlight-yellow-row';
    }
    if (data.split_status === 3) {
        return 'highlight-orange-row';
    }
    return '';
}

</script>

<template>
    <div class="card">
        <div class="font-semibold text-xl mb-4">Receive Material</div>
        <form class="mb-4 flex flex-col gap-4">
            <div class="flex flex-col md:flex-row md:items-end gap-4">
                <div class="flex gap-4">
                    <div class="flex flex-col">
                        <label for="startDate" class="mb-1 text-sm text-gray-600">Start Date</label>
                        <input id="startDate" v-model="startDate" type="date" class="p-2 border rounded md:w-40" />
                    </div>
                    <div class="flex flex-col">
                        <label for="endDate" class="mb-1 text-sm text-gray-600">End Date</label>
                        <input id="endDate" v-model="endDate" type="date" class="p-2 border rounded md:w-40" />
                    </div>
                    <button
                        type="button"
                        class="px-4 py-2 bg-green-500 text-white rounded h-fit md:mb-0 mt-6"
                        :disabled="!startDate || !endDate"
                        @click="
                            async () => {
                                await onDateSearch();
                            }
                        "
                    >
                        Search
                    </button>
                </div>
            </div>
        </form>
    </div>
    <div class="card">
        <div class="font-semibold text-xl mb-4">Receive Material List</div>
        <DataTable
            :value="filteredReceiveList"
            v-model:filters="filters"
            paginator
            :rows="10"
            dataKey="ReceptNumber"
            filterDisplay="menu"
            showGridlines
            rowHover
            @rowClick="(e) => handleRowClick(e.data)"
            :globalFilterFields="['ReceptNumber', 'ReciveDate', 'InvoiceNumber', 'VendorCode', 'VendorName', 'CountItem', 'CountOrder']"
            class="mb-6"
            :loading="loading"
            
            :rowClass="rowClass"
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

            <Column field="ReceptNumber" header="Receive Number" sortable>
                <template #filter="{ filterModel }">
                    <InputText v-model="filterModel.value" type="text" class="p-column-filter" placeholder="Search by receive number" />
                </template>
            </Column>

            <Column field="ReciveDate" header="Receive Date" sortable>
                <template #body="{ data }">
                    {{ formatDate(data.ReciveDate) }}
                </template>
                <template #filter="{ filterModel }">
                    <DatePicker v-model="filterModel.value" dateFormat="yy-mm-dd" placeholder="yyyy-mm-dd" />
                </template>
            </Column>

            <Column field="InvoiceNumber" header="Invoice Number" sortable>
                <template #filter="{ filterModel }">
                    <InputText v-model="filterModel.value" type="text" class="p-column-filter" placeholder="Search by invoice" />
                </template>
            </Column>

            <Column field="VendorCode" header="Vendor Code" sortable>
                <template #filter="{ filterModel }">
                    <InputText v-model="filterModel.value" type="text" class="p-column-filter" placeholder="Search by vendor code" />
                </template>
            </Column>

            <Column field="VendorName" header="Vendor Name" sortable>
                <template #filter="{ filterModel }">
                    <InputText v-model="filterModel.value" type="text" class="p-column-filter" placeholder="Search by vendor name" />
                </template>
            </Column>
            <!-- <Column field="CountOrder" header="Item Count" sortable>
            <template #body="{ data }">
                {{ data.total_lots }}
            </template> 
            <template #filter="{ filterModel }">
                <InputText v-model="filterModel.value" type="text" class="p-column-filter" placeholder="Search by total lots" />
            </template>
            </Column> -->
        </DataTable>
    </div>
</template>

<style scoped>
:deep(.highlight-blue-row) {
    background-color: #bfdbfe !important;
}
:deep(.highlight-blue-row:hover) {
    background-color: #60a5fa !important;
}
:deep(.highlight-blue-row td) {
    background-color: #bfdbfe !important;
}
:deep(.highlight-blue-row:hover td) {
    background-color: #60a5fa !important;
}

:deep(.highlight-yellow-row) {
    background-color: #fef08a !important;
}
:deep(.highlight-yellow-row:hover) {
    background-color: #fde047 !important;
}
:deep(.highlight-yellow-row td) {
    background-color: #fef08a !important;
}
:deep(.highlight-yellow-row:hover td) {
    background-color: #fde047 !important;
}
:deep(.highlight-orange-row) {
    background-color: #ffedd5 !important;
}
:deep(.highlight-orange-row:hover) {
    background-color: #fed7aa !important;
}
:deep(.highlight-orange-row td) {
    background-color: #ffedd5 !important;
}
:deep(.highlight-orange-row:hover td) {
    background-color: #fed7aa !important;
}
</style>
