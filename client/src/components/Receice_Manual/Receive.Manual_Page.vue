<script setup lang="ts">
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import { onMounted, reactive, ref, computed, h } from 'vue';
import { useRouter } from 'vue-router';
import { useReceiveStore } from '@/stores/receive';
import { FilterMatchMode } from '@primevue/core/api';
import type { receiveForm, receiveItems } from '@/interfaces/manual.interfaces';
import { useReceiveStore_manual } from '@/stores/receive_manual';
import { c } from 'node_modules/vite/dist/node/types.d-aGj9QkWt';
import { item } from '@primeuix/themes/aura/contextmenu';
import Dialog from 'primevue/dialog';

const receiveStore_manual = useReceiveStore_manual();
const itemNoOptions = ref<{ label: string; value: string }[]>([]);
const locationList = ref<{ label: string; value: string }[]>([]);
const filteredLocationOptions = ref<{ label: string; value: string }[]>([]);
const filteredItemNoOptions = ref<{ label: string; value: string }[]>([]);

function filterItemNoOptions(event: { query: string }) {
    if (!event.query) {
        filteredItemNoOptions.value = itemNoOptions.value.slice(0, 10);
        return;
    }
    filteredItemNoOptions.value = itemNoOptions.value
        .map(option => {
            // ตัด undefined ออกจาก label เช่น "[SMTVI] undefined" ให้เหลือแค่ "[SMTVI]"
            const label = option.label.replace(/\sundefined$/, '');
            return { ...option, label };
        })
        .filter(option => option.label.toLowerCase().includes(event.query.toLowerCase()));
}
const router = useRouter();
const toast = useToast();
const confirm = useConfirm();
const loading = ref(false);
const selectedRows = ref([]);
const poHeader = ref<any[]>([]);

// Filters for DataTable
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    itemNo: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    description: { value: null, matchMode: FilterMatchMode.CONTAINS },
    unit: { value: null, matchMode: FilterMatchMode.EQUALS },
    receiveQty: { value: null, matchMode: FilterMatchMode.EQUALS }
});

const receiveItems = ref<receiveItems[]>([]);
const receiveForm = ref<receiveForm>({
    PoNumber: '',
    receiveNumberList: [],
    receiveDate: '',
    ItemCount: 0,
    InvoiceNo: ''

    // VDCODE: '',
});

// Suggestions for VDCODE autocomplete
const vdcodeSuggestions = ref<{ code: string; name: string }[]>([]);

async function searchVDCODE(event: { query: string }) {
    const allVDCodes = await receiveStore_manual.fetchVDCODE();
    // ถ้า API ส่งมาเป็น array ของ string เช่น ['V1001|SHINDENGEN ELECTRIC MFG.CO.,LTD.', ...]
    vdcodeSuggestions.value = (allVDCodes ?? [])
        .map((item: any) => {
            if (typeof item === 'string') {
                const [code, name] = item.split('|');
                return { code: code?.trim() ?? '', name: name?.trim() ?? '' };
            }
            // ถ้าเป็น object อยู่แล้ว
            return {
                code: item.VDCODE,
                name: item.VDNAME
            };
        })
        .filter((item: { code: string; name: string }) => `[${item.code}] ${item.name}`.toLowerCase().includes(event.query.toLowerCase()));
}
// Remove item row
function removeItem(index: number) {
    receiveItems.value.splice(index, 1);
}

function filterLocationOptions(event: { query: string }) {
    if (!event.query) {
        filteredLocationOptions.value = locationList.value.slice(0, 10);
        return;
    }
    filteredLocationOptions.value = locationList.value.filter((option) => `[${option.value}] ${option.label}`.toLowerCase().includes(event.query.toLowerCase()));
}

const isFormValid = computed(() => {

    
    const hasPo = !!receiveForm.value.PoNumber || (Array.isArray(receiveForm.value.receiveNumberList) && receiveForm.value.receiveNumberList.length > 0);
    const hasValidItems = receiveItems.value.some((item) => item.itemNo && Number(item.receiveQty) > 0);
    return hasPo && hasValidItems;
});

