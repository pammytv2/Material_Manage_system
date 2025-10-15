<script setup lang="ts">
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import { onMounted, reactive, ref, computed, h } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useReceiveStore } from '@/stores/receive';
import { FilterMatchMode, FilterOperator } from '@primevue/core/api';
import type { receiveForm, receiveItems, NoPoItemType } from '@/interfaces/manual.interfaces';
import { useReceiveStore_manual } from '@/stores/receive_manual';
import { useManualMaterial } from '@/stores/manual_material';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import AutoComplete from 'primevue/autocomplete';
import Chips from 'primevue/chips';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import ConfirmDialog from 'primevue/confirmdialog';

// Initialize toast and confirm directly in component
const toast = useToast();
const confirm = useConfirm();
const route = useRoute();
const router = useRouter(); // <-- Add this line

// Use the manual material composable but exclude toast, confirm, and router
const {
    // Router and utilities
    // Remove router from here

    // Loading states
    loading,
    pageLoading,
    // Data
    selectedRows,
    poHeader,
    receiveItems,
    receiveForm,
    noPoItem,
    noPoItems,
    // Options and suggestions
    itemNoOptions,
    locationList,
    filteredLocationOptions,
    filteredItemNoOptions,
    vdcodeSuggestions,
    // Dialog state
    showNoPoDialog,
    // Error states
    invoiceNoError,
    poNumberError,
    vdcodeError,
    invoiceNoNoPoError,
    itemNoNoPoError,
    locationNoPoError,
    vdcodeNoPoError,
    // Computed
    isFormValid,
    grandTotal,
    noPoSubtotal,
    // Functions
    closeNoPoDialog,
    filterItemNoOptions,
    searchVDCODE,
    filterLocationOptions,
    confirmRemoveNoPoItem,
    saveReceive,
    confirmSave,

    viewManualDetail,
    searchItemListManual,
    confirmSaveNoPoItems,
    saveNoPoItems,
    addNoPoItem,
    removeNoPoItem,
    editNoPoItem,
    editNoPoFromList
} = useManualMaterial();

const receiveStore_manual = useReceiveStore_manual();

// Filters for DataTable
const filters = ref({
    global: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
    itemNo: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
    description: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
    unit: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }] },
    receiveQty: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }] },
    Quantity: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }] },
    unitCost: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }] },
    extendedcost: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }] }
});
const goBack = () => {
    router.back(); // <-- This now uses the correct router instance
};

// Clear all filters
function clearFilter() {
    filters.value = {
        global: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
        itemNo: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
        description: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
        unit: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }] },
        receiveQty: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }] },
        Quantity: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }] },
        unitCost: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }] },
        extendedcost: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }] }
    };
}


function openNoPoDialog() {
    showNoPoDialog.value = true;
}

onMounted(async () => {
    pageLoading.value = true;
    try {
        const response = await receiveStore_manual.fetchVDCODE();
        const itemList = await receiveStore_manual.fetchItemList_spec();
        const locationRaw = await receiveStore_manual.fetchLocation();

        // Pass route query parameters to viewManualDetail
        const invoiceNumber = route.query.invoiceNumber as string;
        const poNumber = route.query.poNumber as string;
        await viewManualDetail(invoiceNumber, poNumber);

        vdcodeSuggestions.value = response ?? [];
        itemNoOptions.value = (itemList ?? []).map((item) => ({
            label: `${item.ItemNo.trim()} - ${item.SPEC?.trim() ?? ''}`,
            value: item.ItemNo.trim()
        }));
        locationList.value = (locationRaw ?? []).map((loc) => ({
            label: `[${loc.LOCATION?.trim() ?? ''}] ${loc.LOCATIONNAME?.trim() ?? ''}`,
            value: loc.LOCATION?.trim() ?? ''
        }));

        console.log('locationList:', locationList.value);
        console.log('itemNoOptions:', itemNoOptions.value);
    } catch (error) {
        console.error('Error in onMounted:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load initial data',
            life: 3000
        });
    } finally {
        loading.value = false;
        pageLoading.value = false;
    }
});
</script>

