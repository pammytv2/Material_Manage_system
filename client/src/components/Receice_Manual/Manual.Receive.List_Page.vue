<script setup lang="ts">
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useReceiveStore } from '@/stores/receive';
import { FilterMatchMode } from '@primevue/core/api';

const receiveStore = useReceiveStore();
const router = useRouter();
const toast = useToast();
const loading = ref(false);
const manualReceives = ref([]);
const selectedRows = ref([]);

// Filters for DataTable
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    receiveNumber: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    receiveDate: { value: null, matchMode: FilterMatchMode.CONTAINS },
    invoiceNumber: { value: null, matchMode: FilterMatchMode.CONTAINS },
    vendorCode: { value: null, matchMode: FilterMatchMode.CONTAINS },
    vendorName: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

// Load manual receives list
// async function loadManualReceives() {
//     try {
//         loading.value = true;
//         const data = await receiveStore.getManualReceiveList();
//         manualReceives.value = data || [];

//         toast.add({
//             severity: 'success',
//             summary: 'Success',
//             detail: `Loaded ${manualReceives.value.length} manual receive records`,
//             life: 3000
//         });
//     } catch (error: any) {
//         console.error('Error loading manual receives:', error);
//         toast.add({
//             severity: 'error',
//             summary: 'Error',
//             detail: 'Failed to load manual receive list',
//             life: 3000
//         });
//     } finally {
//         loading.value = false;
//     }
// }

// View detail

// Create new manual receive
function createNew() {
    router.push('/receive-manual');
}

// Clear all filters
function clearFilter() {
    filters.value = {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        receiveNumber: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
        receiveDate: { value: null, matchMode: FilterMatchMode.CONTAINS },
        invoiceNumber: { value: null, matchMode: FilterMatchMode.CONTAINS },
        vendorCode: { value: null, matchMode: FilterMatchMode.CONTAINS },
        vendorName: { value: null, matchMode: FilterMatchMode.CONTAINS }
    };
}

// Format date
function formatDate(dateString: string) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}
function refreshAllPage() {
    window.location.reload();
}

onMounted(() => {
    // loadManualReceives();
});
</script>

<template>
    <div class="card">
        <div class="flex items-center justify-between mb-6">
            <div class="text-2xl font-bold">Manual Receive List</div>
            <div class="flex gap-2">
            <Button type="button" icon="pi pi-refresh" label="Refresh" @click="refreshAllPage" severity="secondary"  />
            <Button label="Create New" icon="pi pi-plus" @click="createNew" severity="primary"  />
          
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
            :globalFilterFields="['receiveNumber', 'receiveDate', 'invoiceNumber', 'vendorCode', 'vendorName']"
            class="p-datatable-sm"
            responsiveLayout="scroll"
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
            <Column field="invoiceNumber" header="Invoice Number" sortable style="width: 180px">
                <template #body="slotProps">
                    <div class="font-medium">
                        {{ slotProps.data.invoiceNumber }}
                    </div>
                </template>
                <template #filter="{ filterModel }">
                    <InputText v-model="filterModel.value" type="text" class="p-column-filter" placeholder="Search by invoice" />
                </template>
            </Column>
            <Column field="PoNumber" header="Po Number" sortable style="width: 150px">
                <template #body="slotProps">
                    {{ slotProps.data.poNumber }}
                </template>
                <template #filter="{ filterModel }">
                    <InputText v-model="filterModel.value" type="text" class="p-column-filter" placeholder="Search by po number" />
                </template>
            </Column>

          
            

            <Column field="vendorCode" header="Vendor Code" sortable style="width: 150px">
                <template #body="slotProps">
                    {{ slotProps.data.vendorCode }}
                </template>
                <template #filter="{ filterModel }">
                    <InputText v-model="filterModel.value" type="text" class="p-column-filter" placeholder="Search by vendor code" />
                </template>
            </Column>

            <Column field="vendorName" header="Vendor Name" sortable style="width: 150px">
                <template #body="slotProps">
                    {{ slotProps.data.vendorName }}
                </template>
                <template #filter="{ filterModel }">
                    <InputText v-model="filterModel.value" type="text" class="p-column-filter" placeholder="Search by vendor name" />
                </template>
            </Column>

            <Column field="createdAt" header="Created At" sortable style="width: 150px">
                <template #body="slotProps">
                    {{ formatDate(slotProps.data.createdAt) }}
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
</template>

<style scoped>
.p-datatable-sm .p-datatable-tbody > tr > td {
    padding: 0.5rem;
}
</style>