// Save receive data
async function saveReceive() {
    if (!isFormValid.value) {
        toast.add({
            severity: 'warn',
            
            summary: 'Validation Error',
            detail: 'Please fill in all required fields',
            life: 3000
        });
        return;
    }


    try {
        loading.value = true;

         const itemsToUpdate = receiveItems.value.map(item => ({
            ItemNo: item.itemNo,
            ReceiveQty: Number(item.receiveQty)
        }));
        const invoiceNumber = String(receiveForm.value.InvoiceNo ?? '');
        // Here you would call the API to save to database
       await receiveStore_manual.updateReceiveItems(itemsToUpdate, invoiceNumber);
        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Manual receive created successfully',
            life: 3000
        });

        // กลับไปหน้า Receive List

    } catch (error) {
        console.error('Error saving manual receive:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to save manual receive',
            life: 3000
        });
    } finally {
        loading.value = false;
    }
}

// Confirm before save
function confirmSave() {
    confirm.require({
        message: 'Are you sure you want to save this manual receive?',
        header: 'Confirm Save',
        icon: 'pi pi-exclamation-triangle',
        rejectProps: {
            label: 'Cancel',
            severity: 'secondary',
            outlined: true
        },
        acceptProps: {
            label: 'Save'
        },
        accept: () => {
            saveReceive();
        }
    });
}

function goBack() {
    router.back();
}

onMounted(async () => {
    const response = await receiveStore_manual.fetchVDCODE();
    const itemList = await receiveStore_manual.fetchItemList_spec();
    const locationRaw = await receiveStore_manual.fetchLocation();

    vdcodeSuggestions.value = response ?? [];
    // แสดง ItemNo และ SPEC ใน dropdown
    itemNoOptions.value = (itemList ?? []).map((item) => ({
        label: `${item.ItemNo.trim()} - ${item.SPEC?.trim() ?? ''}`,  
        value: item.ItemNo.trim()
    }));
    locationList.value = (locationRaw ?? []).map(loc => ({
        // label: loc.LOCATION?.trim() ?? '',
        value: loc.LOCATION?.trim() ?? ''
    }));
    console.log('locationList:', locationList.value);
    console.log('itemNoOptions:', itemNoOptions.value);
    loading.value = false;
});
// เพิ่มตัวแปรสำหรับเก็บ PO Header

async function searchItemListManual() {
    loading.value = true;
    try {
        const poNumbers = receiveForm.value.receiveNumberList;
        const vdcode =
            typeof receiveForm.value.VDCODE === 'string' ? receiveForm.value.VDCODE : typeof receiveForm.value.VDCODE === 'object' && receiveForm.value.VDCODE !== null && 'code' in receiveForm.value.VDCODE ? receiveForm.value.VDCODE.code : '';
        const invoiceNumber = String(receiveForm.value.InvoiceNo ?? '');

        console.log('Searching Item List (Manual) with PO Numbers:', poNumbers, 'VDCODE:', vdcode, 'InvoiceNumber:', invoiceNumber);

        // Only search for items, don't save Invoice No to DB yet
        const result = await receiveStore_manual.fetchItemList_manual(poNumbers, vdcode);
        console.log('Fetched Item List (Manual):', result);

        // เก็บ PO Header (array แรก)
        poHeader.value = Array.isArray(result) && result.length > 0 ? result[0] : [];

        // เก็บ PO Items (array ที่สอง)
        const itemsArray = Array.isArray(result) && result.length > 1 ? result[1] : [];
        receiveItems.value = itemsArray.map((item: any) => ({
            itemNo: item.ITEMNO?.trim() ?? '',
           description: Array.isArray(item.ITEMDesc) ? item.ITEMDesc.join(', ').trim() : (item.ITEMDesc?.trim() ?? ''),
            unit: item.UNIT?.trim() ?? '',
            Quantity: item.RQRECEIVED ?? 0,
            unitCost: item.UNITCOST ?? 0,
            InvoiceNo: receiveForm.value.InvoiceNo, // Keep for display but don't save to DB yet
            PoNumber: item.PORHSEQ,
            vdcode: item.VDCODE?.trim() ?? '',
            vdname: item.VDNAME?.trim() ?? '',
            receiveQty: item.ReceiveQty ?? 0 // Initialize receiveQty to 0,
        }));

        receiveForm.value.ItemCount = receiveItems.value.length;

        console.log('PO Header:', poHeader.value);
        console.log('poNumbers:', poNumbers, 'vdcode:', vdcode, 'InvoiceNumber:', invoiceNumber);
        console.log('PO Items:', receiveItems.value);
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to fetch item list',
            life: 3000
        });
    } finally {
        loading.value = false;
    }
}
// Clear all filters
function clearFilter() {
    filters.value = {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        itemNo: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
        description: { value: null, matchMode: FilterMatchMode.CONTAINS },
        unit: { value: null, matchMode: FilterMatchMode.EQUALS },
        receiveQty: { value: null, matchMode: FilterMatchMode.EQUALS }
    };
}

