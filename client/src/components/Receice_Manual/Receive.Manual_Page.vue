<script setup lang="ts">
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import { onMounted, reactive, ref, computed, h } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useReceiveStore } from '@/stores/receive';
import { FilterMatchMode, FilterOperator } from '@primevue/core/api';
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
        .map((option) => {
            // ตัด undefined ออกจาก label เช่น "[SMTVI] undefined" ให้เหลือแค่ "[SMTVI]"
            const label = option.label.replace(/\sundefined$/, '');
            return { ...option, label };
        })
        .filter((option) => option.label.toLowerCase().includes(event.query.toLowerCase()));
}
const router = useRouter();
const route = useRoute();
const toast = useToast();
const confirm = useConfirm();
const loading = ref(false);
const pageLoading = ref(false); // Add full-page loading state
const selectedRows = ref([]);
const poHeader = ref<any[]>([]);

// Filters for DataTable

const filters = ref({
    global: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
    itemNo: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
    description: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
    unit: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }] },
    receiveQty: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }] },
    Quantity: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }] },
    unitCost: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }] },
    extendedcost: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }] },
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
// function removeItem(index: number) {
//     receiveItems.value.splice(index, 1);
// }
function confirmRemoveNoPoItem(index: number) {
    confirm.require({
        message: 'Are you sure you want to delete this item?',
        header: 'Confirm Delete',
        icon: 'pi pi-exclamation-triangle',
        rejectProps: {
            label: 'Cancel',
            severity: 'secondary',
            outlined: true
        },
        acceptProps: {
            label: 'Delete',
            severity: 'danger'
        },
        accept: () => {
            removeNoPoItem(index);
        }
    });
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

        const itemsToUpdate = receiveItems.value.map((item) => ({
            ItemNo: item.itemNo,
            ReceiveQty: Number(item.receiveQty),
            
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

async function viewManualDetail() {
    pageLoading.value = true; // Start full-page loading
    const invoiceNumber = route.query.invoiceNumber;
    const poNumber = route.query.poNumber;
    receiveForm.value.PoNumber = poNumber ? String(poNumber) : '';
   if (receiveForm.value.PoNumber) {
        const poArr = String(receiveForm.value.PoNumber).split(',').map(p => p.trim()).filter(p => p);
        // เพิ่ม PO ที่ยังไม่มีใน receiveNumberList
        poArr.forEach(po => {
            if (!receiveForm.value.receiveNumberList.includes(po)) {
                receiveForm.value.receiveNumberList.push(po);
            }
        });
    }
    if (invoiceNumber) {
        const detail = await receiveStore_manual.showItem_manual_detail(
            String(invoiceNumber),
            poNumber ? String(poNumber) : '' // ส่ง poNumber เฉพาะเมื่อมี
        );
        receiveItems.value = Array.isArray(detail) ? detail.map((item: any) => ({
            itemNo: item.ITEMNO?.trim() ?? '',
            description: item.ITEMDESC?.trim() ?? '',
            unit: item.UNIT?.trim() ?? '',
            receiveQty: item.ReceiveQty ?? 0,
            Quantity: item.Quantity ?? item.RQRECEIVED ?? item.ReceiveQty ?? 0,
            lotNo: item.lotNo ?? '',
            expireDate: item.expireDate ?? '',
            remark: item.remark ?? '',
            unitCost: item.UNITCOST ?? 0,
            iqaRequired: item.iqaRequired ?? false,
            lotRequired: item.lotRequired ?? false,
            ReceiveQty: item.ReceiveQty ?? 0,
            extendedcost: ((Number(item.ReceiveQty ?? 0)) * (Number(item.UNITCOST ?? 0))),
            PoNumber: item.PORHSEQ ?? '' // <-- เพิ่มตรงนี้
        })) : [];
        receiveForm.value.InvoiceNo = String(invoiceNumber);
        receiveForm.value.PoNumber = poNumber ? String(poNumber) : '';
        receiveForm.value.ItemCount = receiveItems.value.length;
        console.log('Loaded Manual Detail:', receiveItems.value);
    }
    pageLoading.value = false; // End full-page loading
}

onMounted(async () => {
    pageLoading.value = true; // Start full-page loading
    const response = await receiveStore_manual.fetchVDCODE();
    const itemList = await receiveStore_manual.fetchItemList_spec();
    const locationRaw = await receiveStore_manual.fetchLocation();
    viewManualDetail();
    
    vdcodeSuggestions.value = response ?? [];
    // แสดง ItemNo และ SPEC ใน dropdown
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
    loading.value = false;
    pageLoading.value = false; // End full-page loading
});

async function searchItemListManual() {
    pageLoading.value = true; // Start full-page loading
    try {
        const poNumbers = receiveForm.value.receiveNumberList;
        const vdcode =
            typeof receiveForm.value.VDCODE === 'string' ? receiveForm.value.VDCODE : typeof receiveForm.value.VDCODE === 'object' && receiveForm.value.VDCODE !== null && 'code' in receiveForm.value.VDCODE ? receiveForm.value.VDCODE.code : '';
        const invoiceNumber = String(receiveForm.value.InvoiceNo ?? '');

        console.log('Searching Item List (Manual) with PO Numbers:', poNumbers, 'VDCODE:', vdcode, 'InvoiceNumber:', invoiceNumber);

        // Only search for items, don't save Invoice No to DB yet
        const result = await receiveStore_manual.fetchItemList_manual(poNumbers, vdcode, invoiceNumber);
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
        pageLoading.value = false; // End full-page loading
    }
}
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
        extendedcost: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }] },
    };
}
function confirmSaveNoPoItems() {
    confirm.require({
        message: 'Are you sure you want to save these No PO items?',
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
            saveNoPoItems();
        }
    });
}

