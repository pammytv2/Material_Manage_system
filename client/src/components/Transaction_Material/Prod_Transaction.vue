<!-- <template>
        Stock Material Transaction Page
    </template> -->

<script lang="ts" setup>
import { onMounted, ref, computed, reactive } from 'vue';
import { useRouter } from 'vue-router';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import Dropdown from 'primevue/dropdown';
import { getIqaResultClass } from '@/stores/recive_material';
import { useMainStore } from '@/stores/main.store';
import {useTransactionMCProdStore} from '@/stores/transaction_mc_prod';
const cViewStatusStore = useTransactionMCProdStore();
import type { IViewEmployee } from '@/shared/interfaces/template-web-stack-2025/employee.interface';
import { FilterMatchMode, FilterOperator } from '@primevue/core/api';
import { userInfo } from 'os';
import { c } from 'node_modules/vite/dist/node/types.d-aGj9QkWt';
const loading = ref(false);
const searchQuery = ref('');
const mainStore = useMainStore();
const selectedReceipt = ref<any>(null);
const router = useRouter();

const transactionProdList = computed(() => cViewStatusStore._Transaction_Prod);

// ปรับ filter ให้รวม KeySearch ด้วย
const filteredReceiveList = computed(() => {
    let list = transactionProdList.value;
    if (cViewStatusStore.selectedStatus !== 'all') {
        list = list.filter(item => item.status === cViewStatusStore.selectedStatus);
    }
    if (searchQuery.value && searchQuery.value.trim() !== '') {
        const keyword = searchQuery.value.trim().toLowerCase();
        list = list.filter(item =>
            (item.ITEMNO && item.ITEMNO.toLowerCase().includes(keyword)) ||
            (item.lot_no && item.lot_no.toLowerCase().includes(keyword)) ||
            (item.lot_qty && String(item.lot_qty).toLowerCase().includes(keyword)) ||
            (item.status && item.status.toLowerCase().includes(keyword))
        );
    }
    // เรียงข้อมูลจากล่าสุดมาก่อน
    return list.slice().reverse();
});
onMounted(async () => {
    loading.value = true;
    // Fetch data if needed
    (mainStore._userInfo as IViewEmployee).SECCD;
   
    // const SECCD = Number((mainStore._userInfo as IViewEmployee).SECCD);
    const SECCD = 3421

    console.log('SECCD in Prod_Transaction:', SECCD);
    
    await cViewStatusStore.ItemListTransaction_PROD(SECCD);
    
    loading.value = false;
    // console.log('Transaction List in Prod_Transaction:', cViewStatusStore._Transaction_Prod);
});



const filters = ref({
    global: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
    ITEMNO: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
    lot_no: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
    lot_qty: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
    status: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] }
});

function clearFilter() {
    searchQuery.value = '';
    filters.value = {
        global: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
        ITEMNO: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
        lot_no: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
        lot_qty: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
        status: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] }
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
        <div class="font-semibold text-xl mb-4">Stock Material</div>
        <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-4">
                <div class="flex items-center gap-2">
                    <span class="font-medium">Filter by Status:</span>
                    <Dropdown v-model="cViewStatusStore.selectedStatus" :options="cViewStatusStore.statusOptions" optionValue="value" optionLabel="label" placeholder="เลือกสถานะ" class="w-60" showClear />
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
        <div class="font-semibold text-xl mb-4">Stock Material List</div>
        <DataTable
            :value="filteredReceiveList"
            v-model:filters="filters"
            filterDisplay="menu"
            paginator
            :rows="10"
            :dataKey="(item) => `${item.ITEMNO}_${item.lot_no}`"
            showGridlines
            rowHover
            :globalFilter="searchQuery"
            :globalFilterFields="['ITEMNO', 'lot_no', 'lot_qty', 'status']"
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
            <Column field="ITEMNO" header="Item No" sortable filter />
            <Column field="lot_no" header="LotNo" sortable filter />
            <Column field="lot_qty" header="LotQty" sortable filter />
            <Column field="status" header="Status" sortable filter>
                <template #body="{ data }">
                    <span :class="getIqaResultClass(data.status)">
                        {{ data.status }}
                    </span>
                </template>
            </Column>
        </DataTable>
    </div>
</template>
