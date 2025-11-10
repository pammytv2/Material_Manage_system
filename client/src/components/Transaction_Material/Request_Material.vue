<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { FilterMatchMode, FilterOperator } from '@primevue/core/api';
import Dropdown from 'primevue/dropdown';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import { useMainStore } from '@/stores/main.store';
import { useMaterialRequestStore } from '@/stores/material_req/material_requset';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon'; // <-- Add this line
import type { IViewEmployee } from '@/shared/interfaces/template-web-stack-2025/employee.interface';
const mainStore = useMainStore();
const materialRequestStore = useMaterialRequestStore();
const selectedGroupmat = ref(null);
const selectedtype2 = ref(null);
// Initialize toast and confirm directly in component
const breadcrumbItems = [
    { label: 'Home', to: '/', icon: 'pi pi-home' },
    { label: 'Request Material', to: '/Request_Material', icon: 'pi pi-shopping-cart' }
];

// Filters for DataTable
const filters = ref({
    global: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
    Type2Name: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
    description: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
    Unit: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }] },
    receiveQty: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }] },
    Quantity: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }] },
    Spec: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }] },
    Groupmat: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }] }
});

// Clear all filters
function clearFilter() {
    filters.value = {
        global: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
        Type2Name: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
        description: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
        Unit: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }] },
        receiveQty: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }] },
        Quantity: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }] },
        Spec: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }] },
        Groupmat: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }] }
    };
}

onMounted(async () => {
    // (mainStore._userInfo as IViewEmployee).GRPCD;
    console.log('GRPCD in Request_Material:', (mainStore._userInfo as IViewEmployee).GRPCD);

});
async function fetchMaterialRequests() {
     (mainStore._userInfo as IViewEmployee).GRPCD;
     // const sectgroup = Number((mainStore._userInfo as IViewEmployee).GRPCD);
    const sectgroup = 3412; // หรือดึงจาก mainStore._userInfo
    if (selectedGroupmat.value && selectedtype2.value) {
        await materialRequestStore.ItemListMaterialRequest(
            sectgroup,
            selectedGroupmat.value,
            selectedtype2.value
        );
    }
}
watch([selectedGroupmat, selectedtype2], fetchMaterialRequests);

const loadType2Name = async () => {
    if (selectedGroupmat.value) {
        const sectgroup = 3412;
        await materialRequestStore.getType2Name(sectgroup, selectedGroupmat.value);
    }
};
const loadGroupmat = async () => {
    (mainStore._userInfo as IViewEmployee).GRPCD;

    // const sectgroup = Number((mainStore._userInfo as IViewEmployee).GRPCD);
    const sectgroup = 3412;
    await materialRequestStore.getGroupmat(sectgroup);
    console.log('Groupmat List:', materialRequestStore._materialGroupmat);
};

// Refresh only the Manual Receive List table data (not full page reload)
async function refreshAllPage() {}
</script>

<template>
    <div class="card mb-6">
        <Breadcrumb :items="breadcrumbItems" class="mb-4" />

        <div class="flex items-center gap-4 mb-6">
            <div class="text-xl sm:text-2xl font-bold">Material Request</div>
        </div>

        <div class="text-right">
            <div class="text-sm text-gray-600 mb-1">Total Items</div>
            <div class="text-2xl font-bold text-blue-600">{{ materialRequestStore._materialRequests?.length || 0 }}</div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <div class="space-y-2">
                <label class="block text-sm font-medium text-gray-700">GROUPMAT</label>
                <Dropdown
                    v-model="selectedGroupmat"
                    :options="materialRequestStore._materialGroupmat"
                    optionLabel="GROUPMAT"
                    optionValue="GROUPMAT"
                    placeholder="Select Group Material"
                    class="w-full"
                    filter
                    show-clear
                    @show="loadGroupmat"
                    @change="selectedtype2 = null"
                >
                    <template #option="slotProps">
                        <div class="p-2">
                            <div class="font-medium">{{ slotProps.option.GROUPMAT }}</div>
                        </div>
                    </template>
                </Dropdown>
            </div>

            <div class="space-y-2">
                <label class="block text-sm font-medium text-gray-700">Type2Name</label>
                <Dropdown
                    v-model="selectedtype2"
                    :options="materialRequestStore._materialType2Name"
                    optionLabel="Type2Name"
                    optionValue="Type2Name"
                    placeholder="Select Type2Name"
                    class="w-full"
                    filter
                    show-clear
                    @show="loadType2Name"
                >
                    <template #option="slotProps">
                        <div class="p-2">
                            <div class="font-medium">{{ slotProps.option.Type2Name }}</div>
                        </div>
                    </template>
                </Dropdown>
            </div>
        </div>
    </div>

    <div class="mb-6">
        <DataTable
            :value="materialRequestStore._materialRequests"
            v-model:filters="filters"
            paginator
            :rows="10"
            dataKey="id"
            filterDisplay="menu"
            loadingIcon="pi pi-spin pi-spinner"
            showGridlines
            rowHover
            :globalFilterFields="['Type2Name', 'description', 'Unit', 'receiveQty', 'Quantity', 'Spec', 'Groupmat']"
            class="p-datatable-sm mb-6"
            responsiveLayout="scroll"
            :scrollable="true"
            scrollHeight="flex"
        >
            <template #header>
                <div class="font-semibold text-lg sm:text-xl mb-4">Material List</div>
                <div class="flex flex-col sm:flex-row flex justify-end gap-4">
                    <Button type="button" icon="pi pi-refresh" label="Refresh" severity="secondary" @click="refreshAllPage()" class="w-full sm:w-auto" />
                    <Button type="button" icon="pi pi-filter-slash" label="Clear" variant="outlined" @click="clearFilter()" class="w-full sm:w-auto" />
                    <IconField class="w-full sm:w-auto">
                        <InputIcon>
                            <i class="pi pi-search" />
                        </InputIcon>
                        <InputText v-model="filters['global'].constraints[0].value" placeholder="Keyword Search" class="w-full sm:w-auto" />
                    </IconField>
                </div>
            </template>

            <Column field="Type2Name" header="Type2Name" sortable style="min-width: 120px" />
            <Column field="SPEC" header="Spec" sortable style="min-width: 120px" />
            <Column field="GROUPMAT" header="Groupmat" sortable style="min-width: 120px" />
            <Column field="Total_After_qty" header="Quantity" sortable style="min-width: 100px" />
            <Column field="receiveQty" header="Receive Qty" sortable style="min-width: 120px" />
            <Column field="UNIT" header="Unit" sortable style="min-width: 80px" />
            <Column header="Actions" style="min-width: 150px" />
        </DataTable>
    </div>
</template>