const noPoItem = ref({
    itemNo: '',
    description: '',
    unit: '',
    receiveQty: 0,
    unitCost: 0,
    location: '',
    vdcode: '',
    invoiceNo: ''
});
const noPoItems = ref<any[]>([]);
const showNoPoDialog = ref(false);

function openNoPoDialog() {
    showNoPoDialog.value = true;
}
function closeNoPoDialog() {
    showNoPoDialog.value = false;
}

function addNoPoItem() {
    if (!noPoItem.value.itemNo || !noPoItem.value.location || !noPoItem.value.vdcode || !noPoItem.value.invoiceNo) {
        toast.add({
            severity: 'warn',
            summary: 'Validation Error',
            detail: 'Please fill all required fields for No PO item',
            life: 3000
        });
        return;
    }
    // Add to noPoItems array
    noPoItems.value.push({ ...noPoItem.value });
    // reset form
    noPoItem.value = {
        itemNo: '',
        description: '',
        unit: '',
        receiveQty: 0,
        unitCost: 0,
        location: '',
        vdcode: '',
        invoiceNo: ''
    };
    // ไม่ปิด Dialog
}

// Remove No PO item row
function removeNoPoItem(index: number) {
    noPoItems.value.splice(index, 1);
}

const grandTotal = computed(() =>
    receiveItems.value.reduce((sum, item) => {
        const qty = Number(item.receiveQty) || 0;
        const cost = Number(item.unitCost) || 0;
        return sum + qty * cost;
    }, 0)
);
</script>