<template>
    <!-- Full Page Loading Overlay -->
    <div v-if="pageLoading" class="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50" style="backdrop-filter: blur(2px); z-index: 1000">
        <div class="flex flex-col items-center">
            <i class="pi pi-spin pi-spinner text-4xl text-white mb-4" />
            <span class="text-white text-xl">กำลังโหลดข้อมูล...</span>
        </div>
    </div>

    <div class="card mb-6">
        <Button icon="pi pi-arrow-left" @click="goBack" severity="secondary" outlined class="mb-4" />
        <div class="flex items-center gap-4 mb-6">
            <div class="text-xl sm:text-2xl font-bold">Manual Receive</div>
        </div>

        <!-- Header Information -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <div class="space-y-2">
                <label for="InvoiceNo" class="block font-bold text-sm">Invoice Number</label>
                <InputText :modelValue="String(receiveForm.InvoiceNo ?? '')" @update:modelValue="(val) => (receiveForm.InvoiceNo = String(val))" placeholder="Invoice Number" class="w-full" :inputStyle="{ minHeight: '40px', fontSize: '1rem' }" />
                <span v-if="invoiceNoError" class="text-red-500 text-xs">{{ invoiceNoError }}</span>
            </div>
            <div class="space-y-2">
                <label for="PoNumber" class="block font-bold text-sm">Po Number</label>
                <Chips v-model="receiveForm.receiveNumberList" separator="," addOnBlur placeholder="Po Number" class="w-full" :inputStyle="{ minHeight: '25px', fontSize: '1rem' }" />
                <span v-if="poNumberError" class="text-red-500 text-xs">{{ poNumberError }}</span>
            </div>
            <div class="space-y-2">
                <label for="VDCODE" class="block font-bold text-sm">VDCODE</label>
                <AutoComplete
                    v-model="receiveForm.VDCODE"
                    :suggestions="vdcodeSuggestions"
                    @complete="searchVDCODE"
                    placeholder="Search or select VDCODE"
                    class="w-full"
                    dropdown
                    :optionLabel="(item) => `[${item.code}] ${item.name}`"
                    :optionValue="(item) => item.code"
                    :inputStyle="{ whiteSpace: 'normal', wordBreak: 'break-word', minHeight: '40px' }"
                    :panelStyle="{ minWidth: '300px', maxWidth: '100%' }"
                >
                    <template #option="slotProps">
                        <div style="white-space: normal; word-break: break-word; max-width: 300px">
                            <span class="font-semibold">[{{ slotProps.option.code }}]</span>
                            <span class="ml-2">{{ slotProps.option.name }}</span>
                        </div>
                    </template>
                </AutoComplete>
                <span v-if="vdcodeError" class="text-red-500 text-xs">{{ vdcodeError }}</span>
            </div>
        </div>

        <div class="flex flex-col sm:flex-row gap-4 mb-6">
            <Button label="search" icon="pi pi-search" severity="success" @click="() => searchItemListManual(toast)" outlined style="background-color: #22c55e; color: #fff" class="w-full sm:w-auto" />

            <Button label="Add Material (No PO)" icon="pi pi-plus" severity="info" outlined @click="openNoPoDialog" class="w-full sm:w-auto" />
        </div>
    </div>

    <div class="mb-6">
        <DataTable
            :value="receiveItems"
            v-model:filters="filters"
            v-model:selection="selectedRows"
            paginator
            :rows="10"
            dataKey="id"
            filterDisplay="menu"
            :loading="loading"
            loadingIcon="pi pi-spin pi-spinner"
            showGridlines
            rowHover
            :globalFilterFields="['itemNo', 'description', 'unit', 'receiveQty', 'Quantity', 'unitCost', 'extendedcost']"
            class="p-datatable-sm mb-6"
            responsiveLayout="scroll"
            :scrollable="true"
            scrollHeight="flex"
        >
            <template #header>
                <div class="font-semibold text-lg sm:text-xl mb-4">Manual Receive List</div>
                <div class="flex flex-col sm:flex-row justify-between gap-4">
                    <Button type="button" icon="pi pi-filter-slash" label="Clear" variant="outlined" @click="clearFilter()" class="w-full sm:w-auto" />
                    <IconField class="w-full sm:w-auto">
                        <InputIcon>
                            <i class="pi pi-search" />
                        </InputIcon>
                        <InputText v-model="filters['global'].constraints[0].value" placeholder="Keyword Search" class="w-full sm:w-auto" />
                    </IconField>
                </div>
            </template>

            <Column field="itemNo" header="Item No" sortable style="min-width: 120px">
                <template #body="slotProps">
                    <template v-if="receiveForm.ItemCount && Number(receiveForm.ItemCount) > 0">
                        <span class="font-medium">
                            {{ slotProps.data.itemNo }}
                        </span>
                    </template>
                </template>
                <template #filter="{ filterModel }">
                    <template v-if="receiveForm.ItemCount && Number(receiveForm.ItemCount) > 0">
                        <InputText v-model="filterModel.value" type="text" class="p-column-filter text-sm" placeholder="Search by item no" />
                    </template>
                </template>
            </Column>

            <Column field="description" header="Description" sortable style="min-width: 500px">
                <template #body="slotProps">
                    <template v-if="receiveForm.ItemCount && Number(receiveForm.ItemCount) > 0">
                        <span class="font-medium">
                            {{ slotProps.data.description }}
                        </span>
                    </template>
                </template>
                <template #filter="{ filterModel }">
                    <template v-if="receiveForm.ItemCount && Number(receiveForm.ItemCount) > 0">
                        <InputText v-model="filterModel.value" type="text" class="p-column-filter text-sm" placeholder="Search by description" />
                    </template>
                </template>
            </Column>

            <Column field="Quantity" header="Quantity" sortable style="min-width: 100px">
                <template #body="slotProps">
                    <template v-if="receiveForm.ItemCount && Number(receiveForm.ItemCount) > 0">
                        <span class="font-medium">
                            {{ slotProps.data.Quantity.toLocaleString() }}
                        </span>
                    </template>
                </template>
                <template #filter="{ filterModel }">
                    <template v-if="receiveForm.ItemCount && Number(receiveForm.ItemCount) > 0">
                        <InputText v-model="filterModel.value" type="text" class="p-column-filter" placeholder="Search by qty" />
                    </template>
                </template>
            </Column>
            <!-- slotProps.data.Quantity -->
            <Column field="receiveQty" header="Receive Qty" sortable style="min-width: 120px">
                <template #body="slotProps">
                    <template v-if="receiveForm.ItemCount && Number(receiveForm.ItemCount) > 0">
                        <InputNumber v-model="slotProps.data.receiveQty" :min="0" :max="slotProps.data.Quantity" placeholder="Qty" class="w-full" :format="true" :useGrouping="true" />
                        <span v-if="Number(slotProps.data.receiveQty) > Number(slotProps.data.Quantity)" class="text-red-500 text-xs"> Receive Qty must not exceed Quantity! </span>
                    </template>
                </template>
                <template #filter="{ filterModel }">
                    <template v-if="receiveForm.ItemCount && Number(receiveForm.ItemCount) > 0">
                        <InputText v-model="filterModel.value" type="text" class="p-column-filter" placeholder="Search by qty" />
                    </template>
                </template>
            </Column>

            <Column field="unitCost" header="Unit Cost" sortable style="min-width: 120px">
                <template #body="slotProps">
                    <template v-if="receiveForm.ItemCount && Number(receiveForm.ItemCount) > 0">
                        <span class="font-medium">
                            {{ slotProps.data.unitCost.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 6 }) }}
                        </span>
                    </template>
                </template>
                <template #filter="{ filterModel }">
                    <template v-if="receiveForm.ItemCount && Number(receiveForm.ItemCount) > 0">
                        <InputText v-model="filterModel.value" type="text" class="p-column-filter" placeholder="Search by unit cost" />
                    </template>
                </template>
            </Column>

            <Column field="extendedcost" header="Extended Cost" sortable style="min-width: 130px">
                <template #body="slotProps">
                    <template v-if="receiveForm.ItemCount && Number(receiveForm.ItemCount) > 0">
                        <span class="font-medium"> {{ ((Number(slotProps.data.receiveQty) || 0) * (Number(slotProps.data.unitCost) || 0)).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }} THB </span>
                    </template>
                </template>
                <template #filter="{ filterModel }">
                    <template v-if="receiveForm.ItemCount && Number(receiveForm.ItemCount) > 0">
                        <InputText v-model="filterModel.value" type="text" class="p-column-filter" placeholder="Search by extended cost" />
                    </template>
                </template>
            </Column>

            <Column field="unit" header="Unit" sortable style="min-width: 80px">
                <template #body="slotProps">
                    <template v-if="receiveForm.ItemCount && Number(receiveForm.ItemCount) > 0">
                        <span class="font-medium">
                            {{ slotProps.data.unit }}
                        </span>
                    </template>
                </template>
                <template #filter="{ filterModel }">
                    <template v-if="receiveForm.ItemCount && Number(receiveForm.ItemCount) > 0">
                        <InputText v-model="filterModel.value" type="text" class="p-column-filter text-sm" placeholder="Search by unit" />
                    </template>
                </template>
            </Column>

            <Column header="Action" style="min-width: 120px">
                <template #body="slotProps">
                    <div class="flex gap-2 items-center">
                        <!-- เฉพาะรายการที่ไม่มี PO -->
                        <Button v-if="!slotProps.data.PoNumber" icon="pi pi-pencil" severity="info" outlined @click="editNoPoFromList(slotProps.index)" />
                        <!-- ...existing code for other actions... -->
                    </div>
                </template>
            </Column>
        </DataTable>

        <div class="flex justify-end mt-4">
            <span class="font-bold text-base sm:text-lg">Receipt Subtotal: {{ grandTotal.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }} THB</span>
        </div>
    </div>

    <Dialog v-model:visible="showNoPoDialog" modal header="Add Material (No PO)" :style="{ width: '90vw', maxWidth: '1500px', height: '80vh', maxHeight: '60vh' }" contentStyle="height: 65vh; overflow-y: auto;">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div>
                <label class="block font-bold mb-1 text-sm">Invoice Number</label>
                <InputText v-model="noPoItem.invoiceNo" placeholder="Invoice No" class="w-full" />
                <span v-if="invoiceNoNoPoError" class="text-red-500 text-xs">{{ invoiceNoNoPoError }}</span>
            </div>
            <div>
                <label class="block font-bold mb-1 text-sm">Item No</label>
                <AutoComplete
                    v-model="noPoItem.itemNo"
                    :suggestions="filteredItemNoOptions"
                    @complete="filterItemNoOptions"
                    placeholder="Search or select Item No"
                    class="w-full"
                    dropdown
                    :optionLabel="(item) => item.label"
                    :optionValue="(item) => item.value"
                >
                    <template #option="slotProps">
                        <div style="white-space: normal; word-break: break-word; max-width: 300px">
                            <span class="font-semibold">{{ slotProps.option.value }}</span>
                            <span class="ml-2">{{ slotProps.option.label.split(' - ')[1] }}</span>
                        </div>
                    </template>
                </AutoComplete>
                <span v-if="itemNoNoPoError" class="text-red-500 text-xs">{{ itemNoNoPoError }}</span>
            </div>
            <div>
                <label class="block font-bold mb-1 text-sm">Location</label>
                <AutoComplete
                    v-model="noPoItem.location"
                    :suggestions="filteredLocationOptions"
                    @complete="filterLocationOptions"
                    placeholder="Search or select Location"
                    class="w-full"
                    dropdown
                    :optionLabel="(item) => `[${item.value}] ${item.label}`"
                    :optionValue="(item) => item.value"
                >
                    <template #option="slotProps">
                        <div style="white-space: normal; word-break: break-word; max-width: 300px">
                            <span class="font-semibold">[{{ slotProps.option.value }}]</span>
                            <span class="ml-2">{{ slotProps.option.label }}</span>
                        </div>
                    </template>
                </AutoComplete>
                <span v-if="locationNoPoError" class="text-red-500 text-xs">{{ locationNoPoError }}</span>
            </div>
            <div class="md:col-span-2 lg:col-span-1">
                <label class="block font-bold mb-1 text-sm">VDCODE</label>
                <AutoComplete
                    v-model="noPoItem.vdcode"
                    :suggestions="vdcodeSuggestions"
                    @complete="searchVDCODE"
                    placeholder="Search or select VDCODE"
                    class="w-full"
                    dropdown
                    :optionLabel="(item) => `[${item.code}] ${item.name}`"
                    :optionValue="(item) => item.code"
                >
                    <template #option="slotProps">
                        <div style="white-space: normal; word-break: break-word; max-width: 300px">
                            <span class="font-semibold">[{{ slotProps.option.code }}]</span>
                            <span class="ml-2">{{ slotProps.option.name }}</span>
                        </div>
                    </template>
                </AutoComplete>
                <span v-if="vdcodeNoPoError" class="text-red-500 text-xs">{{ vdcodeNoPoError }}</span>
            </div>
        </div>

        <div class="flex flex-col sm:flex-row gap-2 mt-4 mb-4">
            <Button label="Add" icon="pi pi-check" severity="success" @click="() => addNoPoItem(toast)" class="w-full sm:w-auto" />
        </div>
        <DataTable :value="noPoItems" showGridlines responsiveLayout="scroll" class="p-datatable-sm mb-4">
            <Column field="Invoice Number" header="Invoice Number" style="min-width: 150px">
                <template #body="slotProps">
                    <span>
                        {{ slotProps.data.invoiceNo }}
                    </span>
                </template>
            </Column>
            <Column field="itemNo" header="Item No" style="min-width: 120px">
                <template #body="slotProps">
                    <span>
                        <!-- ถ้าเป็น object ให้แสดง value -->
                        {{ typeof slotProps.data.itemNo === 'object' && slotProps.data.itemNo !== null && 'value' in slotProps.data.itemNo ? slotProps.data.itemNo.value : slotProps.data.itemNo }}
                    </span>
                </template>
            </Column>
            <Column field="Vdcode" header="Vdcode" style="min-width: 120px">
                <template #body="slotProps">
                    <span>
                        {{ typeof slotProps.data.vdcode === 'object' && slotProps.data.vdcode !== null && 'code' in slotProps.data.vdcode ? slotProps.data.vdcode.code : slotProps.data.vdcode || slotProps.data.VDCODE }}
                    </span>
                </template>
            </Column>
            <Column field="description" header="Description" style="min-width: 250px">
                <template #body="slotProps">
                    <span>
                        {{ slotProps.data.description }}
                    </span>
                </template>
            </Column>
            <Column field="location" header="Location" style="min-width: 120px">
                <template #body="slotProps">
                    <span>
                        {{ typeof slotProps.data.location === 'object' && slotProps.data.location !== null && 'value' in slotProps.data.location ? slotProps.data.location.value : slotProps.data.location }}
                    </span>
                </template>
            </Column>
            <Column field="unitCost" header="Unit Cost" style="min-width: 100px">
                <template #body="slotProps">
                    <span>
                        {{ slotProps.data.unitCost.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 6 }) }}
                    </span>
                </template>
            </Column>
            <Column field="receiveQty" header="Receive Qty" style="min-width: 100px">
                <template #body="slotProps">
                    <InputNumber v-model="slotProps.data.receiveQty" :min="0" class="w-full" />
                </template>
            </Column>
            <Column field="Extended Cost" header="Extended Cost" style="min-width: 100px">
                <template #body="slotProps">
                    <span> {{ ((Number(slotProps.data.receiveQty) || 0) * (Number(slotProps.data.unitCost) || 0)).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }} THB </span>
                </template>
            </Column>
            <Column field="Unit" header="Unit" style="min-width: 80px">
                <template #body="slotProps">
                    <span>
                        {{ slotProps.data.unit }}
                    </span>
                </template>
            </Column>
           <Column header="Action" style="min-width: 120px">
    <template #body="slotProps">
        <div class="flex gap-2 items-center">
            <!-- เฉพาะรายการที่ไม่มี PO -->
            <Button v-if="!slotProps.data.PoNumber"
                icon="pi pi-pencil"
                severity="info"
                outlined
                @click="editNoPoFromList(slotProps.index)" />
        </div>
    </template>
</Column>
        </DataTable>
        <div class="flex justify-end mt-2 mb-2">
            <span class="font-bold text-base sm:text-lg"> Receipt Subtotal: {{ noPoSubtotal.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }} THB </span>
        </div>
        <div class="flex flex-col sm:flex-row justify-end gap-4">
            <Button label="Cancel" @click="closeNoPoDialog" severity="danger" outlined style="background-color: #dc3545; color: #fff" class="w-full sm:w-auto order-2 sm:order-1" />
            <Button label="Save Receive No Po" @click="() => confirmSaveNoPoItems(confirm, toast)" :loading="loading" icon="pi pi-save" class="w-full sm:w-auto order-1 sm:order-2" />
        </div>
    </Dialog>

    <div class="flex flex-col sm:flex-row justify-end gap-4">
        <Button label="Cancel" @click="goBack" severity="danger" outlined style="background-color: #dc3545; color: #fff" class="w-full sm:w-auto order-2 sm:order-1" />
        <ConfirmDialog />
        <Button label="Save Receive" @click="() => confirmSave(confirm, toast)" :loading="loading" icon="pi pi-save" class="w-full sm:w-auto order-1 sm:order-2" />
    </div>
</template>