async function saveNoPoItems() {
    if (!noPoItems.value.length) {
        console.log('Validation Error: noPoItems.value =', noPoItems.value);
        toast.add({
            severity: 'warn',
            summary: 'Validation Error',
            detail: 'Please add at least one No PO item',
            life: 3000
        });
        return;
    }
    try {
        loading.value = true;
        // ส่งทุกแถวใน noPoItems.value ไปยัง API
        for (const item of noPoItems.value) {
            const VENDORCODE = typeof item.vdcode === 'object' && item.vdcode !== null && 'code' in item.vdcode ? item.vdcode.code : (item.vdcode ?? '');
            const itemNoStr = typeof item.itemNo === 'object' && item.itemNo !== null && 'value' in item.itemNo ? item.itemNo.value : (item.itemNo ?? '');
            const invoiceNumber = item.invoiceNo ?? '';
            const locationStr = typeof item.location === 'object' && item.location !== null && 'value' in item.location ? item.location.value : item.location;
            await receiveStore_manual.fetchInsertNoPoItem(
                VENDORCODE,
                invoiceNumber,
                Number(item.receiveQty) ?? 0,
                itemNoStr,
                locationStr
            );
        }
        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: 'No PO items saved successfully',
            life: 3000
        });
        // showNoPoDialog.value = false;
        noPoItems.value = [];
    }catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to save No PO items',
            life: 3000
        });
    } finally {
        loading.value = false;
    }
}
interface NoPoItemType {
    itemNo: string | { label: string; value: string };
    description: string;
    unit: string;
    receiveQty: number;
    unitCost: number;
    location: string | { label: string; value: string };
    vdcode: string | { code: string; name: string };
    invoiceNo: string;
}
const noPoItem = ref<NoPoItemType>({
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
    // รีเซ็ตข้อมูลใน Dialog
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
    noPoItems.value = [];
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
    const itemNoStr = typeof noPoItem.value.itemNo === 'object' && noPoItem.value.itemNo !== null && 'value' in noPoItem.value.itemNo ? noPoItem.value.itemNo.value : String(noPoItem.value.itemNo);
    const locationStr = typeof noPoItem.value.location === 'object' && noPoItem.value.location !== null && 'value' in noPoItem.value.location ? noPoItem.value.location.value : String(noPoItem.value.location);

    receiveStore_manual.fetchItemList_lotSplit(itemNoStr, locationStr).then((lotSplitData) => {
        // ใช้ lotSplitData[0] เพราะ API ส่งมาเป็น array
        const apiData = Array.isArray(lotSplitData) ? lotSplitData[0] : lotSplitData;
        if (!apiData) {
            toast.add({
                severity: 'error',
                summary: 'Error',
                detail: 'No item data found from API',
                life: 3000
            });
            return;
        }
        noPoItem.value.description = apiData.ITEMDesc ?? '';
        noPoItems.value.push({
            ...noPoItem.value,
            description: apiData.ITEMDesc ?? '',
            unit: apiData.UNIT ?? '',
            unitCost: apiData.RECENTCOST ?? 0,
            location: apiData.LOCATION ?? noPoItem.value.location
        });
        noPoItem.value = {
            itemNo: '',
            description: '',
            unit: '',
            receiveQty: 0,
            unitCost: 0,
            location: '',
            vdcode: '',
            invoiceNo: noPoItem.value.invoiceNo // เก็บ Invoice No ไว้
        };
    });
}

// Remove No PO item row
function removeNoPoItem(index: number) {
    noPoItems.value.splice(index, 1);
}

// Edit No PO item row
function editNoPoItem(index: number) {
    const item = noPoItems.value[index];
    if (item) {
        noPoItem.value = { ...item };
        // Optionally remove the item from the list so it can be re-added after editing
        noPoItems.value.splice(index, 1);
    }
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
    <!-- Full Page Loading Overlay -->
    <div
        v-if="pageLoading"
        class="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50"
        style="backdrop-filter: blur(2px); z-index: 1000;"
    >
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
            </div>
            <div class="space-y-2">
                <label for="PoNumber" class="block font-bold text-sm">Po Number</label>
                <Chips v-model="receiveForm.receiveNumberList " separator="," addOnBlur placeholder="Po Number" class="w-full" :inputStyle="{ minHeight: '25px', fontSize: '1rem' }" 
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
            <Button label="search" icon="pi pi-search" severity="success" @click="searchItemListManual" outlined style="background-color: #22c55e; color: #fff" class="w-full sm:w-auto" />

            <Button label="Add Item (No PO)" icon="pi pi-plus" severity="info" outlined @click="openNoPoDialog" class="w-full sm:w-auto" />
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
            :globalFilterFields="['itemNo', 'description', 'unit', 'receiveQty','Quantity','unitCost','extendedcost']"
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
                        <InputNumber v-model="slotProps.data.receiveQty" :min="0" placeholder="Qty" class="w-full" :format="true" :useGrouping="true" />
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
        </DataTable>

        <div class="flex justify-end mt-4">
            <span class="font-bold text-base sm:text-lg">Receipt Subtotal: {{ grandTotal.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }} THB</span>
        </div>
    </div>

    <Dialog v-model:visible="showNoPoDialog" modal header="Add Item (No PO)" :style="{ width: '90vw', maxWidth: '1500px', height: '80vh', maxHeight: '60vh' }" contentStyle="height: 65vh; overflow-y: auto;">
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
                         <Button icon="pi pi-pencil" severity="info" outlined @click="editNoPoItem(slotProps.index)" />
                         <Button icon="pi pi-trash" severity="danger" outlined @click="confirmRemoveNoPoItem(slotProps.index)" />
                    </div>
                </template>
            </Column>
        </DataTable>
        <div class="flex flex-col sm:flex-row justify-end gap-4">
            <Button label="Cancel" @click="closeNoPoDialog" severity="danger" outlined style="background-color: #dc3545; color: #fff" class="w-full sm:w-auto order-2 sm:order-1" />
            <Button label="Save Receive No Po" @click="confirmSaveNoPoItems" :loading="loading" icon="pi pi-save" class="w-full sm:w-auto order-1 sm:order-2" />
        </div>
    </Dialog>

    <div class="flex flex-col sm:flex-row justify-end gap-4">
        <Button label="Cancel" @click="goBack" severity="danger" outlined style="background-color: #dc3545; color: #fff" class="w-full sm:w-auto order-2 sm:order-1" />
        <ConfirmDialog />
        <Button label="Save Receive" @click="confirmSave" :loading="loading" icon="pi pi-save" class="w-full sm:w-auto order-1 sm:order-2" />
    </div>
</template>