<template>
    <div class="card mb-6">
        <Button icon="pi pi-arrow-left" @click="goBack" severity="secondary" outlined class="mb-4" />
        <div class="flex items-center gap-4 mb-6">
            <div class="text-xl sm:text-2xl font-bold">Manual Receive</div>
        </div>

        <!-- Header Information -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <div class="space-y-2">
                <label for="InvoiceNo" class="block font-bold text-sm">Invoice Number</label>
                <InputText
                    :modelValue="String(receiveForm.InvoiceNo ?? '')"
                    @update:modelValue="(val) => (receiveForm.InvoiceNo = String(val))"
                    placeholder="Invoice Number"
                    class="w-full"
                    :inputStyle="{ minHeight: '40px', fontSize: '1rem' }"
                />
            </div>
            <div class="space-y-2">
                <label for="PoNumber" class="block font-bold text-sm">Po Number</label>
                <Chips 
                    v-model="receiveForm.receiveNumberList" 
                    separator="," 
                    addOnBlur 
                    placeholder="Po Number" 
                    class="w-full" 
                    :inputStyle="{ minHeight: '25px', fontSize: '1rem' }" 
                />
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
            </div>
        </div>
        
        <div class="flex flex-col sm:flex-row gap-4 mb-6">
            <Button 
                label="search" 
                icon="pi pi-search" 
                severity="success" 
                @click="searchItemListManual" 
                outlined 
                style="background-color: #22c55e; color: #fff" 
                class="w-full sm:w-auto"
            />
        
        <Button 
            label="Add Item (No PO)" 
            icon="pi pi-plus" 
            severity="info" 
            outlined 
            @click="openNoPoDialog" 
            class="w-full sm:w-auto"
        />
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
            :globalFilterFields="['itemNo', 'description', 'unit', 'receiveQty']"
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
                        <InputText v-model="filters['global'].value" placeholder="Keyword Search" class="w-full sm:w-auto" />
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
                            {{ slotProps.data.Quantity.toLocaleString()}}
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
                        <InputNumber v-model="slotProps.data.receiveQty" :min="0" placeholder="Qty" class="w-full" :format="true" :useGrouping="true" />
                    </template>
                </template>
                <template #filter="{ filterModel }">
                    <template v-if="receiveForm.ItemCount && Number(receiveForm.ItemCount) > 0">
                        <InputText v-model="filterModel.value" type="text" class="p-column-filter" placeholder="Search by qty" />
                    </template>
                </template>
            </Column>
            
            <Column field="Unit Cost" header="Unit Cost" sortable style="min-width: 120px">
                <template #body="slotProps">
                    <template v-if="receiveForm.ItemCount && Number(receiveForm.ItemCount) > 0">
                        <span class="font-medium">
                            {{ slotProps.data.unitCost.toLocaleString() }}
                        </span>
                    </template>
                </template>
                <template #filter="{ filterModel }">
                    <template v-if="receiveForm.ItemCount && Number(receiveForm.ItemCount) > 0">
                        <InputText v-model="filterModel.value" type="text" class="p-column-filter" placeholder="Search by unit cost" />
                    </template>
                </template>
            </Column>
            
            <Column field="Extended Cost" header="Extended Cost" sortable style="min-width: 130px">
                <template #body="slotProps">
                    <template v-if="receiveForm.ItemCount && Number(receiveForm.ItemCount) > 0">
                        <span class="font-medium">
                            {{ ((Number(slotProps.data.receiveQty) || 0) * (Number(slotProps.data.unitCost) || 0)).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }} THB
                        </span>
                    </template>
                </template>
                <template #filter="{ filterModel }">
                    <template v-if="receiveForm.ItemCount && Number(receiveForm.ItemCount) > 0">
                        <InputText v-model="filterModel.value" type="text" class="p-column-filter" placeholder="Search by extended cost" />
                    </template>
                </template>
            </Column>

            <Column field="Unit" header="Unit" sortable style="min-width: 80px">
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
        </DataTable>
        
        <div class="flex justify-end mt-4">
            <span class="font-bold text-base sm:text-lg">Receipt Subtotal: {{ grandTotal.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }} THB</span>
        </div>
    </div>

   

    <Dialog 
        v-model:visible="showNoPoDialog" 
        modal 
        header="Add Item (No PO)" 
        :style="{ width: '90vw', maxWidth: '1200px', height: '80vh', maxHeight: '50vh' }"
        contentStyle="height: 65vh; overflow-y: auto;"
    >
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div>
                <label class="block font-bold mb-1 text-sm">Invoice Number</label>
                <InputText v-model="noPoItem.invoiceNo" placeholder="Invoice No" class="w-full" />
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
            </div>
        </div>
   
        <div class="flex flex-col sm:flex-row gap-2 mt-4 mb-4">
            <Button label="Add" icon="pi pi-check" severity="success" @click="addNoPoItem" class="w-full sm:w-auto" />
            <Button label="Close" icon="pi pi-times" severity="danger" outlined @click="closeNoPoDialog" class="w-full sm:w-auto" />
        </div>
        <DataTable :value="noPoItems" showGridlines responsiveLayout="scroll" class="p-datatable-sm mb-4">
            <Column field="itemNo" header="Item No" style="min-width: 120px" />
            <Column field="description" header="Description" style="min-width: 250px" />
            <Column field="location" header="Location" style="min-width: 120px" />
            <Column field="unitCost" header="Unit Cost" style="min-width: 100px">
                <template #body="slotProps">
                    <InputNumber v-model="slotProps.data.unitCost" :min="0" class="w-full" />
                </template>
            </Column>
            <Column field="receiveQty" header="Receive Qty" style="min-width: 100px">
                <template #body="slotProps">
                    <InputNumber v-model="slotProps.data.receiveQty" :min="0" class="w-full" />
                </template>
            </Column>
            <Column field="Unit" header="Unit" style="min-width: 80px">
                <template #body="slotProps">
                    <InputText v-model="slotProps.data.unit" class="w-full" />
                </template>
            </Column>
            <Column header="Action" style="min-width: 80px">
                <template #body="slotProps">
                    <Button icon="pi pi-trash" severity="danger" outlined @click="removeNoPoItem(slotProps.index)" />
                </template>
            </Column>
        </DataTable>
         <div class="flex flex-col sm:flex-row justify-end gap-4">
        <Button 
            label="Cancel" 
            @click="goBack" 
            severity="danger" 
            outlined 
            style="background-color: #dc3545; color: #fff" 
            class="w-full sm:w-auto order-2 sm:order-1"
        />
        <ConfirmDialog />
        <Button 
            label="Save Receive No Po" 
            @click="confirmSave" 
            :loading="loading" 
            
            icon="pi pi-save" 
            class="w-full sm:w-auto order-1 sm:order-2"
        />
    </div>
    </Dialog>

    <div class="flex flex-col sm:flex-row justify-end gap-4">
        <Button 
            label="Cancel" 
            @click="goBack" 
            severity="danger" 
            outlined 
            style="background-color: #dc3545; color: #fff" 
            class="w-full sm:w-auto order-2 sm:order-1"
        />
        <ConfirmDialog />
        <Button 
            label="Save Receive" 
            @click="confirmSave" 
            :loading="loading" 
            
            icon="pi pi-save" 
            class="w-full sm:w-auto order-1 sm:order-2"
        />
    </div>
</template>
