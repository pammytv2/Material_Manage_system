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
import ToastService from 'primevue/toastservice';
import { useToast } from 'primevue/usetoast';
import type { IViewEmployee } from '@/shared/interfaces/template-web-stack-2025/employee.interface';
const mainStore = useMainStore();
const materialRequestStore = useMaterialRequestStore();
const toast = useToast();
const selectedGroupmat = ref(null);
const selectedtype2 = ref(null);
// Track requested quantities for each material by id
const loadingGroupmat = ref(false);
const loadingType2Name = ref(false);
const requestQuantities = ref<Record<number, number>>({});
// Track selected materials for request actions
const selectedMaterials = ref<any[]>([]);
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
        loadingType2Name.value = true;
        const sectgroup = 3412;
        await materialRequestStore.getType2Name(sectgroup, selectedGroupmat.value);
        loadingType2Name.value = false;
    }
};
const loadGroupmat = async () => {
    (mainStore._userInfo as IViewEmployee).GRPCD;
    loadingGroupmat.value = true;

    // const sectgroup = Number((mainStore._userInfo as IViewEmployee).GRPCD);
    const sectgroup = 3412;
    await materialRequestStore.getGroupmat(sectgroup);
    loadingGroupmat.value = false;
    console.log('Groupmat List:', materialRequestStore._materialGroupmat);
};
async function addToRequest(material: any) {
    const quantity = requestQuantities.value[material.id];

     if (!quantity || quantity <= 0) {
        toast.add({ 
            severity: 'warn', 
            summary: 'แจ้งเตือน', 
            detail: 'กรุณาใส่จำนวนที่ต้องการเบิก', 
            life: 3000 
        });
        return;
    }
    
   
    console.log('Adding to request:', material);
   
}
function removeFromRequest(materialId: number): void {
    selectedMaterials.value = selectedMaterials.value.filter(item => item.id !== materialId);
    delete requestQuantities.value[materialId];
    toast.add({ 
        severity: 'info', 
        summary: 'ลบแล้ว', 
        detail: 'ลบรายการออกจากคำขอเบิกแล้ว', 
        life: 3000 
    });
}

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
                    :loading="loadingGroupmat"
                    @change="selectedtype2 = null"
                >
                    <template #option="slotProps">
                        <div class="p-2">
                            <div class="font-medium">{{ slotProps.option.GROUPMAT }}</div>
                        </div>
                    </template>
                      <template #empty>
                        <div class="p-2 text-gray-500">
                        {{ loadingGroupmat ? 'LOADING...' : 'ไม่พบข้อมูล' }}
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
                    :loading="loadingType2Name"
                >
                    <template #option="slotProps">
                        <div class="p-2">
                            <div class="font-medium">{{ slotProps.option.Type2Name }}</div>
                        </div>
                    </template>
                    <template #empty>
                        <div class="p-2 text-gray-500">
                        {{ loadingType2Name ? 'LOADING...' : 'ไม่พบข้อมูล' }}
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
            <Column field="receiveQty" header="Receive Qty" sortable style="min-width: 120px"
             <template #body="slotProps">
                            <InputNumber 
                                v-model="requestQuantities[slotProps.data.id]" 
                                :min="0" 
                                placeholder="0"
                                class="w-full"
                                size="small"
                                :suffix="` ${slotProps.data.UNIT}`"
                            />
                         
            </Column>

            
            <Column header="Actions" style="min-width: 150px">
                <template #body="slotProps">
                    <Button 
                        icon="pi pi-plus" 
                        size="small" 
                        severity="success"
                        @click="addToRequest(slotProps.data)"
                        :disabled="!requestQuantities[slotProps.data.id] || requestQuantities[slotProps.data.id] <= 0"
                        v-tooltip.top="'เพิ่มในรายการเบิก'"
                    />
                    <Button 
                        icon="pi pi-minus" 
                        size="small" 
                        severity="danger"
                        @click="removeFromRequest(slotProps.data.id)"
                        :disabled="!selectedMaterials.find(item => item.id === slotProps.data.id)"
                        v-tooltip.top="'ลบออกจากรายการเบิก'"
                    />
                </template>
            </Column>
        </DataTable>
    </div>
</template>
