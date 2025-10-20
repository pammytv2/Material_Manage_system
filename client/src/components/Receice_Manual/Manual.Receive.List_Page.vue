<script setup lang="ts">
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { FilterMatchMode } from '@primevue/core/api';
import { useManualMaterial } from '@/stores/manual_material';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';

const router = useRouter();
const toast = useToast();

// Get functions and data from composable - add error handling
let composableData;
try {
    composableData = useManualMaterial();
} catch (error) {
    console.error('Error initializing useManualMaterial:', error);
    // Provide fallback values
    composableData = {
        loading: ref(false),   
        manualReceives: ref([]),
        selectedRows: ref([]),
        loadManualReceives: async () => {}
    };
}

const {
    loading,
    manualReceives,
    selectedRows,
    loadManualReceives
} = composableData;

// Filters for DataTable
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    receiveNumber: { value: null, matchMode: FilterMatchMode.CONTAINS },
    receiveDate: { value: null, matchMode: FilterMatchMode.CONTAINS },
    InvoiceNumber: { value: null, matchMode: FilterMatchMode.CONTAINS },
    VendorCode: { value: null, matchMode: FilterMatchMode.CONTAINS },
    VendorName: { value: null, matchMode: FilterMatchMode.CONTAINS },
    PoNumber: { value: null, matchMode: FilterMatchMode.CONTAINS },
});

function onRowClick(event: any) {
    const invoiceNumber = event.data.InvoiceNumber;
    const poNumber = event.data.PoNumber;
    const vendorCode = event.data.VendorCode;

    console.log('Row clicked:', { invoiceNumber, poNumber, vendorCode });

    // ส่งไปหน้า Receive.Manual_Page.vue พร้อม query
    router.push({
        path: '/receive-manual',
        query: {
            mode: 'view', // เพิ่ม mode สำหรับการดู
            invoiceNumber,
            poNumber: poNumber || '', // ถ้า poNumber เป็น null ให้เป็น empty string
            vendorCode: vendorCode || '' // ถ้า vendorCode เป็น null ให้เป็น empty string
        }
    });
}

onMounted(async () => {
    try {
        await loadManualReceives(toast);
         manualReceives.value = manualReceives.value.map(item => ({
            ...item,
            PoNumber: Array.isArray(item.PoNumber) ? item.PoNumber.join(', ') : (item.PoNumber ?? ''),
        }));
        console.log('Manual Receives:', manualReceives.value);
    } catch (error) {
        console.error('Error loading manual receives:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load manual receives',
            life: 3000
        });
    }
});
// Create new manual receive
async function createNew() {
    // Clear any existing data before navigation
    if (composableData && typeof composableData.resetForm === 'function') {
        composableData.resetForm();
    }
    
    await router.push({
        path: '/receive-manual',
        query: { 
            mode: 'create',
            timestamp: Date.now() // เพิ่ม timestamp เพื่อบังคับให้ component รู้ว่าเป็นการสร้างใหม่
        }
    });
}


// Clear all filters
function clearFilter() {
    filters.value = {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        receiveNumber: { value: null, matchMode: FilterMatchMode.CONTAINS },
        receiveDate: { value: null, matchMode: FilterMatchMode.CONTAINS },
        InvoiceNumber: { value: null, matchMode: FilterMatchMode.CONTAINS },
        VendorCode: { value: null, matchMode: FilterMatchMode.CONTAINS },
        VendorName: { value: null, matchMode: FilterMatchMode.CONTAINS },
        PoNumber: { value: null, matchMode: FilterMatchMode.CONTAINS }
    };
}


function refreshAllPage() {
    window.location.reload();
}


</script>

<template>
   <div class="flex flex-col items-center bg-transparent w-full ">
    <div class="card w-full max-w-full mx-auto px-2 mt-12">
        <div class="flex items-center justify-between  mb-6 ">
            <div class="text-2xl font-bold">Manual Receive List</div>
            <div class="flex gap-2">
                <Button type="button" icon="pi pi-refresh" label="Refresh" @click="refreshAllPage" severity="secondary" />
                <Button label="Create New" icon="pi pi-plus" @click="createNew" severity="primary" />
            </div>
        </div>

        <DataTable
            :value="manualReceives"
            v-model:filters="filters"
            v-model:selection="selectedRows"
            paginator
            :rows="20"
            dataKey="receiveNumber"
            filterDisplay="menu"
            :loading="loading"
            loadingIcon="pi pi-spin pi-spinner"
            showGridlines
            rowHover
            :globalFilterFields="['receiveNumber', 'receiveDate', 'InvoiceNumber', 'PoNumber', 'VendorCode', 'VendorName']"
            class="w-full"
            responsiveLayout="scroll"
            :sortField="'ImportDate'" 
            :sortOrder="-1" 
            @row-click="onRowClick"
            
           
        >
            <template #header>
                <div class="flex justify-between items-center">
                    <Button type="button" icon="pi pi-filter-slash" label="Clear" variant="outlined" @click="clearFilter()" />
                    <div class="flex gap-2">
                        <IconField>
                            <InputIcon>
                                <i class="pi pi-search" />
                            </InputIcon>
                            <InputText v-model="filters['global'].value" placeholder="Keyword Search" />
                        </IconField>
                    </div>
                </div>
            </template>
            <Column field="InvoiceNumber" header="Invoice Number" sortable style="width: 180px">
                <template #body="slotProps">
                    <div class="font-medium">
                        {{ slotProps.data.InvoiceNumber }}
                    </div>
                </template>
                <template #filter="{ filterModel }">
                    <InputText v-model="filterModel.value" type="text" class="p-column-filter" placeholder="Search by invoice" />
                </template>
            </Column>
            <Column field="PoNumber" header="PoNumber" sortable style="width: 150px">
                <template #body="slotProps">
                    {{ slotProps.data.PoNumber }}
                </template>
                <template #filter="{ filterModel }">
                    <InputText v-model="filterModel.value" type="text" class="p-column-filter" placeholder="Search by po number" />
                </template>
            </Column>

            <Column field="VendorCode" header="Vendor Code" sortable style="width: 150px">
                <template #body="slotProps">
                    {{ slotProps.data.VendorCode }}
                </template>
                <template #filter="{ filterModel }">
                    <InputText v-model="filterModel.value" type="text" class="p-column-filter" placeholder="Search by vendor code" />
                </template>
            </Column>

            <Column field="VendorName" header="Vendor Name" sortable style="width: 150px">
                <template #body="slotProps">
                    {{ slotProps.data.VendorName }}
                </template>
                <template #filter="{ filterModel }">
                    <InputText v-model="filterModel.value" type="text" class="p-column-filter" placeholder="Search by vendor name" />
                </template>
            </Column>

            <template #empty>
                <div class="text-center py-8">
                    <i class="pi pi-inbox text-4xl text-gray-400 mb-4 block"></i>
                    <p class="text-gray-500 text-lg mb-4">No manual receive records found</p>
                    <Button label="Create First Manual Receive" icon="pi pi-plus" @click="createNew" severity="success" />
                </div>
            </template>
        </DataTable>
    </div>
    </div>
</template>

<style scoped>
.p-datatable-sm .p-datatable-tbody > tr > td {
    padding: 0.5rem;
}
</style>